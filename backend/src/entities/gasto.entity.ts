import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from './usuario.entity';
import { TipoGasto } from '../enums/tipo-gasto.enum';

@Entity()
export class Gasto {
  @PrimaryGeneratedColumn()
  idGasto: number;

  @Column()
  descripcion: string;

  @Column('decimal', { precision: 10, scale: 2 })
  monto: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fechaHora: Date;

  @Column({ type: 'enum', enum: TipoGasto })
  tipoGasto: TipoGasto;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'idUsuario' })
  usuario: Usuario;
}
