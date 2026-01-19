import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Proveedor } from './proveedor.entity';
import { Usuario } from './usuario.entity';
import { DetalleCompra } from './detalle-compra.entity';
import { EstadoCompra } from '../enums/estado-compra.enum';

@Entity()
export class Compra {
  @PrimaryGeneratedColumn()
  idCompra: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fechaHora: Date;

  @Column({ type: 'enum', enum: EstadoCompra, default: EstadoCompra.PENDIENTE })
  estadoCompra: EstadoCompra;

  @ManyToOne(() => Proveedor)
  @JoinColumn({ name: 'idProveedor' })
  proveedor: Proveedor;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'idUsuario' })
  usuario: Usuario;

  @OneToMany(() => DetalleCompra, (detalle) => detalle.compra, { cascade: true })
  detalles: DetalleCompra[];
}
