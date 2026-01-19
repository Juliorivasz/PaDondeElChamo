import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Configuracion {
  @PrimaryGeneratedColumn()
  idConfiguracion: number;

  @Column({ default: false })
  descuentoAutomatico: boolean;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  montoMinimo: number;

  @Column('double', { nullable: true })
  porcentajeDescuento: number;

  @Column({ nullable: true })
  revisionActiva: boolean;

  @Column({ nullable: true })
  cantProductosRevision: number;

  @Column('simple-array', { nullable: true })
  metodosPagoDescuento: string[];
}
