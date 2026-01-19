// Para las tarjetas de KPI del dashboard
export interface KpiDTO {
  nombre: string
  valor: string | number
}


// Una "Celda" individual puede ser un valor simple o un objeto de formato especial
export type CeldaGrafico = 
  | string 
  | number 
  | Date 
  | { type?: string; label?: string; role?: string } // Para encabezados
  | { v?: number | Date; f?: string }; // Para valores formateados (moneda, etc.)

// Una "Fila" es un array de celdas
export type FilaGrafico = CeldaGrafico[];

// Los datos completos para un gráfico son un array de filas
export type DatosParaGrafico = FilaGrafico[];

// Para los filtros de fecha en el dashboard
export interface FiltrosFecha {
  fechaInicio: string
  fechaFin: string
}

// Para el parámetro opcional de producto en volumen de ventas
export interface FiltroVolumenVentas extends FiltrosFecha {
  idProducto?: number | null
}
