export interface ConfiguracionDTO {
  idConfiguracion?: number
  descuentoAutomatico: boolean 
  montoMinimo: number
  porcentajeDescuento: number
  cantProductosRevision: number
  revisionActiva: boolean
  metodosPagoDescuento?: string[]
}
