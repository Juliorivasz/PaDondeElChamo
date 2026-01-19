import { create } from 'zustand';
import type { Categoria, CategoriaArbol } from '../types/dto/Categoria';
import { obtenerCategorias } from '../api/categoriaApi'; // La función que llama a /abm
import { construirArbolCategorias } from '../utils/categoriaUtils';

interface CategoriaState {
  categorias: Categoria[];
  categoriasArbol: CategoriaArbol[];
  cargarCategorias: () => Promise<void>;
  refrescarCategorias: () => Promise<void>;
}

export const useCategoriaStore = create<CategoriaState>((set, get) => ({
  categorias: [],
  categoriasArbol: [],
  cargarCategorias: async () => {
    // Evita recargar si ya tenemos los datos
    if (get().categorias.length > 0) return;

    try {
      const categoriasFlat = await obtenerCategorias();
      const categoriasTree = construirArbolCategorias(categoriasFlat);
      set({ categorias: categoriasFlat, categoriasArbol: categoriasTree });
    } catch (error) {
      console.error("Error al cargar y procesar categorías:", error);
      // Opcional: manejar el estado de error en el store
    }
  },

  refrescarCategorias: async () => {
    // Esta función SIEMPRE va a la API a buscar los datos más recientes
    try {
      const categoriasFlat = await obtenerCategorias();
      const categoriasTree = construirArbolCategorias(categoriasFlat);
      set({ categorias: categoriasFlat, categoriasArbol: categoriasTree });
    } catch (error) {
      console.error("Error al refrescar categorías:", error);
    }
  },
}));