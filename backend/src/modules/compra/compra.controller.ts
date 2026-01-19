import { Controller, Get, Post, Body, Param, Query, Patch, Headers, UsePipes, ValidationPipe, UseGuards, Res } from '@nestjs/common';
import express from 'express';
import { CompraDTO } from './dto/compra.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CompraService } from './compra.service';

@Controller('compra')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class CompraController {
  constructor(private readonly compraService: CompraService) {}

  @Post('nueva')
  @UsePipes(new ValidationPipe({ transform: true }))
  async nuevaCompra(
    @Headers('X-Usuario-ID') idUsuario: number,
    @Body() dto: CompraDTO,
  ) {
    return this.compraService.nuevaCompra(idUsuario, dto);
  }

  @Get('obtener')
  async obtenerCompras(
    @Query('page') page?: number,
    @Query('size') size?: number,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('idProveedor') idProveedor?: number,
    @Query('idUsuario') idUsuario?: number,
  ) {
    return this.compraService.obtenerCompras(page, size, fechaInicio, fechaFin, idProveedor, idUsuario);
  }

  @Patch('cambiarEstado/:idCompra')
  async cambiarEstadoCompra(@Param('idCompra') idCompra: number) {
    return this.compraService.cambiarEstadoCompra(idCompra);
  }

  @Get('estadosCompra')
  listarEstadosCompra() {
    return this.compraService.listarEstadosCompra();
  }

  @Get('comprobante/:idCompra')
  async descargarComprobante(
    @Param('idCompra') idCompra: number,
    @Res() res: express.Response,
  ) {
    const buffer = await this.compraService.generarComprobantePdf(idCompra);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename=ComprobanteCompra#${idCompra}.pdf`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
