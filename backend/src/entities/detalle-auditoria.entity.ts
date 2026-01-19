import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Auditoria } from './auditoria.entity';
import { Producto } from './producto.entity';
import { EstadoControl } from '../enums/estado-control.enum';

@Entity()
export class DetalleAuditoria {
  @PrimaryGeneratedColumn()
  idDetalleAuditoria: number;

  @Column({ type: 'enum', enum: EstadoControl, nullable: true })
  estadoControl: EstadoControl;

  @Column({ type: 'int', nullable: true })
  cantidadSistema: number | null;

  @Column({ nullable: true })
  cantidadReal: number;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'idProducto' })
  producto: Producto;

  @ManyToOne(() => Auditoria, (auditoria) => auditoria.detalles)
  @JoinColumn({ name: 'idAuditoria' })
  auditoria: Auditoria;
}
