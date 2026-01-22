// Para el GET /categoria/abm
export interface Categoria {
  idCategoria: string  // Changed to string for Firebase
  nombre: string
  descripcion?: string  // Made optional to match API
  estado: boolean
  stockMinimo: number
  aplicaDescuentoAutomatico: boolean
  idCategoriaPadre?: string | null  // Made optional to match API
  productos?: {  // Made optional to match API
    idProducto: string  // Changed to string for Firebase
    nombre: string
    precio: number
  }[]
}

// Para el POST /categoria/nueva
export interface CrearCategoriaDTO {
  nombre: string
  descripcion: string
  idCategoriaPadre: string | null  // Changed to string for Firebase
  stockMinimo: number
  aplicaDescuentoAutomatico?: boolean
}

// Para el PUT /categoria/modificar/{id}
export interface ModificarCategoriaDTO {
  nombre?: string
  descripcion?: string
  idCategoriaPadre?: string | null  // Changed to string for Firebase
  stockMinimo?: number
  aplicaDescuentoAutomatico?: boolean
}

// Interfaz para la estructura de árbol de categorías
export interface CategoriaArbol extends Categoria {
  hijos: CategoriaArbol[]
  nivel: number
  esHijoDeRaiz?: boolean
}

