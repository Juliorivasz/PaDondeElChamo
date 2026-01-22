// src/utils/categoriaUtils.ts

import type { Categoria, CategoriaArbol } from "../types/dto/Categoria";

/**
 * Transforma una lista plana de categorías en una estructura de árbol jerárquico.
 * @param categorias La lista plana de categorías obtenida de la API.
 * @returns Un array de categorías raíz, donde cada una contiene a sus hijos anidados.
 */
export const construirArbolCategorias = (categorias: Categoria[]): CategoriaArbol[] => {
  if (!categorias || categorias.length === 0) {
    return [];
  }

  const mapa = new Map<string, CategoriaArbol>();
  const raices: CategoriaArbol[] = [];

  // 1. Primer paso: Inicializamos el mapa con todas las categorías.
  categorias.forEach((categoria) => {
    mapa.set(categoria.idCategoria, {
      ...categoria,
      hijos: [],
      nivel: 0,
    });
  });

  // 2. Segundo paso: Conectamos los hijos con sus padres para construir el árbol.
  mapa.forEach((nodo) => {
    if (nodo.idCategoriaPadre && mapa.has(nodo.idCategoriaPadre)) {
      const padre = mapa.get(nodo.idCategoriaPadre)!;
      padre.hijos.push(nodo);
    } else {
      raices.push(nodo);
    }
  });

  // 3. Asignamos el nivel de profundidad.
  const asignarNivel = (nodos: CategoriaArbol[], nivel: number) => {
    nodos.forEach(nodo => {
      nodo.nivel = nivel;
      if (nodo.hijos.length > 0) {
        asignarNivel(nodo.hijos, nivel + 1);
      }
    });
  };

  asignarNivel(raices, 0);

  // Etiquetamos a los hijos directos de las categorías raíz.
  raices.forEach(raiz => {
    raiz.hijos.forEach(hijo => {
      hijo.esHijoDeRaiz = true;
    });
  });

  return raices;
};