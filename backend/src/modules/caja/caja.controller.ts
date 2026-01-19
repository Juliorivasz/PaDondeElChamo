import { Controller, Get, Post, Body, Req, UseGuards, Query } from '@nestjs/common';
import { CajaService } from './caja.service';
import { Usuario } from '../../entities/usuario.entity';
// Assuming AuthGuard logic exists, or we just pass user ID manually for now if not integrated
// Usually: @UseGuards(JwtAuthGuard) and @Req() req.user

@Controller('caja')
export class CajaController {
  constructor(private readonly cajaService: CajaService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.cajaService.getDashboardData();
  }

  @Post('retiro')
  async crearRetiro(@Body() body: { cantidad: number; idUsuario: number }) {
    // In real app, idUsuario comes from Token, but sticking to body as requested/implied
    return this.cajaService.crearRetiro(body);
  }

  @Post('cerrar-turno')
  async cerrarTurno(@Body() body: { idUsuario: number; efectivoReal: number }) {
    return this.cajaService.cerrarSesion(body.idUsuario, body.efectivoReal);
  }

  @Post('abrir-manual')
  async abrirCajaManual(@Body() body: { idUsuario: number }) {
    // Construct partial user entity with ID (Role will be checked in service or assumed handled)
    // Actually service just needs it for relation
    const partialUser = { idUsuario: body.idUsuario } as Usuario; 
    return this.cajaService.iniciarSesionManual(body.idUsuario, partialUser);
  }

  @Get('estado-stock')
  async getEstadoStock(@Query('idUsuario') idUsuario: number) {
      if (!idUsuario) return { realizado: false };
      const realizado = await this.cajaService.checkEstadoControl(idUsuario);
      return { realizado };
  }

  @Get('arqueos')
  async getHistorial(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('idUsuario') idUsuario?: number,
    @Query('diferencia') diferencia?: string,
    @Query('stockCheck') stockCheck?: string,
  ) {
    return this.cajaService.getHistorialArqueos({
      fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
      fechaFin: fechaFin ? new Date(fechaFin) : undefined,
      idUsuario: idUsuario ? Number(idUsuario) : undefined,
      diferencia: diferencia === 'true',
      stockCheck: stockCheck === 'true' ? true : stockCheck === 'false' ? false : undefined,
    });
  }

  @Get('session-status')
  async checkSessionStatus(@Query('idUsuario') idUsuario: number) {
      if (!idUsuario) return { active: false };
      return this.cajaService.checkSessionStatus(idUsuario);
  }
}
