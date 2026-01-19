import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CategoriaDTO {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @IsOptional()
  idCategoriaPadre?: number;

  @IsNumber()
  @IsOptional()
  stockMinimo?: number;

  @IsOptional()
  aplicaDescuentoAutomatico?: boolean;
}
