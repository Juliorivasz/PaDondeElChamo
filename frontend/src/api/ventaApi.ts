import apiClient from "./interceptors/apiClient"
import type { ItemCatalogo, VentaDTO, PaginaDeVentas } from "../types/dto/Venta"

// Obtener catálogo unificado para la terminal de venta
export const obtenerCatalogoVenta = async (): Promise<ItemCatalogo[]> => {
  const response = await apiClient.get(`/venta/catalogo`)
  return response.data
}

// Obtener métodos de pago disponibles
export const obtenerMetodosDePago = async (): Promise<string[]> => {
  const response = await apiClient.get(`/venta/metodosDePago`)
  return response.data
}

// Crear nueva venta
export const crearVenta = async (data: VentaDTO): Promise<void> => {
  await apiClient.post(`/venta/nueva`, data)
}

// Obtener ventas con filtros y paginación
export const obtenerVentas = async (filtros: any): Promise<PaginaDeVentas> => {
  const params = new URLSearchParams()

  if (filtros.pagina !== undefined) params.append("page", filtros.pagina.toString())
  if (filtros.tamaño !== undefined) params.append("size", filtros.tamaño.toString())
  if (filtros.fechaInicio) params.append("fechaInicio", filtros.fechaInicio)
  if (filtros.fechaFin) params.append("fechaFin", filtros.fechaFin)
  if (filtros.idUsuario) params.append("idUsuario", filtros.idUsuario.toString())
  if (filtros.metodoDePago) params.append("metodoDePago", filtros.metodoDePago.toString())

  const response = await apiClient.get(`/venta/obtener?${params}`)
  return response.data
}
