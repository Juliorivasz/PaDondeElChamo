import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Compra } from './compra.entity';
import { Producto } from './producto.entity';

@Entity()
export class DetalleCompra {
  @PrimaryGeneratedColumn()
  idDetalleCompra: number;

  @Column()
  cantidad: number;

  @Column('decimal', { precision: 10, scale: 2 })
  costoUnitario: number;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'idProducto' })
  producto: Producto;

  @ManyToOne(() => Compra, (compra) => compra.detalles)
  @JoinColumn({ name: 'idCompra' })
  compra: Compra;
}
