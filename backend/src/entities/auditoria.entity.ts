import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Usuario } from './usuario.entity';
import { DetalleAuditoria } from './detalle-auditoria.entity';
import { EstadoAuditoria } from '../enums/estado-auditoria.enum';

@Entity()
export class Auditoria {
  @PrimaryGeneratedColumn()
  idAuditoria: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fechaHora: Date;

  @Column({ nullable: true })
  observacion: string;

  @Column({
    type: 'enum',
    enum: EstadoAuditoria,
    nullable: true,
  })
  estado: EstadoAuditoria;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'idUsuario' })
  usuario: Usuario;

  @OneToMany(() => DetalleAuditoria, (detalle) => detalle.auditoria, { cascade: true })
  detalles: DetalleAuditoria[];
}
