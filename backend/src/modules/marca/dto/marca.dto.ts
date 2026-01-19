import { IsString, IsNotEmpty } from 'class-validator';

export class MarcaDTO {
  @IsString()
  @IsNotEmpty()
  nombre: string;
}
