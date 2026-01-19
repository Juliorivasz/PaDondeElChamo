import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { TipoGasto } from '../../../enums/tipo-gasto.enum';

export class GastoDTO {
  @IsEnum(TipoGasto)
  @IsNotEmpty()
  tipoGasto: TipoGasto;

  @IsString()
  @IsOptional()
  descripcion: string;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  monto: number;
}
