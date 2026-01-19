import { IsArray, IsEnum, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MetodoDePago } from '../../../enums/metodo-de-pago.enum';
import { TipoDescuento } from '../../../enums/tipo-descuento.enum';
import { DetalleVentaDTO } from './detalle-venta.dto';

export class VentaDTO {
  @IsEnum(MetodoDePago)
  metodoDePago: MetodoDePago;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleVentaDTO)
  detalles: DetalleVentaDTO[];

  @IsNumber()
  @IsOptional()
  descuento?: number;

  @IsNumber()
  @IsOptional()
  montoAdicional?: number;

  @IsEnum(TipoDescuento)
  @IsOptional()
  tipoDescuento?: TipoDescuento;

  @IsNumber()
  @IsOptional()
  porcentajeAplicado?: number;
}
