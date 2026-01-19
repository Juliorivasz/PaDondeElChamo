import { Controller, Get, Post, Body, Query, Headers, Param, UseGuards, Request } from '@nestjs/common';
import { VentaService } from './venta.service';
import { VentaDTO } from './dto/venta.dto';
import { MetodoDePago } from '../../enums/metodo-de-pago.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('venta')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VentaController {
  constructor(private readonly ventaService: VentaService) {}

  @Post('nueva')
  nuevaVenta(
    @Headers('X-Usuario-ID') idUsuario: string,
    @Body() dto: VentaDTO,
  ) {
    return this.ventaService.nuevaVenta(+idUsuario, dto);
  }

  @Get('catalogo')
  obtenerCatalogo() {
    return this.ventaService.obtenerCatalogo();
  }

  @Get('obtener')
  obtenerVentas(
    @Request() req,
    @Query('page') page: number = 0,
    @Query('size') size: number = 10,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('idUsuario') idUsuario?: number,
    @Query('metodoDePago') metodoDePago?: MetodoDePago,
  ) {
    // Si el usuario es EMPLEADO, forzar filtro por su propio ID
    const userRole = req.user.rol;
    const userId = req.user.userId; // El ID del usuario viene en 'userId' del JWT
    
    const finalIdUsuario = userRole === 'EMPLEADO' ? userId : (idUsuario ? +idUsuario : undefined);
    
    return this.ventaService.obtenerVentas(
      +page,
      +size,
      fechaInicio ? new Date(fechaInicio) : undefined,
      fechaFin ? new Date(fechaFin) : undefined,
      finalIdUsuario,
      metodoDePago,
    );
  }

  @Get('metodosDePago')
  listarMetodosDePago() {
    return this.ventaService.listarMetodosDePago();
  }

  @Get('tiposDescuento')
  listarTiposDescuento() {
    return this.ventaService.listarTiposDescuento();
  }
}
