import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, IsPositive } from 'class-validator';

export class ProductoDTO {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsNumber()
  @IsNotEmpty()
  precio: number;

  @IsNumber()
  @IsNotEmpty()
  costo: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  stock: number;

  @IsNumber()
  @IsOptional()
  idMarca?: number;

  @IsNumber()
  @IsNotEmpty()
  idCategoria: number;

  @IsNumber()
  @IsNotEmpty()
  idProveedor: number;

  @IsString()
  @IsOptional()
  imagenUrl?: string;
}
