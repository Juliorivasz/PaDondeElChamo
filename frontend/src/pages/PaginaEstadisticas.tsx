"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { ChartNoAxesCombined, Activity, RefreshCw, ClipboardList, AlertTriangle, PiggyBank, ChevronLeft, ChevronRight, TableProperties, Truck, Coins } from "lucide-react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { Chart } from "react-google-charts"
import type { KpiDTO, DatosParaGrafico, FilaGrafico } from "../types/dto/Estadisticas"
import {
  obtenerKpis,
  obtenerIngresosVsEgresos,
  obtenerCategoriasRentables,
  obtenerVolumenVentas,
  obtenerVentasPorHora,
  obtenerVentasPorMetodoDePago,
  obtenerVentasPorCategoria,
} from "../api/estadisticaApi"
import { obtenerCategorias } from "../api/categoriaApi"
import type { Categoria } from "../types/dto/Categoria"
import { formatCurrency } from "../utils/numberFormatUtils"
import ModalExportarReporte from "../components/reportes/ModalExportarReporte"

const PaginaEstadisticas: React.FC = () => {
  // Estados principales (sin cambios)
  const [kpis, setKpis] = useState<KpiDTO[]>([])
  const [datosIngresosVsEgresos, setDatosIngresosVsEgresos] = useState<DatosParaGrafico | null>(null)
  const [datosCategoriasRentables, setDatosCategoriasRentables] = useState<DatosParaGrafico | null>(null)
  const [datosVolumenVentas, setDatosVolumenVentas] = useState<DatosParaGrafico | null>(null)
  const [datosVentasPorHora, setDatosVentasPorHora] = useState<DatosParaGrafico | null>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [datosMetodosDePago, setDatosMetodosDePago] = useState<DatosParaGrafico | null>(null)
  const [datosVentasPorCategoria, setDatosVentasPorCategoria] = useState<DatosParaGrafico | null>(null)
  const [modalExportarAbierto, setModalExportarAbierto] = useState(false)

  const datosPivoteadosParaGrafico = useMemo(() => {
    // Usamos el nombre 'datosOriginales' para mayor claridad.
    // Es la misma variable que tú llamas 'datosMetodosDePago'.
    const datosOriginales = datosMetodosDePago

    if (!datosOriginales || datosOriginales.length <= 1) {
      return [["", ""]]
    }

    const encabezadosOriginales = datosOriginales[0]
    const filasDeDatos = datosOriginales.slice(1)

    // Calculamos el total para poder sacar los porcentajes
    const totalGeneral = filasDeDatos.reduce((sum, fila) => sum + (fila[1] as number), 0)

    // 1. Creamos la nueva fila de encabezados con las columnas de anotación
    const nuevoEncabezado: FilaGrafico = [encabezadosOriginales[0]]
    filasDeDatos.forEach((fila) => {
      // Para cada categoría (ej: "Efectivo"), añadimos una columna para el valor y otra para la anotación
      nuevoEncabezado.push(fila[0], { role: "annotation" })
    })

    // 2. Creamos la nueva fila de datos con los valores y los porcentajes
    const nuevaFilaDeDatos: FilaGrafico = [encabezadosOriginales[1]]
    filasDeDatos.forEach((fila) => {
      const valor = fila[1] as number
      const porcentaje = totalGeneral > 0 ? `${Math.round((valor / totalGeneral) * 100)}%` : "0%"
      // Añadimos el valor numérico y, justo después, el string del porcentaje
      nuevaFilaDeDatos.push(valor, porcentaje)
    })

    return [nuevoEncabezado, nuevaFilaDeDatos]
  }, [datosMetodosDePago])

  // Estados de filtros (sin cambios)
  const [fechaInicio, setFechaInicio] = useState<Date | null>(() => {
    const haceUnAno = new Date()
    haceUnAno.setFullYear(haceUnAno.getFullYear() - 1)
    haceUnAno.setDate(1)
    return haceUnAno
  })

  const [fechaFin, setFechaFin] = useState<Date | null>(() => {
    const hoy = new Date()
    // Inicializa con el último día del mes actual
    return new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
  })

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<number | null>(null)
  const [paginaRentabilidad, setPaginaRentabilidad] = useState<number>(0)

  // Estados de carga (sin cambios)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const manejarCambioFechaFin = (date: Date | null) => {
    if (date) {
      // Truco de JavaScript: al pedir el día 0 del mes SIGUIENTE,
      // nos devuelve el último día del mes actual.
      const ultimoDiaDelMes = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      setFechaFin(ultimoDiaDelMes)
    } else {
      setFechaFin(null)
    }
  }

  // Rellena los meses faltantes en un set de datos para asegurar consistencia.
  const rellenarYFormatearDatosMensuales = (
    datosApi: DatosParaGrafico,
    fechaInicio: Date,
    fechaFin: Date,
    config: { tipoEje: "date" | "string"; formatoMoneda?: number[] },
  ): DatosParaGrafico => {
    if (!datosApi || datosApi.length <= 1) return [["Mes", "Valor"]]

    const encabezados = datosApi[0]
    const datosMapa = new Map(datosApi.slice(1).map((fila) => [fila[0] as string, fila.slice(1)]))

    const resultadoFinal: FilaGrafico[] = []
    const fechaActual = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), 1)

    while (fechaActual <= fechaFin) {
      const mesString = `${fechaActual.getFullYear()}-${String(fechaActual.getMonth() + 1).padStart(2, "0")}`
      const valores = datosMapa.get(mesString) || Array(encabezados.length - 1).fill(0)

      let ejeX
      if (config.tipoEje === "date") {
        ejeX = new Date(`${mesString}-02`)
      } else {
        ejeX = new Date(`${mesString}-02`).toLocaleDateString("en-US", { month: "short", year: "numeric" })
      }

      const valoresFormateados = valores.map((valor, index) => {
        if (config.formatoMoneda?.includes(index + 1)) {
          return { v: valor as number, f: formatCurrency(valor as number) }
        }
        return valor
      })

      resultadoFinal.push([ejeX, ...valoresFormateados])
      fechaActual.setMonth(fechaActual.getMonth() + 1)
    }

    // Modificamos el encabezado para el tipo 'date' si es necesario
    if (config.tipoEje === "date") {
      encabezados[0] = { type: "date", label: "Mes" }
    }

    return [encabezados, ...resultadoFinal]
  }

  // --- 2. useEffect PRINCIPAL SIMPLIFICADO ---
  useEffect(() => {
    if (!fechaInicio || !fechaFin) return

    const cargarTodosLosDatos = async () => {
      setCargando(true)
      setError(null)

      try {
        const fechasParams = {
          fechaInicio: fechaInicio.toISOString().split("T")[0],
          fechaFin: fechaFin.toISOString().split("T")[0],
        }

        const [
          kpisData,
          ingresosData,
          categoriasRentablesData,
          volumenData,
          ventasHoraData,
          categoriasData,
          metodosPagoData,
          ventasPorCategoriaData,
        ] = await Promise.all([
          obtenerKpis(),
          obtenerIngresosVsEgresos(fechasParams),
          obtenerCategoriasRentables(fechasParams, paginaRentabilidad),
          obtenerVolumenVentas(fechasParams, categoriaSeleccionada),
          obtenerVentasPorHora(fechasParams),
          obtenerCategorias(),
          obtenerVentasPorMetodoDePago(fechasParams),
          obtenerVentasPorCategoria(fechasParams),
        ])

        // --- 3. APLICAMOS LAS TRANSFORMACIONES ---
        setDatosIngresosVsEgresos(
          rellenarYFormatearDatosMensuales(ingresosData, fechaInicio, fechaFin, {
            tipoEje: "date",
            formatoMoneda: [1, 2],
          }),
        )
        setDatosVolumenVentas(
          rellenarYFormatearDatosMensuales(volumenData, fechaInicio, fechaFin, { tipoEje: "string" }),
        )

        // Transformaciones que no necesitan rellenar meses
        if (categoriasRentablesData && categoriasRentablesData.length > 1) {
          const encabezados = categoriasRentablesData[0]
          const filas = categoriasRentablesData.slice(1).map((fila) => {
            const [categoria, ganancia] = fila as [string, number]
            return [categoria, { v: ganancia, f: formatCurrency(ganancia) }]
          })
          setDatosCategoriasRentables([encabezados, ...filas])
        } else {
          setDatosCategoriasRentables(categoriasRentablesData)
        }

        // 4. Transformación para "Ventas por Hora" (en un rango específico)
        if (ventasHoraData && ventasHoraData.length > 1) {
          const encabezados = ventasHoraData[0]

          const datosMapa = new Map(ventasHoraData.slice(1).map((fila) => [fila[0] as number, fila[1] as number]))

          const horaInicio = 8
          const horaFin = 22
          const numeroDeHoras = horaFin - horaInicio + 1

          const filasCompletas = Array.from({ length: numeroDeHoras }, (_, i) => {
            const hora = horaInicio + i
            const cantidad = datosMapa.get(hora) || 0
            return [`${hora}hs`, cantidad]
          })

          setDatosVentasPorHora([encabezados, ...filasCompletas])
        } else {
          // Si no hay datos, creamos un gráfico vacío en el rango deseado
          const encabezados = ["Hora", "Cantidad"]
          const horaInicio = 8
          const horaFin = 22
          const numeroDeHoras = horaFin - horaInicio + 1
          const filasVacias = Array.from({ length: numeroDeHoras }, (_, i) => [`${horaInicio + i}hs`, 0])
          setDatosVentasPorHora([encabezados, ...filasVacias])
        }
        setKpis(kpisData)
        setCategorias(categoriasData)
        setDatosMetodosDePago(metodosPagoData)
        setDatosVentasPorCategoria(ventasPorCategoriaData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar estadísticas")
      } finally {
        setCargando(false)
      }
    }

    cargarTodosLosDatos()
  }, [fechaInicio, fechaFin, categoriaSeleccionada, paginaRentabilidad])

  let ticksIngresosVsEgresos: Date[] = []
  if (datosIngresosVsEgresos && datosIngresosVsEgresos.length > 1) {
    // Extraemos la primera columna (las fechas) de cada fila de datos.
    ticksIngresosVsEgresos = datosIngresosVsEgresos
      .slice(1) // Omitimos el encabezado
      .map((fila) => fila[0] as Date) // Extraemos solo la fecha de cada fila
  }

  const opcionesIngresosVsEgresos = {
    hAxis: {
      format: "MMM y",
      slantedText: true,
      slantedTextAngle: 60,
      ticks: ticksIngresosVsEgresos,
    },
    vAxis: {
      format: "$ #,##0",
    },
    colors: ["#4dbe7a", "#EF4444"],
    backgroundColor: "transparent",
    legend: {
      position: "top",
      alignment: "center",
      textStyle: {
        fontSize: 13,
      },
    },
    chartArea: { left: 65, top: 30, right: 10, width: "80%", height: "70%" },
  }

  const opcionesProductosRentables = {
    hAxis: {
      format: "$ #,##0",
    },
    legend: {
      position: "none",
    },
    colors: ["#7393A6"],
    backgroundColor: "transparent",
    chartArea: { left: 135, top: 15, right: 35, width: "100%", height: "80%" },
  }

  const opcionesVolumenVentas = useMemo(() => {
    let maxValor = 0
    // Buscamos el valor más alto en los datos actuales
    if (datosVolumenVentas && datosVolumenVentas.length > 1) {
      // Usamos .slice(1) para ignorar la fila de encabezados
      maxValor = Math.max(...datosVolumenVentas.slice(1).map((fila) => fila[1] as number))
    }

    // Calculamos el nuevo techo, añadiendo un 20% de margen y redondeando hacia arriba
    const techoGrafico = Math.ceil(maxValor * 1.2)

    return {
      bar: {
        groupWidth: "40px",
      },
      legend: {
        position: "none",
      },
      hAxis: {
        format: "MMM y",
        slantedText: true,
        slantedTextAngle: 60,
        ticks: ticksIngresosVsEgresos,
      },
      vAxis: {
        title: "Cantidad Vendida",
        titleTextStyle: { color: "#374151", fontSize: 12 },
        viewWindow: {
          min: 0,
          max: techoGrafico,
        },
        format: "#",
      },
      colors: ["#7393A6"],
      backgroundColor: "transparent",
      chartArea: { left: 60, top: 30, right: 40, width: "80%", height: "70%" },
    }
  }, [datosVolumenVentas, categoriaSeleccionada, categorias])

  const opcionesVentasPorHora = {
    hAxis: {
      showTextEvery: 1,
      slantedText: true,
      slantedTextAngle: 60,
      format: "#hs",
    },
    vAxis: {
      title: "Cantidad de Ventas",
      titleTextStyle: { color: "#374151", fontSize: 12 },
      format: "#",
    },
    legend: {
      position: "none",
    },
    colors: ["#7393A6"],
    backgroundColor: "transparent",
    chartArea: { left: 60, top: 60, bottom: 35, right: 30, width: "80%", height: "70%" },
  }

  const opcionesVentasPorCategoria = {
    is3D: true,
    backgroundColor: "transparent",
    legend: {
      position: "labeled",
      textStyle: {
        color: "#4B5563",
        fontSize: 12,
        bold: true,
      },
    },
    colors: ["#6f876f", "#4b576c", "#9c5a4b", "#e2ab70", "#ECCAB1", "#837587"],
    chartArea: { left: 30, top: 40, bottom: 30, right: 30, width: "80%", height: "70%" },
  }

  const opcionesMetodosDePago = {
    isStacked: "percent",
    backgroundColor: "transparent",
    bar: {
      groupWidth: "27%",
    },
    annotations: {
      textStyle: {
        fontSize: 12,
        bold: false,
      },
    },
    legend: {
      position: "bottom",
      textStyle: {
        color: "#4B5563",
        fontSize: 12,
        bold: true,
      },
    },
    hAxis: {
      minValue: 0,
      ticks: [0, 0.2, 0.4, 0.6, 0.8, 1],
      format: "percent",
      gridlines: {
        count: 6,
      },
    },
    colors: ["#72434F", "#94686D", "#FFB37B", "#FBDB93"],
    chartArea: { left: 50, top: 30, bottom: 90, right: 20, width: "80%", height: "70%" },
  }

  const recaudadoMes = (kpis.find((kpi) => kpi.nombre === "Recaudado este Mes")?.valor as number) || 0
  const gananciaMes = (kpis.find((kpi) => kpi.nombre === "Ganancia este Mes")?.valor as number) || 0
  const porcentajeGanancia = recaudadoMes > 0 ? (gananciaMes / recaudadoMes) * 100 : 0

  const enStock = (kpis.find((kpi) => kpi.nombre === "En Stock")?.valor as number) || 0
  const enPosiblesVentas = (kpis.find((kpi) => kpi.nombre === "En Posibles Ventas")?.valor as number) || 0

  return (
    <div className="p-6 min-h-screen">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ChartNoAxesCombined className="text-azul" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Estadísticas</h1>
            <p className="text-gray-600">Panel de indicadores y análisis del negocio</p>
          </div>
        </div>
      </div>

      {/* Panel de Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-4 pr-8 mb-6">
        <div className="flex items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</label>
            <DatePicker
              selected={fechaInicio}
              onChange={(date) => setFechaInicio(date)}
              showMonthYearPicker
              locale="es"
              dateFormat="MM/yyyy"
              placeholderText="Seleccionar mes/año"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Fin</label>
            <DatePicker
              selected={fechaFin}
              onChange={manejarCambioFechaFin}
              showMonthYearPicker
              locale="es"
              dateFormat="MM/yyyy"
              placeholderText="Seleccionar mes/año"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="ml-auto mb-3">
            <button
              onClick={() => setModalExportarAbierto(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#19754C] text-white rounded-md hover:bg-[#156541]"
            >
              <TableProperties size={18} />
              Exportar a Excel
            </button>
          </div>
        </div>
      </div>

      {/* Mensaje de Error */}
      {error && <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 mb-6">{error}</div>}

      <div className="grid grid-cols-6 gap-6 mb-6">
        {kpis
          .filter((kpi) => kpi.nombre !== "Ganancia este Mes" && kpi.nombre !== "En Stock" && kpi.nombre !== "En Posibles Ventas")
          .map((kpi, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm px-4 py-5">
              <p className="text-sm text-center font-medium text-gray-600 mb-3">{kpi.nombre}</p>
              <div className="flex items-center justify-center">
                <div className="flex-shrink-0">
                  {/* Lógica de íconos (sin cambios) */}
                  {index === 0 && <PiggyBank className="h-8 w-8 text-pink-400" />}
                  {index === 1 && <Coins className="h-8 w-8 text-yellow-500" />}
                  {index === 2 && <Truck className="h-8 w-8 text-gray-600" />}
                  {index === 3 && <ClipboardList className="h-8 w-8 text-gray-600" />}
                  {index === 4 && <Activity className="h-8 w-8 text-gray-600" />}
                  {index === 5 && <AlertTriangle className="h-8 w-8 text-rojo" />}
                </div>
                <div className="ml-3">

                  <p className="text-xl font-semibold text-center text-gray-900">
                    {index === 0 || index === 1 || index === 2 || index === 4 || index === 6
                      ? formatCurrency(kpi.valor as number)
                      : kpi.valor.toString()}
                  </p>
                </div>
              </div>
            </div>
          ))}

        <div className="col-span-4 bg-white rounded-lg shadow-sm px-4 py-5">
          <p className="text-xl text-center font-medium text-gray-700 ml-5 mb-4">Ganancia sobre lo Recaudado del Mes</p>

          <div className="space-y-2">
            <div className="relative h-7 bg-gray-200 rounded-lg overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-verde transition-all duration-300"
                style={{ width: `${porcentajeGanancia}%` }}
              />
              <div
                className="absolute top-0 h-full flex items-center"
                style={{ left: `${porcentajeGanancia / 2}%`, transform: "translateX(-50%)" }}
              >
                <span className="text-sm font-medium text-white drop-shadow-sm">
                  {porcentajeGanancia.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Ganancia</p>
                  <p className="text-base font-semibold text-gray-900">{formatCurrency(gananciaMes)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mr-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Recaudado</p>
                  <p className="text-base font-semibold text-gray-900">{formatCurrency(recaudadoMes)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-2 bg-white rounded-lg shadow-sm p-6 flex flex-col justify-between h-full">
          {/* Título */}
          <p className="text-xl text-center font-medium text-gray-700 mb-4">
            Estado Actual del Inventario
          </p>

          {/* Contenedor para los valores */}
          <div className="flex justify-around items-center text-center mt-2 flex-grow">
            <div>
              <p className="text-sm text-gray-500 font-medium">En Stock</p>
              <p className="text-xl font-bold text-gray-800 mt-1">
                {formatCurrency(enStock)}
              </p>
            </div>

            <div className="border-l border-gray-200 h-16"></div>

            <div>
              <p className="text-sm text-gray-500 font-medium">En Posibles Ventas</p>
              <p className="text-xl font-bold text-gray-800 mt-1">
                {formatCurrency(enPosiblesVentas)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Gráficos */}
      <div className="grid grid-cols-2 gap-6">

        {/* Top Categorías Rentables */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Categorías por Rentabilidad</h3>

            {/* Controles de Paginación */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPaginaRentabilidad((p) => Math.max(0, p - 1))}
                disabled={paginaRentabilidad === 0 || cargando}
                className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronLeft size={20} />
              </button>

              <p className="text-sm text-gray-700">
                Página <span className="font-medium">{paginaRentabilidad + 1}</span>
              </p>

              <button
                disabled={!datosCategoriasRentables || datosCategoriasRentables.slice(1).length < 7 || cargando}
                onClick={() => setPaginaRentabilidad((p) => p + 1)}
                className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {cargando || !datosCategoriasRentables ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="flex items-center">
                <RefreshCw className="animate-spin mr-2" size={20} />
                Cargando datos...
              </div>
            </div>
          ) : (
            <Chart
              chartType="BarChart"
              width="100%"
              height="300px"
              data={datosCategoriasRentables}
              options={opcionesProductosRentables}
            />
          )}
        </div>

        {/* Ventas por Método de Pago */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Ventas por Método de Pago</h3>
          {cargando || !datosMetodosDePago ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="flex items-center">
                <RefreshCw className="animate-spin mr-2" size={20} />
                Cargando datos...
              </div>
            </div>
          ) : (
            <Chart
              chartType="BarChart"
              width="100%"
              height="300px"
              data={datosPivoteadosParaGrafico}
              options={opcionesMetodosDePago}
            />
          )}
        </div>

        {/* Volumen de Ventas Mensual */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Volumen de Ventas Mensual</h3>
            <select
              value={categoriaSeleccionada || ""}
              onChange={(e) => setCategoriaSeleccionada(e.target.value ? Number(e.target.value) : null)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={cargando}
            >
              <option value="">Todas las categorías</option>
              {categorias.map((categoria) => (
                <option key={categoria.idCategoria} value={categoria.idCategoria}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </div>
          {cargando || !datosVolumenVentas ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="flex items-center">
                <RefreshCw className="animate-spin mr-2" size={20} />
                Cargando datos...
              </div>
            </div>
          ) : (
            <Chart
              chartType="ColumnChart"
              width="100%"
              height="300px"
              data={datosVolumenVentas}
              options={opcionesVolumenVentas}
            />
          )}
        </div>

        {/* Gráfico 1: Ingresos vs Egresos */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Ingresos vs. Egresos</h3>
          {cargando || !datosIngresosVsEgresos ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="flex items-center">
                <RefreshCw className="animate-spin mr-2" size={20} />
                Cargando datos...
              </div>
            </div>
          ) : (
            <Chart
              chartType="AreaChart"
              width="100%"
              height="300px"
              data={datosIngresosVsEgresos}
              options={opcionesIngresosVsEgresos}
            />
          )}
        </div>

        {/* Ventas por Hora */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Cantidad de Ventas por Hora</h3>
          {cargando || !datosVentasPorHora ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="flex items-center">
                <RefreshCw className="animate-spin mr-2" size={20} />
                Cargando datos...
              </div>
            </div>
          ) : (
            <Chart
              chartType="ColumnChart"
              width="100%"
              height="300px"
              data={datosVentasPorHora}
              options={opcionesVentasPorHora}
            />
          )}
        </div>

        {/* Ventas por Categoría */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Categorías con Mayor Facturación</h3>
          {cargando || !datosVentasPorCategoria ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="flex items-center">
                <RefreshCw className="animate-spin mr-2" size={20} />
                Cargando datos...
              </div>
            </div>
          ) : (
            <Chart
              chartType="PieChart"
              width="100%"
              height="300px"
              data={datosVentasPorCategoria}
              options={opcionesVentasPorCategoria}
            />
          )}
        </div>
      </div>

      <ModalExportarReporte isOpen={modalExportarAbierto} onClose={() => setModalExportarAbierto(false)} />
    </div>
  )
}

export default PaginaEstadisticas
