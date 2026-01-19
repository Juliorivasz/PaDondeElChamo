import { IsNumber, IsOptional, IsPositive, ValidateIf } from 'class-validator';

export class DetalleVentaDTO {
  @IsNumber()
  @IsOptional()
  idProducto?: number;

  @IsNumber()
  @IsPositive()
  cantidad: number;
}
