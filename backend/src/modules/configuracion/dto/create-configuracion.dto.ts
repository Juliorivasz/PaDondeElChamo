import { IsBoolean, IsNumber, IsOptional, Min, IsNotEmpty } from 'class-validator';

export class CreateConfiguracionDto {
  @IsBoolean()
  @IsNotEmpty()
  descuentoAutomatico: boolean;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  montoMinimo: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  porcentajeDescuento: number;

  @IsBoolean()
  @IsOptional()
  revisionActiva?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  cantProductosRevision?: number;

  @IsOptional()
  metodosPagoDescuento: string[];
}
