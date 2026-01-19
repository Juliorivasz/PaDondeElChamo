import { Controller, Get, Post, Put, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ProveedorService } from './proveedor.service';
import { ProveedorDTO } from './dto/proveedor.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('proveedor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ProveedorController {
  constructor(private readonly proveedorService: ProveedorService) {}

  @Post('nuevo')
  nuevoProveedor(@Body() dto: ProveedorDTO) {
    return this.proveedorService.nuevoProveedor(dto);
  }

  @Put('modificar/:idProveedor')
  modificarProveedor(@Param('idProveedor') idProveedor: string, @Body() dto: ProveedorDTO) {
    return this.proveedorService.modificarProveedor(+idProveedor, dto);
  }

  @Get('abm')
  obtenerProveedores() {
    return this.proveedorService.obtenerProveedores();
  }

  @Get('lista')
  listarProveedores() {
    return this.proveedorService.listarProveedores();
  }

  @Patch('cambiarEstado/:idProveedor')
  cambiarEstadoProveedor(@Param('idProveedor') idProveedor: string) {
    return this.proveedorService.cambiarEstadoProveedor(+idProveedor);
  }
}
