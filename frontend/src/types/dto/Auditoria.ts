export interface AuditoriaDTO {
  idAuditoria: number
  fechaHora: string
  usuario: string
  observacion: string | null
  estado: "PENDIENTE" | "FINALIZADA" | "A_REVISAR"
  detalles: DetalleAuditoriaDTO[]
}

export interface DetalleAuditoriaDTO {
  idDetalleAuditoria: number
  producto: string
  categoria: string
  cantidadSistema: number
  cantidadReal: number
  estadoControl: "APROBADO" | "FALTANTE" | "REVISADO_SIN_AJUSTE" | "REVISADO_CON_AJUSTE"
}

export interface NuevaAuditoriaDTO {
  idAuditoria: number
  items: ItemAuditoriaDTO[]
}

export interface ItemAuditoriaDTO {
  idDetalleAuditoria: number
  producto: string
  categoria: string
}

export interface ConteoDTO {
  idDetalleAuditoria: number
  cantidadReal: number
}
