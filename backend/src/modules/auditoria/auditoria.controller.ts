import { Controller, Get, Post, Put, Body, Param, Query, Headers, UsePipes, ValidationPipe, ParseEnumPipe, UseGuards } from '@nestjs/common';
import { AuditoriaService } from './auditoria.service';
import { ConteoDTO } from './dto/conteo.dto';
import { AccionAuditoria } from '../../enums/accion-auditoria.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('auditoria')
@UseGuards(JwtAuthGuard)
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Post('iniciar/:idUsuario')
  async iniciarAuditoria(@Param('idUsuario') idUsuario: number) {
    return this.auditoriaService.iniciarAuditoria(idUsuario);
  }

  @Post('registrar-conteo/:idAuditoria')
  @UsePipes(new ValidationPipe({ transform: true }))
  async registrarConteo(
    @Param('idAuditoria') idAuditoria: number,
    @Body() conteos: ConteoDTO[],
  ) {
    return this.auditoriaService.registrarConteo(idAuditoria, conteos);
  }

  @Put('resolver-detalle/:idDetalle')
  async resolverDetalle(
    @Param('idDetalle') idDetalle: number,
    @Query('accion', new ParseEnumPipe(AccionAuditoria)) accion: AccionAuditoria,
  ) {
    return this.auditoriaService.resolverDetalle(idDetalle, accion);
  }

  @Put('observacion/:idAuditoria')
  async agregarObservacion(
    @Param('idAuditoria') idAuditoria: number,
    @Body() body: { observacion: string },
  ) {
    return this.auditoriaService.agregarObservacion(idAuditoria, body.observacion);
  }

  @Get()
  async obtenerAuditorias() {
    return this.auditoriaService.obtenerAuditorias();
  }
}
