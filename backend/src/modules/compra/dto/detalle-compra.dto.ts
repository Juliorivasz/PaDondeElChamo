import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class DetalleCompraDTO {
  @IsNumber()
  @IsNotEmpty()
  idProducto: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  cantidad: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  costoUnitario: number;
}
