import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity()
export class Arqueo {
  @PrimaryGeneratedColumn()
  idArqueo: number;

  @Column({ type: 'datetime' })
  inicioSesion: Date;

  @Column({ type: 'datetime', nullable: true })
  cierreSesion: Date;

  @Column({ type: 'float', default: 0 })
  efectivoInicial: number;

  @Column({ type: 'float', nullable: true })
  efectivoTeorico: number | null;

  @Column({ type: 'float', default: 0 })
  efectivoReal: number;

  @Column({ type: 'float', default: 0 })
  diferencia: number;

  @Column({ default: false })
  realizoControlStock: boolean;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'idUsuario' })
  usuario: Usuario;
}
