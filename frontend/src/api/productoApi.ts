import axios from "axios"
import apiClient from "./interceptors/apiClient"
import type { PaginaDeProductos, ProductoDTO, ProductoLista, ProductoVenta } from "../types/dto/Producto"
import type { ItemCatalogo } from "../types/dto/Venta"

// Obtener productos con filtros y paginación
export const obtenerProductos = async (filtros: any): Promise<PaginaDeProductos> => {
  const params = new URLSearchParams()

  if (filtros.page !== undefined) params.append("page", filtros.page.toString())
  if (filtros.size !== undefined) params.append("size", filtros.size.toString())
  if (filtros.nombre) params.append("nombre", filtros.nombre)
  if (filtros.idCategoria) params.append("idCategoria", filtros.idCategoria.toString())
  if (filtros.idMarca) params.append("idMarca", filtros.idMarca.toString())
  if (filtros.idProveedor) params.append("idProveedor", filtros.idProveedor.toString())
  if (filtros.bajoStock) params.append("bajoStock", "true")

  const response = await apiClient.get(`/producto/abm?${params.toString()}`)
  return response.data
}

// Crear nuevo producto
export const crearProducto = async (data: ProductoDTO): Promise<void> => {  
  await apiClient.post(`/producto/nuevo`, data)
}

// Modificar producto existente
export const modificarProducto = async (id: number, data: ProductoDTO): Promise<void> => {
  await apiClient.put(`/producto/modificar/${id}`, data)
}

// Cambiar estado del producto
export const cambiarEstadoProducto = async (id: number): Promise<void> => {
  await apiClient.patch(`/producto/cambiarEstado/${id}`)
}

export const obtenerListaProductosCompra = async (): Promise<ProductoLista[]> => {
  const response = await apiClient.get(`/producto/listaCompra`)
  return response.data
}

export const obtenerListaProductosVenta = async (): Promise<ProductoVenta[]> => {
  const response = await apiClient.get(`/producto/listaVenta`)
  return response.data
}

export const buscarProductoPorCodigo = async (codigo: string): Promise<ItemCatalogo | null> => {
  try {
    const response = await apiClient.get<ItemCatalogo>(`/producto/buscarPorCodigo/${codigo}`);
    return response.data;
  } catch (error) {
    // Si Axios nos da un error y el código de estado es 404 (No Encontrado),
    // no es un error crítico, simplemente significa que el producto no existe.
    // En ese caso, devolvemos null.
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    // Para cualquier otro error (ej: 500, error de red), sí lo lanzamos.
    console.error("Error al buscar producto por código:", error);
    throw error;
  }
};
