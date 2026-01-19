import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Marca {
  @PrimaryGeneratedColumn()
  idMarca: number;

  @Column()
  nombre: string;
}
