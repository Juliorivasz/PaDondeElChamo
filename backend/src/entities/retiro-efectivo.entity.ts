import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity()
export class RetiroEfectivo {
  @PrimaryGeneratedColumn()
  idRetiro: number;

  @Column({ type: 'datetime' })
  fechaHora: Date;

  @Column({ type: 'float' })
  cantidad: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'idUsuario' })
  usuario: Usuario;
}
