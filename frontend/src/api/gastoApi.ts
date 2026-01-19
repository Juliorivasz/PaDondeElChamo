import apiClient from "./interceptors/apiClient"
import type { PaginaDeGastos, GastoDTO } from "../types/dto/Gasto"

// Obtener tipos de gasto disponibles
export const obtenerTiposGasto = async (): Promise<string[]> => {
  const response = await apiClient.get(`/gasto/tipos`)
  return response.data
}

// Obtener gastos con filtros y paginación
export const obtenerGastos = async (filtros: any): Promise<PaginaDeGastos> => {  
  const params = new URLSearchParams()

  Object.keys(filtros).forEach((key) => {
    const valor = filtros[key]
    if (valor !== null && valor !== undefined && valor !== "") {
      params.append(key, valor.toString())
    }
  })

  const response = await apiClient.get(`/gasto/lista?${params.toString()}`)  
  return response.data
}

// Crear nuevo gasto
export const crearGasto = async (data: GastoDTO): Promise<any> => {
  const response = await apiClient.post(`/gasto/nuevo`, data)
  return response.data
}

// Modificar gasto existente
export const modificarGasto = async (id: number, data: GastoDTO): Promise<any> => {
  const response = await apiClient.put(`/gasto/modificar/${id}`, data)
  return response.data
}
