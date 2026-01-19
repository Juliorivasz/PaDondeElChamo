import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { Marca } from './marca.entity';
import { Categoria } from './categoria.entity';
import { Proveedor } from './proveedor.entity';

@Entity()
export class Producto {
  @PrimaryGeneratedColumn()
  idProducto: number;

  @Column({ unique: true })
  nombre: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  precio: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  costo: number;

  @Column({ nullable: true })
  stock: number;

  @Column({ nullable: true })
  estado: boolean;

  @Column({ nullable: true })
  codigoDeBarras: string;

  @ManyToOne(() => Marca, { nullable: true })
  @JoinColumn({ name: 'idMarca' })
  marca: Marca;

  @ManyToOne(() => Categoria, (categoria) => categoria.productos, { nullable: true })
  @JoinColumn({ name: 'idCategoria' })
  categoria: Categoria;

  @ManyToOne(() => Proveedor, { nullable: true })
  @JoinColumn({ name: 'idProveedor' })
  proveedor: Proveedor;

  @Column({ nullable: true })
  imagenUrl: string;

}
