import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Venta } from '../../entities/venta.entity';
import { DetalleVenta } from '../../entities/detalle-venta.entity';
import { Producto } from '../../entities/producto.entity';

import { Usuario } from '../../entities/usuario.entity';
import { VentaDTO } from './dto/venta.dto';
import { DetalleVentaDTO } from './dto/detalle-venta.dto';
import { VentaListaDTO } from './dto/venta-lista.dto';
import { CatalogoDTO } from './dto/catalogo.dto';
import { ProductoService } from '../producto/producto.service';
import { ConfiguracionService } from '../configuracion/configuracion.service';
import { MetodoDePago } from '../../enums/metodo-de-pago.enum';
import { TipoDescuento } from '../../enums/tipo-descuento.enum';

@Injectable()
export class VentaService {
  constructor(
    @InjectRepository(Venta)
    private readonly ventaRepository: Repository<Venta>,
    @InjectRepository(DetalleVenta)
    private readonly detalleVentaRepository: Repository<DetalleVenta>,
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,

    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly productoService: ProductoService,
    private readonly configuracionService: ConfiguracionService,
  ) {}

  async nuevaVenta(idUsuario: number, dto: VentaDTO): Promise<Venta> {
    const usuario = await this.usuarioRepository.findOneBy({ idUsuario });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const venta = this.ventaRepository.create({
      ...dto,
      fechaHora: new Date(),
      usuario,
      detalles: [],
    });

    // Calculate total first (we need to process details temporarily to get total)
    // But we won't save them yet.
    
    const detallesTemp: DetalleVenta[] = [];
    
    // 1. Verificación de Stock (Pre-check)
    const productosSinStock: string[] = [];
    
    for (const detalleDto of dto.detalles) {
      if (detalleDto.idProducto) {
        const producto = await this.productoRepository.findOneBy({ idProducto: detalleDto.idProducto });
        if (!producto) {
            // Si no existe, lo ignoramos aqui, saltara en el procesarDetalle o lo agregamos a error? 
            // Mejor fallar rapido.
             throw new NotFoundException(`Producto con ID ${detalleDto.idProducto} no encontrado`);
        }
        
        if (producto.stock < detalleDto.cantidad) {
          productosSinStock.push(producto.nombre);
        }
      }
    }

    if (productosSinStock.length > 0) {
      throw new BadRequestException(
        `Stock insuficiente para los siguientes productos: ${productosSinStock.join(', ')}`
      );
    }
    
    // Let's iterate to calculate total.
    let total = 0;
    for (const detalleDto of dto.detalles) {
       const detalle = await this.procesarDetalle(detalleDto, venta);
       detallesTemp.push(detalle);
       total += (detalle.precioUnitario * detalle.cantidad);
    }
    
    if (dto.montoAdicional && dto.montoAdicional > 0) {
      total += dto.montoAdicional;
    }

    let descuento = 0;
    let tipoDescuento = dto.tipoDescuento;
    let porcentajeAplicado = dto.porcentajeAplicado;

    if (tipoDescuento === TipoDescuento.AUTOMATICO) {
      const config = await this.configuracionService.obtenerConfiguracion();
      
      const configMethods = config.metodosPagoDescuento || [];
      const isAllowedMethod = configMethods.includes(dto.metodoDePago);
      
      // Calcular total elegible solo si el descuento automático está habilitado globalmente
      let totalElegible = 0;
      
      if (config.descuentoAutomatico) {
        for (const detalle of detallesTemp) {
          if (detalle.producto && detalle.producto.categoria) {
            // Verificar si la categoría tiene descuento automático habilitado
            if (detalle.producto.categoria.aplicaDescuentoAutomatico) {
              const subtotal = detalle.precioUnitario * detalle.cantidad;
              totalElegible += subtotal;
            }
          }
          // Productos sin categoría o con descuento deshabilitado no suman
        }
      }
      
      // IMPORTANTE: Validar monto mínimo contra el total COMPLETO de la venta
      // pero aplicar descuento solo sobre totalElegible
      if (config.descuentoAutomatico && total > config.montoMinimo && isAllowedMethod && totalElegible > 0) {
        porcentajeAplicado = config.porcentajeDescuento;
        descuento = totalElegible * (porcentajeAplicado / 100);
      } else {
        tipoDescuento = TipoDescuento.NINGUNO;
      }
    } else if (tipoDescuento === TipoDescuento.PORCENTAJE) {
      if (porcentajeAplicado !== undefined && porcentajeAplicado > 0) {
        descuento = total * (porcentajeAplicado / 100);
      }
    } else if (tipoDescuento === TipoDescuento.MONTO) {
      if (dto.descuento) {
        descuento = dto.descuento;
      }
    } else {
      tipoDescuento = TipoDescuento.NINGUNO;
    }

    if (descuento > 0) {
      total -= descuento;
    }

    venta.descuento = Math.round(descuento);
    venta.tipoDescuento = tipoDescuento;
    venta.porcentajeAplicado = porcentajeAplicado ?? null;
    venta.total = Math.round(total);

    // Don't set details yet to avoid cascade issues
    const ventaParaGuardar = this.ventaRepository.create({ ...venta, detalles: [] });
    const ventaGuardada = await this.ventaRepository.save(ventaParaGuardar);

    const detallesGuardados: DetalleVenta[] = [];
    for (const detalleDto of dto.detalles) {
      const detalle = await this.procesarDetalle(detalleDto, ventaGuardada);
      const detalleGuardado = await this.detalleVentaRepository.save(detalle);
      detallesGuardados.push(detalleGuardado);
    }
    ventaGuardada.detalles = detallesGuardados;

    // Deduct stock
    for (const detalle of ventaGuardada.detalles) {
      if (detalle.producto) {
        await this.productoService.descontarStock(detalle.producto.idProducto, detalle.cantidad);
      }
    }

    return ventaGuardada;
  }

  private async procesarDetalle(dto: DetalleVentaDTO, venta: Venta): Promise<DetalleVenta> {
    const detalle = this.detalleVentaRepository.create({
      cantidad: dto.cantidad,
      venta,
    });

    if (dto.idProducto) {
      const producto = await this.productoRepository.findOne({
        where: { idProducto: dto.idProducto },
        relations: ['categoria'],
      });
      if (!producto) throw new NotFoundException('Producto no encontrado');
      detalle.producto = producto;
      detalle.precioUnitario = producto.precio;
    }

    return detalle;
  }

  async obtenerCatalogo(): Promise<CatalogoDTO[]> {
    const productos = await this.productoRepository.find({
      where: { estado: true },
      relations: ['categoria'],
    });

    const catalogoProductos: CatalogoDTO[] = productos.map(p => ({
      tipo: 'Producto',
      id: p.idProducto,
      nombre: p.nombre,
      precioFinal: p.precio,
      idCategoria: p.categoria?.idCategoria,
      aplicaDescuentoAutomatico: p.categoria?.aplicaDescuentoAutomatico ?? false,
    }));

    return catalogoProductos;
  }

  async obtenerVentas(
    page: number,
    size: number,
    fechaInicio?: Date,
    fechaFin?: Date,
    idUsuario?: number,
    metodoDePago?: MetodoDePago,
  ): Promise<any> {
    const query = this.ventaRepository.createQueryBuilder('venta')
      .leftJoinAndSelect('venta.usuario', 'usuario')
      .leftJoinAndSelect('venta.detalles', 'detalles')
      .leftJoinAndSelect('detalles.producto', 'producto')
      .orderBy('venta.fechaHora', 'DESC');

    if (fechaInicio) {
      query.andWhere('venta.fechaHora >= :fechaInicio', { fechaInicio });
    }
    if (fechaFin) {
      // Add one day to include the end date fully if it's just a date
      const nextDay = new Date(fechaFin);
      nextDay.setDate(nextDay.getDate() + 1);
      query.andWhere('venta.fechaHora < :fechaFin', { fechaFin: nextDay });
    }
    if (idUsuario) {
      query.andWhere('usuario.idUsuario = :idUsuario', { idUsuario });
    }
    if (metodoDePago) {
      query.andWhere('venta.metodoDePago = :metodoDePago', { metodoDePago });
    }

    const [ventas, totalElements] = await query
      .skip(page * size)
      .take(size)
      .getManyAndCount();

    const content = ventas.map(v => ({
      idVenta: v.idVenta,
      total: v.total,
      descuento: v.descuento,
      montoAdicional: v.montoAdicional,
      fechaHora: v.fechaHora,
      metodoDePago: v.metodoDePago,
      detalles: v.detalles.map(d => ({
        nombre: d.producto ? d.producto.nombre : 'Desconocido',
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario,
      })),
      usuario: v.usuario ? v.usuario.nombre : 'Desconocido',
      tipoDescuento: v.tipoDescuento,
      porcentajeAplicado: v.porcentajeAplicado,
    }));

    return {
      content,
      totalElements,
      totalPages: Math.ceil(totalElements / size),
      size,
      number: page,
      numberOfElements: content.length,
      first: page === 0,
      last: page === Math.ceil(totalElements / size) - 1,
      empty: content.length === 0,
    };
  }

  listarMetodosDePago(): string[] {
    return Object.values(MetodoDePago);
  }

  listarTiposDescuento(): string[] {
    return Object.values(TipoDescuento);
  }
}
