// Corresponde al objeto 'content' de GET /producto/abm
export type TipoProducto = 'SIMPLE' | 'ELABORADO' | 'MIXTO';

export interface DetalleReceta {
  idInsumo: string;
  nombreInsumo: string;
  cantidad: number;
  unidadMedida: string;
  costoUnitario?: number;
  subtotal?: number;
}

export interface ProductoAbm {
  idProducto: string
  nombre: string
  codigoDeBarras?: string
  precio: number
  porcentaje: number | null
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
  proveedor?: string
  idCategoria: string
  idDescuento: string | null
  idOferta: string | null
  imagenUrl?: string | null
  tipoProducto?: TipoProducto
  receta?: DetalleReceta[]
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
  codigoDeBarras?: string
  idMarca: string
  idCategoria: string
  idProveedor?: string
  imagenUrl?: string | File | null
  tipoProducto: TipoProducto
  receta?: DetalleReceta[]
}

// Para las listas de los filtros
export interface MarcaLista {
  idMarca: string
  nombre: string
}

export interface CategoriaLista {
  idCategoria: string
  nombre: string
}

export interface ProveedorLista {
  idProveedor: string
  nombre: string
}

// Para la respuesta de GET /producto/listaCompra/{id}
export interface ProductoLista {
  idProducto: string
  nombre: string
  costo: number
}

// Para la respuesta de GET /producto/listaVenta
export interface ProductoVenta {
  idProducto: string
  nombre: string
  precio: number
}
