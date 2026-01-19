import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Auditoria } from '../../entities/auditoria.entity';
import { DetalleAuditoria } from '../../entities/detalle-auditoria.entity';
import { Producto } from '../../entities/producto.entity';
import { Usuario } from '../../entities/usuario.entity';
import { ProductoService } from '../producto/producto.service';
import { ConfiguracionService } from '../configuracion/configuracion.service';
import { CajaService } from '../caja/caja.service';
import { NuevaAuditoriaDTO } from './dto/nueva-auditoria.dto';
import { ConteoDTO } from './dto/conteo.dto';
import { AuditoriaDTO } from './dto/auditoria.dto';
import { AccionAuditoria } from '../../enums/accion-auditoria.enum';
import { EstadoControl } from '../../enums/estado-control.enum';
import { EstadoAuditoria } from '../../enums/estado-auditoria.enum';

@Injectable()
export class AuditoriaService {
  constructor(
    @InjectRepository(Auditoria)
    private auditoriaRepository: Repository<Auditoria>,
    @InjectRepository(DetalleAuditoria)
    private detalleAuditoriaRepository: Repository<DetalleAuditoria>,
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    private productoService: ProductoService,
    private configuracionService: ConfiguracionService,
    private cajaService: CajaService,
  ) {}

  async iniciarAuditoria(idUsuario: number): Promise<NuevaAuditoriaDTO> {
    const usuario = await this.usuarioRepository.findOneBy({ idUsuario });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    // 1. Buscar si hay una auditoría pendiente para este usuario (o general)
    // Asumimos que es por usuario según la lógica anterior, pero si se quiere que sea única por tienda, quitar el where usuario.
    // Dado que el requerimiento habla de "el empleado", mantenemos el filtro por usuario o permitimos re-abrir la que esté pendiente suya.
    const auditoriaPendiente = await this.auditoriaRepository.findOne({
      where: {
        usuario: { idUsuario },
        estado: EstadoAuditoria.PENDIENTE,
      },
      relations: ['detalles', 'detalles.producto', 'detalles.producto.categoria'],
    });

    if (auditoriaPendiente) {
      return {
        idAuditoria: auditoriaPendiente.idAuditoria,
        items: auditoriaPendiente.detalles.map((d) => ({
          idDetalleAuditoria: d.idDetalleAuditoria,
          producto: d.producto.nombre,
          categoria: d.producto.categoria ? d.producto.categoria.nombre : '',
          cantidadSistema: d.cantidadSistema ?? 0, // Puede ser null si se acaba de crear
        })),
      };
    }

    // 2. Si no hay pendiente, crear una nueva
    const config = await this.configuracionService.obtenerConfiguracion();
    let limit = config.cantProductosRevision;
    if (!limit || limit <= 0) limit = 3;

    // Random selection for MySQL
    const productos = await this.productoRepository
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.categoria', 'categoria')
      .orderBy('RAND()')
      .take(limit)
      .getMany();

    const auditoria = this.auditoriaRepository.create({
      fechaHora: new Date(),
      usuario,
      estado: EstadoAuditoria.PENDIENTE,
      detalles: [],
    });

    const savedAuditoria = await this.auditoriaRepository.save(auditoria);

    const detalles: DetalleAuditoria[] = [];
    for (const producto of productos) {
      const detalle = this.detalleAuditoriaRepository.create({
        auditoria: savedAuditoria,
        producto,
        cantidadSistema: null, // Se define al confirmar
        cantidadReal: 0,
        estadoControl: EstadoControl.FALTANTE, // Estado inicial por defecto, aunque irrelevante hasta confirmar
      });
      const savedDetalle = await this.detalleAuditoriaRepository.save(detalle);
      detalles.push(savedDetalle);
    }

    savedAuditoria.detalles = detalles;

    return {
      idAuditoria: savedAuditoria.idAuditoria,
      items: detalles.map((d) => ({
        idDetalleAuditoria: d.idDetalleAuditoria,
        producto: d.producto.nombre,
        categoria: d.producto.categoria ? d.producto.categoria.nombre : '',
        cantidadSistema: 0, // Null al inicio
      })),
    };
  }

  async registrarConteo(idAuditoria: number, conteos: ConteoDTO[]): Promise<void> {
    const auditoria = await this.auditoriaRepository.findOne({ 
        where: { idAuditoria },
        relations: ['usuario'] 
    });
    if (!auditoria) throw new NotFoundException('Auditoría no encontrada');

    // Permitimos actualizar si está PENDIENTE o A_REVISAR (si se quisiera corregir).
    // Pero el requerimiento principal es el cierre. Asumimos que esto Finaliza la auditoría (o la pasa a revisión).

    let allApproved = true;

    for (const conteo of conteos) {
      const detalle = await this.detalleAuditoriaRepository.findOne({
        where: { idDetalleAuditoria: conteo.idDetalleAuditoria },
        relations: ['auditoria', 'producto'],
      });

      if (!detalle) throw new NotFoundException(`Detalle ${conteo.idDetalleAuditoria} no encontrado`);
      if (detalle.auditoria.idAuditoria !== idAuditoria) continue;

      // MOMENTO DE SNAPSHOT: Ahora asignamos la cantidad del sistema actual
      // Solo si estaba pendiente (o null), o siempre actualizamos al confirmar?
      // "...entonces recién ahí se asignan los valores correspondientes con el stock actual en el sistema"
      // Asumimos que siempre se toma el stock actual al momento de confirmar.
      detalle.cantidadSistema = detalle.producto.stock;
      detalle.cantidadReal = conteo.cantidadReal;

      if (detalle.cantidadReal === detalle.cantidadSistema) {
        detalle.estadoControl = EstadoControl.APROBADO;
      } else {
        detalle.estadoControl = EstadoControl.FALTANTE; // Discrepancia
        allApproved = false;
      }
      await this.detalleAuditoriaRepository.save(detalle);
    }

    // Actualizar estado de la auditoría
    auditoria.estado = allApproved ? EstadoAuditoria.FINALIZADA : EstadoAuditoria.A_REVISAR;
    await this.auditoriaRepository.save(auditoria);

    // [CAJA] Si se finaliza o manda a revisar (se completó el conteo), actualizamos Arqueo
    if (auditoria.usuario) {
        await this.cajaService.marcarStockControlRealizado(auditoria.usuario.idUsuario);
    }
  }

  async resolverDetalle(idDetalle: number, accion: AccionAuditoria): Promise<void> {
    const detalle = await this.detalleAuditoriaRepository.findOne({
      where: { idDetalleAuditoria: idDetalle },
      relations: ['auditoria', 'producto'],
    });
    if (!detalle) throw new NotFoundException('Detalle no encontrado');

    if (detalle.estadoControl !== EstadoControl.FALTANTE) {
      throw new BadRequestException('El detalle no está pendiente de revisión');
    }

    if (accion === AccionAuditoria.AJUSTAR) {
      const cantSistema = detalle.cantidadSistema ?? 0;
      const cantReal = detalle.cantidadReal;
      const diff = cantReal - cantSistema;

      await this.productoService.ajustarStock(detalle.producto.idProducto, diff);
      detalle.estadoControl = EstadoControl.REVISADO_CON_AJUSTE;
    } else {
      detalle.estadoControl = EstadoControl.REVISADO_SIN_AJUSTE;
    }

    await this.detalleAuditoriaRepository.save(detalle);

    // Check if audit is finished
    const allDetalles = await this.detalleAuditoriaRepository.find({
      where: { auditoria: { idAuditoria: detalle.auditoria.idAuditoria } },
    });
    
    // Si todos los detalles están OK (No Faltante), entonces finalizada.
    const allFinished = allDetalles.every((d) => d.estadoControl !== EstadoControl.FALTANTE);

    if (allFinished) {
      detalle.auditoria.estado = EstadoAuditoria.FINALIZADA;
      await this.auditoriaRepository.save(detalle.auditoria);
    }
  }

  async agregarObservacion(idAuditoria: number, observacion: string): Promise<void> {
    const auditoria = await this.auditoriaRepository.findOneBy({ idAuditoria });
    if (!auditoria) throw new NotFoundException('Auditoría no encontrada');
    auditoria.observacion = observacion;
    await this.auditoriaRepository.save(auditoria);
  }

  async obtenerAuditorias(): Promise<AuditoriaDTO[]> {
    const auditorias = await this.auditoriaRepository.find({
      relations: ['usuario', 'detalles', 'detalles.producto', 'detalles.producto.categoria'],
      order: { fechaHora: 'DESC' },
    });

    return auditorias.map((a) => ({
      idAuditoria: a.idAuditoria,
      fechaHora: a.fechaHora,
      usuario: a.usuario ? a.usuario.nombre : 'Desconocido',
      observacion: a.observacion,
      estado: a.estado, // Mapeamos el enum
      detalles: a.detalles.map((d) => ({
        idDetalleAuditoria: d.idDetalleAuditoria,
        producto: d.producto ? d.producto.nombre : '',
        categoria: d.producto && d.producto.categoria ? d.producto.categoria.nombre : '',
        cantidadSistema: d.cantidadSistema ?? 0,
        cantidadReal: d.cantidadReal,
        estadoControl: d.estadoControl,
      })),
    }));
  }
}
