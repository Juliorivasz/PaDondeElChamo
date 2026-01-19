// Para el GET /categoria/abm
export interface Categoria {
  idCategoria: number
  nombre: string
  descripcion: string
  estado: boolean
  stockMinimo: number
  aplicaDescuentoAutomatico: boolean
  idCategoriaPadre: number | null
  productos: { 
    idProducto: number
    nombre: string
    precio: number
  }[]
}

// Para el POST /categoria/nueva
export interface CrearCategoriaDTO {
  nombre: string
  descripcion: string
  idCategoriaPadre: number | null
  stockMinimo: number
  aplicaDescuentoAutomatico?: boolean
}

// Para el PUT /categoria/modificar/{id}
export interface ModificarCategoriaDTO {
  nombre?: string
  descripcion?: string
  idCategoriaPadre?: number | null
  stockMinimo?: number
  aplicaDescuentoAutomatico?: boolean
}

// Interfaz para la estructura de árbol de categorías
export interface CategoriaArbol extends Categoria {
  hijos: CategoriaArbol[]
  nivel: number
  esHijoDeRaiz?: boolean
}
