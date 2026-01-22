import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Categoria {
  idCategoria: string;
  nombre: string;
  descripcion?: string;
  estado: boolean;
  stockMinimo: number;
  aplicaDescuentoAutomatico: boolean;
  idCategoriaPadre?: string | null;
  productos?: any[];  // Added to match DTO type
  createdAt?: any;
  updatedAt?: any;
}

export interface CrearCategoriaDTO {
  nombre: string;
  descripcion?: string;
  stockMinimo?: number;
  aplicaDescuentoAutomatico?: boolean;
  idCategoriaPadre?: string | null;
}

// Obtener todas las categorías
export const obtenerCategorias = async (): Promise<Categoria[]> => {
  try {
    const q = query(collection(db, 'categorias'), orderBy('nombre'));
    const querySnapshot = await getDocs(q);
    
    const categorias = querySnapshot.docs.map(doc => {
      const data: any = doc.data();
      return {
        idCategoria: doc.id,
        ...data,
        productos: [], // Inicializar array vacío (se llenará cuando migremos productos)
      } as Categoria;
    });
    
    return categorias;
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    throw new Error("No se pudieron cargar las categorías");
  }
};

// Obtener categorías activas
export const obtenerCategoriasActivas = async (): Promise<Categoria[]> => {
  try {
    const q = query(
      collection(db, 'categorias'),
      where('estado', '==', true),
      orderBy('nombre')
    );
    const querySnapshot = await getDocs(q);
    
    const categorias = querySnapshot.docs.map(doc => {
      const data: any = doc.data();
      return {
        idCategoria: doc.id,
        ...data,
      } as Categoria;
    });
    
    return categorias;
  } catch (error) {
    console.error("Error al obtener categorías activas:", error);
    throw new Error("No se pudieron cargar las categorías activas");
  }
};

// Obtener una categoría por ID
export const obtenerCategoriaPorId = async (id: string): Promise<Categoria> => {
  try {
    const docRef = doc(db, 'categorias', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error("Categoría no encontrada");
    }
    
    return {
      idCategoria: docSnap.id,
      ...docSnap.data(),
    } as Categoria;
  } catch (error) {
    console.error("Error al obtener la categoría:", error);
    throw error;
  }
};

// Crear una nueva categoría
export const crearCategoria = async (datos: CrearCategoriaDTO): Promise<Categoria> => {
  try {
    // Verificar si el nombre ya existe
    const q = query(
      collection(db, 'categorias'),
      where('nombre', '==', datos.nombre)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const err: any = new Error(`El nombre ${datos.nombre} ya existe`);
      err.response = { status: 400, data: { message: err.message } };
      throw err;
    }
    
    // Crear nuevo documento
    const docRef = doc(collection(db, 'categorias'));
    const categoriaData = {
      nombre: datos.nombre,
      descripcion: datos.descripcion || '',
      estado: true,
      stockMinimo: datos.stockMinimo || 0,
      aplicaDescuentoAutomatico: datos.aplicaDescuentoAutomatico ?? true,
      idCategoriaPadre: datos.idCategoriaPadre || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(docRef, categoriaData);
    
    return {
      idCategoria: docRef.id,
      ...categoriaData,
    } as Categoria;
  } catch (error: any) {
    console.error("Error al crear la categoría:", error);
    throw error;
  }
};

// Actualizar una categoría
export const modificarCategoria = async (
  id: string,
  datos: Partial<CrearCategoriaDTO>
): Promise<Categoria> => {
  try {
    // Si se está actualizando el nombre, verificar que no exista
    if (datos.nombre) {
      const q = query(
        collection(db, 'categorias'),
        where('nombre', '==', datos.nombre)
      );
      const querySnapshot = await getDocs(q);
      
      // Verificar que no sea la misma categoría
      const exists = querySnapshot.docs.find(doc => doc.id !== id);
      if (exists) {
        const err: any = new Error(`El nombre ${datos.nombre} ya existe`);
        err.response = { status: 400, data: { message: err.message } };
        throw err;
      }
    }
    
    const docRef = doc(db, 'categorias', id);
    
    const updateData: any = {
      ...datos,
      updatedAt: serverTimestamp(),
    };
    
    await updateDoc(docRef, updateData);
    
    // Obtener documento actualizado
    const docSnap = await getDoc(docRef);
    return {
      idCategoria: docSnap.id,
      ...docSnap.data(),
    } as Categoria;
  } catch (error) {
    console.error("Error al actualizar la categoría:", error);
    throw error;
  }
};

// Cambiar estado de una categoría
export const cambiarEstadoCategoria = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'categorias', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error("Categoría no encontrada");
    }
    
    const currentEstado = docSnap.data().estado;
    
    await updateDoc(docRef, {
      estado: !currentEstado,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error al cambiar estado de la categoría:", error);
    throw error;
  }
};

// Eliminar una categoría
export const eliminarCategoria = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'categorias', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error al eliminar la categoría:", error);
    throw error;
  }
};

// Obtener productos de una categoría específica
export const obtenerProductosPorCategoria = async (idCategoria: string): Promise<any[]> => {
  try {
    const q = query(
      collection(db, 'productos'),
      where('idCategoria', '==', idCategoria),
      where('estado', '==', true)
    );
    const querySnapshot = await getDocs(q);
    
    const productos = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        idProducto: doc.id,
        nombre: data.nombre,
        precio: data.precio || 0,
      };
    });
    
    return productos;
  } catch (error) {
    console.error("Error al obtener productos de la categoría:", error);
    return []; // Return empty array on error instead of throwing
  }
};

