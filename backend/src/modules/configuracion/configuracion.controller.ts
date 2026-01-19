import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { ConfiguracionService } from './configuracion.service';
import { CreateConfiguracionDto } from './dto/create-configuracion.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('configuracion')
@UseGuards(JwtAuthGuard)
export class ConfiguracionController {
  constructor(private readonly configuracionService: ConfiguracionService) {}

  @Get()
  async obtenerConfiguracion() {
    return this.configuracionService.obtenerConfiguracion();
  }

  @Put()
  async actualizarConfiguracion(@Body() createConfiguracionDto: CreateConfiguracionDto) {
    return this.configuracionService.actualizarConfiguracion(createConfiguracionDto);
  }
}
