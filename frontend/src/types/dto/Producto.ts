// Corresponde al objeto 'content' de GET /producto/abm
export interface ProductoAbm {
  idProducto: number
  nombre: string
  codigoDeBarras: string
  precio: number
  porcentaje: number | null // El descuento puede no existir
  precioConDescuento: number | null
  cantidadMinima: number | null 
  nuevoPrecio: number | null 
  costo: number
  stock: number
  cantVendida: number
  cantComprada: number  
  stockMinimo: number
  estado: boolean  
  marca: string
  categoria: string
  proveedor: string
  idCategoria: number
  idDescuento: number | null
  idOferta: number | null
  imagenUrl?: string | null
}

// Para la respuesta completa de la API
export interface PaginaDeProductos {
  content: ProductoAbm[]
  totalPages: number
  totalElements: number
  number: number // Página actual
  size: number
}

// Para POST /nuevo y PUT /modificar
export interface ProductoDTO {
  nombre: string
  precio: number
  costo: number
  stock: number
  idMarca: number
  idCategoria: number
  idProveedor: number
  imagenUrl?: string | File | null
}

// Para las listas de los filtros
export interface MarcaLista {
  idMarca: number
  nombre: string
}

export interface CategoriaLista {
  idCategoria: number
  nombre: string
}

export interface ProveedorLista {
  idProveedor: number
  nombre: string
}

// Para la respuesta de GET /producto/listaCompra/{id}
export interface ProductoLista {
  idProducto: number // Necesitaremos el ID para el DTO final
  nombre: string
  costo: number
}

// Para la respuesta de GET /producto/listaVenta
export interface ProductoVenta {
  idProducto: number
  nombre: string
  precio: number
}
