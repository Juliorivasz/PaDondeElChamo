import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { MarcaService } from './marca.service';
import { MarcaDTO } from './dto/marca.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('marca')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class MarcaController {
  constructor(private readonly marcaService: MarcaService) {}

  @Post('nueva')
  nuevaMarca(@Body() dto: MarcaDTO) {
    return this.marcaService.nuevaMarca(dto);
  }

  @Put('modificar/:idMarca')
  modificarMarca(@Param('idMarca') idMarca: string, @Body() dto: MarcaDTO) {
    return this.marcaService.modificarMarca(+idMarca, dto);
  }

  @Get('lista')
  listarMarcas() {
    return this.marcaService.listarMarcas();
  }
}
