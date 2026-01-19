import apiClient from "./interceptors/apiClient"
import type { ConfiguracionDTO } from "../types/dto/Configuracion"

// Obtener la configuración actual
export const obtenerConfiguracion = async (): Promise<ConfiguracionDTO> => {
  try {
    const response = await apiClient.get<ConfiguracionDTO>("/configuracion")
    return response.data
  } catch (error) {
    console.error("Error al obtener configuración:", error)
    throw new Error("No se pudo cargar la configuración")
  }
}

// Actualizar la configuración
export const actualizarConfiguracion = async (data: ConfiguracionDTO): Promise<any> => {
  try {
    const response = await apiClient.put("/configuracion", data)
    return response.data
  } catch (error) {
    console.error("Error al actualizar configuración:", error)
    throw new Error("No se pudo actualizar la configuración")
  }
}
