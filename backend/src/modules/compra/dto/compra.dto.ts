import { IsArray, IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DetalleCompraDTO } from './detalle-compra.dto';

export class CompraDTO {
  @IsNumber()
  @IsNotEmpty()
  idProveedor: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleCompraDTO)
  detalles: DetalleCompraDTO[];
}
