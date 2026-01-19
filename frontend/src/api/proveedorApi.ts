import apiClient from "./interceptors/apiClient"
import type { Proveedor, ProveedorDTO } from "../types/dto/Proveedor"

// Obtener todos los proveedores
export const obtenerProveedores = async (): Promise<Proveedor[]> => {
  const response = await apiClient.get(`/proveedor/abm`)
  return response.data
}

// Crear un nuevo proveedor
export const crearProveedor = async (data: ProveedorDTO): Promise<any> => {
  const response = await apiClient.post(`/proveedor/nuevo`, data)
  return response.data
}

// Modificar un proveedor existente
export const modificarProveedor = async (id: number, data: ProveedorDTO): Promise<any> => {
  const response = await apiClient.put(`/proveedor/modificar/${id}`, data)
  return response.data
}

// Cambiar estado de un proveedor (activar/desactivar)
export const cambiarEstadoProveedor = async (id: number): Promise<any> => {
  const response = await apiClient.patch(`/proveedor/cambiarEstado/${id}`)
  return response.data
}

// Obtener lista de proveedores para filtros
export const obtenerListaProveedores = async (): Promise<{ idProveedor: number; nombre: string }[]> => {
  const response = await apiClient.get(`/proveedor/lista`)
  return response.data
}