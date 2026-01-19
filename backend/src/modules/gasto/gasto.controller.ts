import { Controller, Get, Post, Put, Body, Param, Query, Headers, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { GastoService } from './gasto.service';
import { GastoDTO } from './dto/gasto.dto';
import { TipoGasto } from '../../enums/tipo-gasto.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('gasto')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class GastoController {
  constructor(private readonly gastoService: GastoService) {}

  @Post('nuevo')
  @UsePipes(new ValidationPipe({ transform: true }))
  async nuevoGasto(
    @Headers('X-Usuario-ID') idUsuario: number,
    @Body() dto: GastoDTO,
  ) {
    return this.gastoService.nuevoGasto(idUsuario, dto);
  }

  @Put('modificar/:idGasto')
  @UsePipes(new ValidationPipe({ transform: true }))
  async modificarGasto(
    @Param('idGasto') idGasto: number,
    @Body() dto: GastoDTO,
  ) {
    return this.gastoService.modificarGasto(idGasto, dto);
  }

  @Get('lista')
  async listarGastos(
    @Query('page') page?: number,
    @Query('size') size?: number,
    @Query('tipoGasto') tipoGasto?: TipoGasto,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('idUsuario') idUsuario?: number,
  ) {
    return this.gastoService.listarGastos(page, size, tipoGasto, fechaInicio, fechaFin, idUsuario);
  }

  @Get('tipos')
  listarTipoGastos() {
    return this.gastoService.listarTipoGastos();
  }
}
