import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Categoria {
  id?: string;
  nombre: string;
  descripcion?: string;
  porcentajeDescuento?: number;
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION_NAME = 'categorias';

export const getAllCategorias = async (): Promise<Categoria[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('nombre'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Categoria[];
  } catch (error: any) {
    console.error('Error getting categorias:', error);
    throw new Error(error.message || 'Error al obtener categorías');
  }
};

export const getCategoriaById = async (id: string): Promise<Categoria> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Categoría no encontrada');
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Categoria;
  } catch (error: any) {
    console.error('Error getting categoria:', error);
    throw new Error(error.message || 'Error al obtener categoría');
  }
};

export const createCategoria = async (categoria: Categoria): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...categoria,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error: any) {
    console.error('Error creating categoria:', error);
    throw new Error(error.message || 'Error al crear categoría');
  }
};

export const updateCategoria = async (id: string, categoria: Partial<Categoria>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...categoria,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error updating categoria:', error);
    throw new Error(error.message || 'Error al actualizar categoría');
  }
};

export const deleteCategoria = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error: any) {
    console.error('Error deleting categoria:', error);
    throw new Error(error.message || 'Error al eliminar categoría');
  }
};
