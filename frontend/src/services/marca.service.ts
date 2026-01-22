import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Marca {
  id?: string;
  nombre: string;
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION_NAME = 'marcas';

export const getAllMarcas = async (): Promise<Marca[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('nombre'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Marca[];
  } catch (error: any) {
    console.error('Error getting marcas:', error);
    throw new Error(error.message || 'Error al obtener marcas');
  }
};

export const getMarcaById = async (id: string): Promise<Marca> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Marca no encontrada');
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Marca;
  } catch (error: any) {
    console.error('Error getting marca:', error);
    throw new Error(error.message || 'Error al obtener marca');
  }
};

export const createMarca = async (marca: Marca): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...marca,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error: any) {
    console.error('Error creating marca:', error);
    throw new Error(error.message || 'Error al crear marca');
  }
};

export const updateMarca = async (id: string, marca: Partial<Marca>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...marca,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error updating marca:', error);
    throw new Error(error.message || 'Error al actualizar marca');
  }
};

export const deleteMarca = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error: any) {
    console.error('Error deleting marca:', error);
    throw new Error(error.message || 'Error al eliminar marca');
  }
};
