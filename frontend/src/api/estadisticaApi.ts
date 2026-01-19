import apiClient from "./interceptors/apiClient"
import type { KpiDTO, DatosParaGrafico, FiltrosFecha } from "../types/dto/Estadisticas"

// Obtener KPIs del dashboard
export const obtenerKpis = async (): Promise<KpiDTO[]> => {
  const response = await apiClient.get(`/estadistica/kpis`)
  return response.data
}

// Obtener datos de ingresos vs egresos
export const obtenerIngresosVsEgresos = async (fechas: FiltrosFecha): Promise<DatosParaGrafico> => {
  const params = new URLSearchParams()
  params.append("fechaInicio", fechas.fechaInicio)
  params.append("fechaFin", fechas.fechaFin)

  const response = await apiClient.get(`/estadistica/ingresos-vs-egresos?${params.toString()}`)
  return response.data
}

export const obtenerCategoriasRentables = async (fechas: FiltrosFecha, page: number): Promise<DatosParaGrafico> => {
  const params = {
    fechaInicio: fechas.fechaInicio,
    fechaFin: fechas.fechaFin,
    page: page,
  };
  
  const response = await apiClient.get('/estadistica/categorias-rentables', { params });
  return response.data;
}

// Obtener volumen de ventas mensual
export const obtenerVolumenVentas = async (
  fechas: FiltrosFecha,
  idCategoria?: number | null,
): Promise<DatosParaGrafico> => {
  const params = new URLSearchParams()
  params.append("fechaInicio", fechas.fechaInicio)
  params.append("fechaFin", fechas.fechaFin)

  if (idCategoria !== null && idCategoria !== undefined) {
    params.append("idCategoria", idCategoria.toString())
  }

  const response = await apiClient.get(`/estadistica/volumen-ventas?${params.toString()}`)
  return response.data
}

// Obtener ventas por hora del día
export const obtenerVentasPorHora = async (fechas: FiltrosFecha): Promise<DatosParaGrafico> => {
  const params = new URLSearchParams()
  params.append("fechaInicio", fechas.fechaInicio)
  params.append("fechaFin", fechas.fechaFin)

  const response = await apiClient.get(`/estadistica/ventas-por-hora?${params.toString()}`)
  return response.data
}

// Obtener ventas por método de pago
export const obtenerVentasPorMetodoDePago = async (fechas: {
  fechaInicio: string
  fechaFin: string
}): Promise<DatosParaGrafico> => {
  const params = new URLSearchParams()
  params.append("fechaInicio", fechas.fechaInicio)
  params.append("fechaFin", fechas.fechaFin)

  const response = await apiClient.get(`/estadistica/ventas-por-metodo-pago?${params.toString()}`)
  return response.data
}

export const obtenerVentasPorCategoria = async (fechas: {
  fechaInicio: string
  fechaFin: string
}): Promise<DatosParaGrafico> => {
  const params = new URLSearchParams()
  params.append("fechaInicio", fechas.fechaInicio)
  params.append("fechaFin", fechas.fechaFin)

  const response = await apiClient.get(`/estadistica/ventas-por-categoria?${params.toString()}`)
  return response.data
}