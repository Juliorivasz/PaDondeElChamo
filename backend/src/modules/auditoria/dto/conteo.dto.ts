import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class ConteoDTO {
  @IsNumber()
  @IsNotEmpty()
  idDetalleAuditoria: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  cantidadReal: number;
}
