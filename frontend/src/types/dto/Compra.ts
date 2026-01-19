export interface DetalleCompra {
  idProducto: number
  producto: string
  cantidad: number
  costoUnitario: number
}

// Corresponde al objeto 'content' de la respuesta paginada
export interface Compra {
  idCompra: number
  total: number
  fechaHora: string
  proveedor: string
  usuario: string
  estadoCompra: string
  detalles: DetalleCompra[]
}

export interface PaginaDeCompras {
  content: Compra[]
  totalPages: number
  totalElements: number
  number: number 
  size: number
}

export interface CompraDTO {
  idProveedor: number
  detalles: {
    idProducto: number
    cantidad: number
    costoUnitario: number
  }[]
}
