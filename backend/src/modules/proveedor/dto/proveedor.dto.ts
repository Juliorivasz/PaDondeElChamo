import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class ProveedorDTO {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}
