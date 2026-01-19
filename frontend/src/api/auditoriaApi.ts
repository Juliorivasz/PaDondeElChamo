import apiClient from "./interceptors/apiClient"
import type { AuditoriaDTO, NuevaAuditoriaDTO, ConteoDTO } from "../types/dto/Auditoria"

export const iniciarAuditoria = async (idUsuario: number): Promise<NuevaAuditoriaDTO> => {
  const response = await apiClient.post<NuevaAuditoriaDTO>(`/auditoria/iniciar/${idUsuario}`)
  return response.data
}

export const registrarConteo = async (idAuditoria: number, conteos: ConteoDTO[]): Promise<void> => {
  await apiClient.post(`/auditoria/registrar-conteo/${idAuditoria}`, conteos)
}

export const resolverDetalle = async (idDetalle: number, accion: "AJUSTAR" | "IGNORAR"): Promise<void> => {
  await apiClient.put(`/auditoria/resolver-detalle/${idDetalle}`, {}, {
    params: { accion },
  })
}

export const agregarObservacion = async (idAuditoria: number, observacion: string): Promise<void> => {
  await apiClient.put(`/auditoria/observacion/${idAuditoria}`, { observacion })
}

export const obtenerAuditorias = async (): Promise<AuditoriaDTO[]> => {
  const response = await apiClient.get<AuditoriaDTO[]>("/auditoria")
  return response.data
}
