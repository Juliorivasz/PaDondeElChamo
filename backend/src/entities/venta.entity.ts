import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Usuario } from './usuario.entity';
import { DetalleVenta } from './detalle-venta.entity';
import { TipoDescuento } from '../enums/tipo-descuento.enum';
import { MetodoDePago } from '../enums/metodo-de-pago.enum';

@Entity()
export class Venta {
  @PrimaryGeneratedColumn()
  idVenta: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fechaHora: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  descuento: number | null;

  @Column('double', { nullable: true })
  porcentajeAplicado: number | null;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  montoAdicional: number | null;

  @Column({ type: 'enum', enum: TipoDescuento, default: TipoDescuento.NINGUNO })
  tipoDescuento: TipoDescuento;

  @Column({ type: 'enum', enum: MetodoDePago, default: MetodoDePago.EFECTIVO })
  metodoDePago: MetodoDePago;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'idUsuario' })
  usuario: Usuario;

  @OneToMany(() => DetalleVenta, (detalle) => detalle.venta, { cascade: true })
  detalles: DetalleVenta[];
}
