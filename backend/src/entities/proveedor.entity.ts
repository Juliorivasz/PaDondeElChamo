import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Proveedor {
  @PrimaryGeneratedColumn()
  idProveedor: number;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  telefono: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  estado: boolean;
}
