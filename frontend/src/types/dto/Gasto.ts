// Corresponde al objeto 'content' de la respuesta paginada
export interface Gasto {
  idGasto: string | number // String para Firestore, number para compatibilidad
  tipoGasto: string
  descripcion: string
  monto: number
  fechaHora: string // Formato ISO 8601, ej: "2025-08-25T03:15:46.776Z"
  usuario: string
}

// Corresponde a la respuesta completa de la API GET /gasto/lista
export interface PaginaDeGastos {
  totalPages: number
  totalElements: number
  number: number // La página actual, indexada en 0
  size: number
  content: Gasto[]
}

// Para el POST /gasto/nuevo y PUT /gasto/modificar/{id}
export interface GastoDTO {
  tipoGasto: string
  descripcion: string
  monto: number
  usuario?: string
}
