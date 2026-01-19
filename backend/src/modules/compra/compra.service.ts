import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Compra } from '../../entities/compra.entity';
import { DetalleCompra } from '../../entities/detalle-compra.entity';
import { Producto } from '../../entities/producto.entity';
import { Proveedor } from '../../entities/proveedor.entity';
import { Usuario } from '../../entities/usuario.entity';
import { CompraDTO } from './dto/compra.dto';
import { CompraListaDTO } from './dto/compra-lista.dto';
import { EstadoCompra } from '../../enums/estado-compra.enum';
import { DetalleCompraDTO } from './dto/detalle-compra.dto';
import PDFDocument from 'pdfkit';
import { Response } from 'express';

@Injectable()
export class CompraService {
  constructor(
    @InjectRepository(Compra)
    private compraRepository: Repository<Compra>,
    @InjectRepository(DetalleCompra)
    private detalleCompraRepository: Repository<DetalleCompra>,
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
    @InjectRepository(Proveedor)
    private proveedorRepository: Repository<Proveedor>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) {}

  async nuevaCompra(idUsuario: number, dto: CompraDTO): Promise<Compra> {
    const usuario = await this.usuarioRepository.findOneBy({ idUsuario });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const proveedor = await this.proveedorRepository.findOneBy({ idProveedor: dto.idProveedor });
    if (!proveedor) throw new NotFoundException('Proveedor no encontrado');

    const compra = this.compraRepository.create({
      fechaHora: new Date(),
      usuario,
      proveedor,
      estadoCompra: EstadoCompra.PENDIENTE,
      detalles: [],
      total: 0,
    });

    // Save header first
    const compraGuardada = await this.compraRepository.save(compra);

    let total = 0;
    const detallesGuardados: DetalleCompra[] = [];

    for (const detalleDto of dto.detalles) {
      const producto = await this.productoRepository.findOneBy({ idProducto: detalleDto.idProducto });
      if (!producto) throw new NotFoundException(`Producto ${detalleDto.idProducto} no encontrado`);

      const detalle = this.detalleCompraRepository.create({
        compra: compraGuardada,
        producto,
        cantidad: detalleDto.cantidad,
        costoUnitario: detalleDto.costoUnitario,
      });

      const detalleGuardado = await this.detalleCompraRepository.save(detalle);
      detallesGuardados.push(detalleGuardado);

      // Increment stock
      producto.stock += detalleDto.cantidad;
      await this.productoRepository.save(producto);

      total += (detalleDto.costoUnitario * detalleDto.cantidad);
    }

    compraGuardada.detalles = detallesGuardados;
    compraGuardada.total = total;

    return this.compraRepository.save(compraGuardada);
  }

  async obtenerCompras(
    page: number = 0,
    size: number = 10,
    fechaInicio?: string,
    fechaFin?: string,
    idProveedor?: number,
    idUsuario?: number,
  ): Promise<any> {
    const query = this.compraRepository.createQueryBuilder('compra')
      .leftJoinAndSelect('compra.usuario', 'usuario')
      .leftJoinAndSelect('compra.proveedor', 'proveedor')
      .leftJoinAndSelect('compra.detalles', 'detalles')
      .leftJoinAndSelect('detalles.producto', 'producto')
      .orderBy('compra.fechaHora', 'DESC')
      .skip(page * size)
      .take(size);

    if (fechaInicio) {
      query.andWhere('compra.fechaHora >= :fechaInicio', { fechaInicio: new Date(fechaInicio) });
    }
    if (fechaFin) {
       // Add one day to include the end date fully
       const endDate = new Date(fechaFin);
       endDate.setDate(endDate.getDate() + 1);
       query.andWhere('compra.fechaHora < :fechaFin', { fechaFin: endDate });
    }
    if (idProveedor) {
      query.andWhere('proveedor.idProveedor = :idProveedor', { idProveedor });
    }
    if (idUsuario) {
      query.andWhere('usuario.idUsuario = :idUsuario', { idUsuario });
    }

    const [compras, total] = await query.getManyAndCount();

    const content = compras.map(c => ({
      idCompra: c.idCompra,
      fechaHora: c.fechaHora,
      total: c.total,
      estadoCompra: c.estadoCompra,
      proveedor: c.proveedor ? c.proveedor.nombre : '',
      usuario: c.usuario ? c.usuario.nombre : '',
      detalles: c.detalles
    }));

    return {
      content,
      totalElements: total,
      totalPages: Math.ceil(total / size),
      size,
      number: page,
      numberOfElements: content.length,
      first: page === 0,
      last: page === Math.ceil(total / size) - 1,
      empty: content.length === 0
    };
  }

  async cambiarEstadoCompra(idCompra: number): Promise<void> {
    const compra = await this.compraRepository.findOneBy({ idCompra });
    if (!compra) throw new NotFoundException('Compra no encontrada');

    if (compra.estadoCompra === EstadoCompra.PENDIENTE) {
      compra.estadoCompra = EstadoCompra.PAGADO;
    } else if (compra.estadoCompra === EstadoCompra.PAGADO) {
      compra.estadoCompra = EstadoCompra.PENDIENTE;
    }

    await this.compraRepository.save(compra);
  }

  listarEstadosCompra(): string[] {
    return Object.values(EstadoCompra);
  }

  async generarComprobantePdf(idCompra: number): Promise<Buffer> {
    const compra = await this.compraRepository.findOne({
      where: { idCompra },
      relations: ['usuario', 'proveedor', 'detalles', 'detalles.producto'],
    });

    if (!compra) throw new NotFoundException('Compra no encontrada');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // --- Título y Datos de la Compra ---
      doc.font('Helvetica-Bold').fontSize(18).text(`Comprobante de Compra #${compra.idCompra}`, { align: 'center' });
      doc.moveDown();

      doc.font('Helvetica').fontSize(12);
      doc.text(`Fecha: ${compra.fechaHora.toLocaleDateString('es-AR')}`);
      doc.text(`Hora: ${compra.fechaHora.toLocaleTimeString('es-AR')}`);
      doc.text(`Proveedor: ${compra.proveedor?.nombre || 'N/A'}`);
      doc.text(`Usuario: ${compra.usuario?.nombre || 'N/A'}`);
      doc.moveDown();

      // --- Tabla de Detalles ---
      const tableTop = 200;
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('Producto', 50, tableTop);
      doc.text('Cantidad', 250, tableTop, { width: 80, align: 'center' });
      doc.text('Costo Unit.', 330, tableTop, { width: 100, align: 'right' });
      doc.text('Subtotal', 430, tableTop, { width: 100, align: 'right' });

      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
      doc.moveDown();

      let y = tableTop + 25;
      doc.font('Helvetica').fontSize(11);

      (compra.detalles || []).forEach((detalle) => {
        const subtotal = detalle.costoUnitario * detalle.cantidad;
        doc.text(detalle.producto?.nombre || 'Producto Desconocido', 50, y);
        doc.text(detalle.cantidad.toString(), 250, y, { width: 80, align: 'center' });
        doc.text(`$${detalle.costoUnitario.toLocaleString('es-AR')}`, 330, y, { width: 100, align: 'right' });
        doc.text(`$${subtotal.toLocaleString('es-AR')}`, 430, y, { width: 100, align: 'right' });
        y += 20;

        if (y > 700) {
          doc.addPage();
          y = 50;
        }
      });

      // --- Resumen de Totales ---
      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 10;
      doc.font('Helvetica-Bold').fontSize(14);
      doc.text('TOTAL:', 330, y, { width: 100, align: 'right' });
      doc.text(`$${compra.total.toLocaleString('es-AR')}`, 430, y, { width: 100, align: 'right' });

      doc.end();
    });
  }
}
