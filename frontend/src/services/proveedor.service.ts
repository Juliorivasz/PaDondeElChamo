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

export interface Proveedor {
  id?: string;
  nombre: string;
  telefono?: string;
  direccion?: string;
  email?: string;
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION_NAME = 'proveedores';

export const getAllProveedores = async (): Promise<Proveedor[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('nombre'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Proveedor[];
  } catch (error: any) {
    console.error('Error getting proveedores:', error);
    throw new Error(error.message || 'Error al obtener proveedores');
  }
};

export const getProveedorById = async (id: string): Promise<Proveedor> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Proveedor no encontrado');
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Proveedor;
  } catch (error: any) {
    console.error('Error getting proveedor:', error);
    throw new Error(error.message || 'Error al obtener proveedor');
  }
};

export const createProveedor = async (proveedor: Proveedor): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...proveedor,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error: any) {
    console.error('Error creating proveedor:', error);
    throw new Error(error.message || 'Error al crear proveedor');
  }
};

export const updateProveedor = async (id: string, proveedor: Partial<Proveedor>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...proveedor,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error updating proveedor:', error);
    throw new Error(error.message || 'Error al actualizar proveedor');
  }
};

export const deleteProveedor = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error: any) {
    console.error('Error deleting proveedor:', error);
    throw new Error(error.message || 'Error al eliminar proveedor');
  }
};
