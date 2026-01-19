import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { ResultadoMensualDTO } from './dto/resultado-mensual.dto';
import { IngresosVsEgresosDTO } from './dto/ingresos-vs-egresos.dto';
import { GraficoDeConteoDTO } from './dto/grafico-de-conteo.dto';
import { GraficoGeneralDTO } from './dto/grafico-general.dto';
import { VolumenVentasDTO } from './dto/volumen-ventas.dto';
import { VentasPorHoraDTO } from './dto/ventas-por-hora.dto';
import { KpiDTO } from './dto/kpi.dto';

@Injectable()
export class EstadisticaService {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async obtenerIngresosVsEgresos(
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<any[]> {
    const inicio = fechaInicio.toISOString().slice(0, 19).replace('T', ' ');
    // Add 1 month to end date to match legacy logic (fin = fechaFin.plusMonths(1))
    const finDate = new Date(fechaFin);
    finDate.setMonth(finDate.getMonth() + 1);
    const fin = finDate.toISOString().slice(0, 19).replace('T', ' ');

    const ingresos: ResultadoMensualDTO[] = await this.entityManager.query(
      `SELECT DATE_FORMAT(fechaHora, '%Y-%m') AS mes, COALESCE(SUM(total), 0) AS total
       FROM venta
       WHERE fechaHora >= ? AND fechaHora < ?
       GROUP BY mes
       ORDER BY mes ASC`,
      [inicio, fin],
    );

    const egresosCompras: ResultadoMensualDTO[] = await this.entityManager.query(
      `SELECT DATE_FORMAT(fechaHora, '%Y-%m') AS mes, COALESCE(SUM(total), 0) AS total
       FROM compra
       WHERE fechaHora >= ? AND fechaHora < ?
       GROUP BY mes
       ORDER BY mes ASC`,
      [inicio, fin],
    );

    const egresosGastos: ResultadoMensualDTO[] = await this.entityManager.query(
      `SELECT DATE_FORMAT(fechaHora, '%Y-%m') AS mes, COALESCE(SUM(monto), 0) AS total
       FROM gasto
       WHERE fechaHora >= ? AND fechaHora < ?
       GROUP BY mes
       ORDER BY mes ASC`,
      [inicio, fin],
    );

    const datosAgrupados = new Map<string, IngresosVsEgresosDTO>();

    ingresos.forEach((ingreso) => {
      datosAgrupados.set(
        ingreso.mes,
        new IngresosVsEgresosDTO(
          ingreso.mes,
          Number(ingreso.total),
          0,
        ),
      );
    });

    egresosCompras.forEach((egreso) => {
      if (!datosAgrupados.has(egreso.mes)) {
        datosAgrupados.set(
          egreso.mes,
          new IngresosVsEgresosDTO(egreso.mes, 0, 0),
        );
      }
      const dato = datosAgrupados.get(egreso.mes);
      if (dato) {
        dato.egresos += Number(egreso.total);
      }
    });

    egresosGastos.forEach((egreso) => {
      if (!datosAgrupados.has(egreso.mes)) {
        datosAgrupados.set(
          egreso.mes,
          new IngresosVsEgresosDTO(egreso.mes, 0, 0),
        );
      }
      const dato = datosAgrupados.get(egreso.mes);
      if (dato) {
        dato.egresos += Number(egreso.total);
      }
    });

    // Sort by key (mes)
    const sortedKeys = Array.from(datosAgrupados.keys()).sort();
    const resultadoFinal: any[] = [['Mes', 'Ingresos', 'Egresos']];

    sortedKeys.forEach((key) => {
      const dato = datosAgrupados.get(key);
      if (dato) {
        resultadoFinal.push([dato.mes, dato.ingresos, dato.egresos]);
      }
    });

    return resultadoFinal;
  }

  async obtenerVentasPorMetodoDePago(
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<any[]> {
    const inicio = fechaInicio.toISOString().slice(0, 19).replace('T', ' ');
    const finDate = new Date(fechaFin);
    finDate.setDate(finDate.getDate() + 1);
    const fin = finDate.toISOString().slice(0, 19).replace('T', ' ');

    const datos: GraficoDeConteoDTO[] = await this.entityManager.query(
      `SELECT metodoDePago AS etiqueta, COUNT(*) AS valor
       FROM venta
       WHERE fechaHora >= ? AND fechaHora < ?
       GROUP BY metodoDePago`,
      [inicio, fin],
    );

    const resultados: any[] = [['Metodo de Pago', 'Ventas']];
    datos.forEach((dato) => {
      resultados.push([dato.etiqueta, Number(dato.valor)]);
    });

    return resultados;
  }

  async obtenerCategoriasMasRentables(
    page: number,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<any[]> {
    const inicio = fechaInicio.toISOString().slice(0, 19).replace('T', ' ');
    const finDate = new Date(fechaFin);
    finDate.setDate(finDate.getDate() + 1);
    const fin = finDate.toISOString().slice(0, 19).replace('T', ' ');
    const offset = page * 7;

    const datos: GraficoGeneralDTO[] = await this.entityManager.query(
      `SELECT c.nombre AS etiqueta,
              SUM((dv.precioUnitario - p.costo) * dv.cantidad) AS valor
       FROM detalle_venta dv
       JOIN producto p ON dv.idProducto = p.idProducto
       JOIN categoria c ON p.idCategoria = c.idCategoria
       JOIN venta v ON dv.idVenta = v.idVenta
       WHERE v.fechaHora >= ? AND v.fechaHora < ?
       GROUP BY c.idCategoria, c.nombre
       ORDER BY valor DESC
       LIMIT 7 OFFSET ?`,
      [inicio, fin, offset],
    );

    const resultadoParaGrafico: any[] = [['Categoría', 'Ganancia']];
    datos.forEach((dato) => {
      resultadoParaGrafico.push([dato.etiqueta, Number(dato.valor)]);
    });

    return resultadoParaGrafico;
  }

  async obtenerVolumenVentas(
    fechaInicio: Date,
    fechaFin: Date,
    idCategoria?: number,
  ): Promise<any[]> {
    const inicio = fechaInicio.toISOString().slice(0, 19).replace('T', ' ');
    const finDate = new Date(fechaFin);
    finDate.setDate(finDate.getDate() + 1);
    const fin = finDate.toISOString().slice(0, 19).replace('T', ' ');

    let datos: VolumenVentasDTO[];

    if (!idCategoria || idCategoria === 0) {
      datos = await this.entityManager.query(
        `SELECT DATE_FORMAT(v.fechaHora, '%Y-%m') AS mes, 'Todos los Productos' AS nombre, SUM(dv.cantidad) AS cantidad
         FROM detalle_venta dv
         JOIN venta v ON dv.idVenta = v.idVenta
         WHERE v.fechaHora >= ? AND v.fechaHora < ?
         GROUP BY mes
         ORDER BY mes ASC`,
        [inicio, fin],
      );
    } else {
      datos = await this.entityManager.query(
        `SELECT DATE_FORMAT(v.fechaHora, '%Y-%m') AS mes, c.nombre AS nombre, SUM(dv.cantidad) AS cantidad
         FROM detalle_venta dv
         JOIN venta v ON dv.idVenta = v.idVenta
         JOIN producto p ON dv.idProducto = p.idProducto
         JOIN categoria c ON p.idCategoria = c.idCategoria
         WHERE c.idCategoria = ? AND v.fechaHora >= ? AND v.fechaHora < ?
         GROUP BY mes, c.nombre
         ORDER BY mes ASC`,
        [idCategoria, inicio, fin],
      );
    }

    const resultadoParaGrafico: any[] = [];
    const nombreEncabezado =
      datos.length === 0 ? 'Cantidad Vendida' : datos[0].nombre;
    resultadoParaGrafico.push(['Mes', nombreEncabezado]);

    datos.forEach((dato) => {
      resultadoParaGrafico.push([dato.mes, Number(dato.cantidad)]);
    });

    return resultadoParaGrafico;
  }

  async obtenerVentasPorHora(
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<any[]> {
    const inicio = fechaInicio.toISOString().slice(0, 19).replace('T', ' ');
    const finDate = new Date(fechaFin);
    finDate.setDate(finDate.getDate() + 1);
    const fin = finDate.toISOString().slice(0, 19).replace('T', ' ');

    const datos: VentasPorHoraDTO[] = await this.entityManager.query(
      `SELECT HOUR(fechaHora) AS hora, COUNT(*) AS cantidad
       FROM venta
       WHERE fechaHora >= ? AND fechaHora < ?
       GROUP BY hora
       ORDER BY hora ASC`,
      [inicio, fin],
    );

    const resultadoParaGrafico: any[] = [['Hora del día', 'Cantidad de ventas']];
    datos.forEach((dato) => {
      resultadoParaGrafico.push([dato.hora, Number(dato.cantidad)]);
    });

    return resultadoParaGrafico;
  }

  async obtenerGraficoVentasPorCategoria(
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<any[]> {
    const inicio = fechaInicio.toISOString().slice(0, 19).replace('T', ' ');
    const finDate = new Date(fechaFin);
    finDate.setDate(finDate.getDate() + 1);
    const fin = finDate.toISOString().slice(0, 19).replace('T', ' ');

    const datosCompletos: GraficoGeneralDTO[] = await this.entityManager.query(
      `SELECT c.nombre AS etiqueta, SUM(dv.precioUnitario * dv.cantidad) AS valor
       FROM detalle_venta dv
       JOIN producto p ON dv.idProducto = p.idProducto
       JOIN categoria c ON p.idCategoria = c.idCategoria
       JOIN venta v ON dv.idVenta = v.idVenta
       WHERE v.fechaHora >= ? AND v.fechaHora < ?
       GROUP BY c.idCategoria, c.nombre
       ORDER BY valor DESC`,
      [inicio, fin],
    );

    const resultadoParaGrafico: any[] = [['Categoría', 'Total Vendido']];

    if (datosCompletos.length > 5) {
      const top3 = datosCompletos.slice(0, 5);
      top3.forEach((dato) =>
        resultadoParaGrafico.push([dato.etiqueta, Number(dato.valor)]),
      );

      const sumaOtras = datosCompletos
        .slice(5)
        .reduce((acc, curr) => acc + Number(curr.valor), 0);
      resultadoParaGrafico.push(['Otras', sumaOtras]);
    } else {
      datosCompletos.forEach((dato) =>
        resultadoParaGrafico.push([dato.etiqueta, Number(dato.valor)]),
      );
    }

    return resultadoParaGrafico;
  }

  async obtenerKpis(): Promise<KpiDTO[]> {
    const hoy = new Date();
    const primerDiaDelMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const inicioMesActual = primerDiaDelMes
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');
    
    const primerDiaMesSiguiente = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
    const inicioMesSiguiente = primerDiaMesSiguiente
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');

    // 1. Ganancia Neta
    const gananciaNetaResult = await this.entityManager.query(
      `SELECT COALESCE(SUM((dv.precioUnitario - p.costo) * dv.cantidad), 0) AS valor
       FROM detalle_venta dv
       JOIN producto p ON dv.idProducto = p.idProducto
       JOIN venta v ON dv.idVenta = v.idVenta
       WHERE v.fechaHora >= ? AND v.fechaHora < ?`,
      [inicioMesActual, inicioMesSiguiente],
    );
    const gananciaNeta = Number(gananciaNetaResult[0].valor);
    
    // 2. Total Recaudado
    const totalRecaudadoResult = await this.entityManager.query(
      `SELECT COALESCE(SUM(total), 0) AS valor FROM venta
       WHERE fechaHora >= ? AND fechaHora < ?`,
      [inicioMesActual, inicioMesSiguiente],
    );
    const totalRecaudado = Number(totalRecaudadoResult[0].valor);

    // 3. Total Gastos
    const totalGastosResult = await this.entityManager.query(
      `SELECT COALESCE(SUM(monto), 0) AS valor FROM gasto
       WHERE fechaHora >= ? AND fechaHora < ?`,
      [inicioMesActual, inicioMesSiguiente],
    );
    const totalGastos = Number(totalGastosResult[0].valor);

    // 4. Total Compras
    const totalComprasResult = await this.entityManager.query(
      `SELECT COALESCE(SUM(total), 0) AS valor FROM compra
       WHERE fechaHora >= ? AND fechaHora < ?`,
      [inicioMesActual, inicioMesSiguiente],
    );
    const totalCompras = Number(totalComprasResult[0].valor);

    // 5. Cantidad Ventas
    const cantidadVentasResult = await this.entityManager.query(
      `SELECT COUNT(*) AS valor FROM venta
       WHERE fechaHora >= ? AND fechaHora < ?`,
      [inicioMesActual, inicioMesSiguiente],
    );
    const cantidadVentas = Number(cantidadVentasResult[0].valor);

    // 6. Ticket Promedio
    const ticketPromedioResult = await this.entityManager.query(
      `SELECT COALESCE(AVG(total), 0) AS valor FROM venta
       WHERE fechaHora >= ? AND fechaHora < ?`,
      [inicioMesActual, inicioMesSiguiente],
    );
    const ticketPromedio = Number(ticketPromedioResult[0].valor);

    // 7. Productos Bajo Stock
    const productosStockBajoResult = await this.entityManager.query(
      `SELECT COUNT(*) AS valor 
       FROM producto p
       JOIN categoria c ON p.idCategoria = c.idCategoria
       WHERE p.stock <= c.stockMinimo AND p.estado = true`,
    );
    const productosStockBajo = Number(productosStockBajoResult[0].valor);

    // 8. En Stock (Valor al costo)
    const enStockResult = await this.entityManager.query(
      `SELECT COALESCE(SUM(costo * stock), 0) AS valor FROM producto WHERE estado = true`,
    );
    const enStock = Number(enStockResult[0].valor);

    // 9. En Posibles Ventas (Valor al precio)
    const enPosiblesVentasResult = await this.entityManager.query(
      `SELECT COALESCE(SUM(precio * stock), 0) AS valor FROM producto WHERE estado = true`,
    );
    const enPosiblesVentas = Number(enPosiblesVentasResult[0].valor);

    const kpis: KpiDTO[] = [
      new KpiDTO('Ganancia este Mes', gananciaNeta),
      new KpiDTO('Recaudado este Mes', totalRecaudado),
      new KpiDTO('Gastos del Mes', totalGastos),
      new KpiDTO('Compras del Mes', totalCompras),
      new KpiDTO('Ventas de este Mes', cantidadVentas),
      new KpiDTO('Ticket Promedio', ticketPromedio),
      new KpiDTO('Productos Bajo Stock', productosStockBajo),
      new KpiDTO('En Stock', enStock),
      new KpiDTO('En Posibles Ventas', enPosiblesVentas),
    ];

    return kpis;
  }
}
