import apiClient from "./interceptors/apiClient"
import type { MarcaLista } from "../types/dto/Producto"

// Obtener lista de marcas para filtros
export const obtenerListaMarcas = async (): Promise<MarcaLista[]> => {
  const response = await apiClient.get(`/marca/lista`)
  return response.data
}

// Crea una nueva marca
export const crearMarca = async (data: { nombre: string }): Promise<MarcaLista> => {
  const response = await apiClient.post(`/marca/nueva`, data)
  return response.data
}

// Modifica una marca existente
export const modificarMarca = async (id: number, data: { nombre: string }): Promise<void> => {
  await apiClient.put(`/marca/modificar/${id}`, data)
}

