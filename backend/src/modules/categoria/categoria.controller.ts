import { Controller, Get, Post, Put, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { CategoriaService } from './categoria.service';
import { CategoriaDTO } from './dto/categoria.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('categoria')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriaController {
  constructor(private readonly categoriaService: CategoriaService) {}

  @Post('nueva')
  @Roles('ADMIN')
  nuevaCategoria(@Body() dto: CategoriaDTO) {
    return this.categoriaService.nuevaCategoria(dto);
  }

  @Put('modificar/:idCategoria')
  @Roles('ADMIN')
  modificarCategoria(@Param('idCategoria') idCategoria: string, @Body() dto: CategoriaDTO) {
    return this.categoriaService.modificarCategoria(+idCategoria, dto);
  }

  @Get('abm')
  obtenerCategorias() {
    return this.categoriaService.obtenerCategorias();
  }

  @Patch('cambiarEstado/:idCategoria')
  cambiarEstadoCategoria(@Param('idCategoria') idCategoria: string) {
    return this.categoriaService.cambiarEstadoCategoria(+idCategoria);
  }
}
