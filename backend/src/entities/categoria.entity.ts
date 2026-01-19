import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Producto } from './producto.entity';

@Entity()
export class Categoria {
  @PrimaryGeneratedColumn()
  idCategoria: number;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  descripcion: string;

  @Column({ nullable: true })
  estado: boolean;

  @Column({ nullable: true, default: 0 })
  stockMinimo: number;

  @Column({ default: true })
  aplicaDescuentoAutomatico: boolean;

  @ManyToOne(() => Categoria, (categoria) => categoria.subcategorias, { nullable: true })
  @JoinColumn({ name: 'idCategoriaPadre' })
  categoriaPadre: Categoria;

  @OneToMany(() => Categoria, (categoria) => categoria.categoriaPadre)
  subcategorias: Categoria[];

  @OneToMany(() => Producto, (producto) => producto.categoria)
  productos: Producto[];
}
