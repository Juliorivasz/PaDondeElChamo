// Item del catálogo unificado que recibimos de la API
export interface ItemCatalogo {
  tipo: "PRODUCTO"
  id: string
  nombre: string
  precioFinal: number
  idCategoria?: string
  aplicaDescuentoAutomatico?: boolean
  // Descuento por categoría
  porcentaje?: number | null
  precioConDescuento?: number | null
  // Oferta por cantidad
  cantidadMinima?: number | null
  nuevoPrecio?: number | null
}

// Item en el carrito de la venta actual
export interface ItemVenta {
  item: ItemCatalogo
  cantidad: number
  precioUnitarioAplicado: number
}

// DTO para enviar al backend al crear/modificar una venta
export interface VentaDTO {
  metodoDePago: string
  descuento: number
  montoAdicional: number | null
  tipoDescuento: "MONTO" | "PORCENTAJE" | "AUTOMATICO" | "NINGUNO"
  porcentajeAplicado?: number | null
  detalles: {
    idProducto: string
    cantidad: number
  }[]
}

// Respuesta de venta individual para el historial
export interface VentaHistorial {
  idVenta: string
  total: number
  descuento: number
  montoAdicional: number | null
  metodoDePago: string
  usuario: string
  fechaHora: string
  tipoDescuento: "MONTO" | "PORCENTAJE" | "AUTOMATICO" | "NINGUNO"
  porcentajeAplicado?: number | null
  detalles: DetalleVentaHistorial[]
}

// Detalle de venta para el historial
export interface DetalleVentaHistorial {
  nombre: string
  cantidad: number
  precioUnitario: number
}

// Respuesta paginada de ventas
export interface PaginaDeVentas {
  content: VentaHistorial[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
