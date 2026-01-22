export interface DetalleCompra {
  idProducto: string
  producto: string
  tipo: 'PRODUCTO' | 'INSUMO'
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
  idProveedor: string
  nombreUsuario?: string
  detalles: {
    tipo: 'PRODUCTO' | 'INSUMO'
    idItem: string
    nombre: string // Desnormalizado
    cantidad: number
    costoUnitario: number
  }[]
}
