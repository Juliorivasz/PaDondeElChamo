export type TipoAlerta = 
  | 'STOCK_NEGATIVO' 
  | 'SIN_PRECIO' 
  | 'SIN_COSTO' 
  | 'STOCK_BAJO' 
  | 'PRECIO_MENOR_COSTO'

export type SeveridadAlerta = 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA'

export interface AlertaInventario {
  id: string
  tipo: TipoAlerta
  severidad: SeveridadAlerta
  idProducto: string
  nombreProducto: string
  mensaje: string
  valorActual?: number
  valorEsperado?: number
  fechaDeteccion: Date
  origen: 'PRODUCTO' | 'INSUMO'
}
