import apiClient from "./interceptors/apiClient"
import type { Categoria, CrearCategoriaDTO, ModificarCategoriaDTO } from "../types/dto/Categoria"

// Obtener todas las categorías
export const obtenerCategorias = async (): Promise<Categoria[]> => {
  const response = await apiClient.get<Categoria[]>("/categoria/abm")
  return response.data
}

// Crear nueva categoría
export const crearCategoria = async (data: CrearCategoriaDTO): Promise<any> => {
  const response = await apiClient.post("/categoria/nueva", data)
  return response.data
}

// Modificar categoría existente
export const modificarCategoria = async (id: number, data: ModificarCategoriaDTO): Promise<any> => {
  const response = await apiClient.put(`/categoria/modificar/${id}`, data)
  return response.data
}

// Cambiar estado de categoría (activar/desactivar)
export const cambiarEstadoCategoria = async (id: number): Promise<any> => {
  const response = await apiClient.patch(`/categoria/cambiarEstado/${id}`)
  return response.data
}
