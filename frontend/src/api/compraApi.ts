import apiClient from "./interceptors/apiClient"
import type { PaginaDeCompras, CompraDTO } from "../types/dto/Compra"

const handleFileDownload = (response: any, filename: string) => {
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
}

// Obtener compras con filtros y paginación
export const obtenerCompras = async (filtros: any): Promise<PaginaDeCompras> => {
  const params = new URLSearchParams()

  if (filtros.pagina !== undefined) params.append("page", filtros.pagina.toString())
  if (filtros.tamaño !== undefined) params.append("size", filtros.tamaño.toString())
  if (filtros.idProveedor) params.append("idProveedor", filtros.idProveedor.toString())
  if (filtros.fechaInicio) params.append("fechaInicio", filtros.fechaInicio)
  if (filtros.fechaFin) params.append("fechaFin", filtros.fechaFin)
  if (filtros.idUsuario) params.append("idUsuario", filtros.idUsuario.toString())

  const response = await apiClient.get(`/compra/obtener?${params}`)
  return response.data
}

export const crearCompra = async (data: CompraDTO): Promise<void> => {
  await apiClient.post(`/compra/nueva`, data)
}

export const modificarCompra = async (id: number, data: CompraDTO): Promise<void> => {
  await apiClient.put(`/compra/editar/${id}`, data)
}

export const descargarComprobanteCompra = async (id: number): Promise<void> => {
  try {
    const response = await apiClient.get(`/compra/comprobante/${id}`, {
      responseType: "blob", // ¡Muy importante para la descarga de archivos!
    })
    handleFileDownload(response, `ComprobanteCompra #${id}.pdf`)
  } catch (error) {
    console.error("Error al descargar el comprobante:", error)
    throw new Error("No se pudo descargar el comprobante.")
  }
}

export const obtenerEstadosCompra = async (): Promise<string[]> => {
  const response = await apiClient.get(`/compra/estadosCompra`)
  return response.data
}

export const toggleEstadoPagoCompra = async (id: number): Promise<void> => {
  await apiClient.patch(`/compra/cambiarEstado/${id}`)
}