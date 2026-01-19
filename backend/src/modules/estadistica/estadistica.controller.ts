import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { EstadisticaService } from './estadistica.service';
import { ResultadoMensualDTO } from './dto/resultado-mensual.dto';
import { IngresosVsEgresosDTO } from './dto/ingresos-vs-egresos.dto';
import { GraficoDeConteoDTO } from './dto/grafico-de-conteo.dto';
import { GraficoGeneralDTO } from './dto/grafico-general.dto';
import { VolumenVentasDTO } from './dto/volumen-ventas.dto';
import { VentasPorHoraDTO } from './dto/ventas-por-hora.dto';
import { KpiDTO } from './dto/kpi.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('estadistica')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class EstadisticaController {
  constructor(private readonly estadisticaService: EstadisticaService) {}

  @Get('ingresos-vs-egresos')
  async obtenerIngresosVsEgresos(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ): Promise<any[]> {
    return this.estadisticaService.obtenerIngresosVsEgresos(
      new Date(fechaInicio),
      new Date(fechaFin),
    );
  }

  @Get('ventas-por-metodo-pago')
  async obtenerVentasPorMetodoDePago(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ): Promise<any[]> {
    return this.estadisticaService.obtenerVentasPorMetodoDePago(
      new Date(fechaInicio),
      new Date(fechaFin),
    );
  }

  @Get('categorias-rentables')
  async obtenerCategoriasMasRentables(
    @Query('page') page: number,
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ): Promise<any[]> {
    return this.estadisticaService.obtenerCategoriasMasRentables(
      page || 0,
      new Date(fechaInicio),
      new Date(fechaFin),
    );
  }

  @Get('volumen-ventas')
  async obtenerVolumenVentas(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
    @Query('idCategoria') idCategoria?: number,
  ): Promise<any[]> {
    return this.estadisticaService.obtenerVolumenVentas(
      new Date(fechaInicio),
      new Date(fechaFin),
      idCategoria,
    );
  }

  @Get('ventas-por-hora')
  async obtenerVentasPorHora(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ): Promise<any[]> {
    return this.estadisticaService.obtenerVentasPorHora(
      new Date(fechaInicio),
      new Date(fechaFin),
    );
  }

  @Get('ventas-por-categoria')
  async obtenerGraficoVentasPorCategoria(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ): Promise<any[]> {
    return this.estadisticaService.obtenerGraficoVentasPorCategoria(
      new Date(fechaInicio),
      new Date(fechaFin),
    );
  }

  @Get('kpis')
  async obtenerKpis(): Promise<KpiDTO[]> {
    return this.estadisticaService.obtenerKpis();
  }
}
