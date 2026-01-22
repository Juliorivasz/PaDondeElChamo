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
  limit,
  startAfter,
  DocumentSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';

export interface Producto {
  id?: string;
  nombre: string;
  precio: number;
  costo: number;
  stock: number;
  estado: boolean;
  codigoDeBarras?: string;
  imagenUrl?: string;
  marcaId?: string;
  categoriaId?: string;
  proveedorId?: string;
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION_NAME = 'productos';

/**
 * Get all products
 */
export const getAllProductos = async (): Promise<Producto[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Producto[];
  } catch (error: any) {
    console.error('Error getting products:', error);
    throw new Error(error.message || 'Error al obtener productos');
  }
};

/**
 * Get product by ID
 */
export const getProductoById = async (id: string): Promise<Producto> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Producto no encontrado');
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Producto;
  } catch (error: any) {
    console.error('Error getting product:', error);
    throw new Error(error.message || 'Error al obtener producto');
  }
};

/**
 * Create new product
 */
export const createProducto = async (producto: Producto): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...producto,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error: any) {
    console.error('Error creating product:', error);
    throw new Error(error.message || 'Error al crear producto');
  }
};

/**
 * Update product
 */
export const updateProducto = async (id: string, producto: Partial<Producto>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...producto,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    throw new Error(error.message || 'Error al actualizar producto');
  }
};

/**
 * Delete product
 */
export const deleteProducto = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error: any) {
    console.error('Error deleting product:', error);
    throw new Error(error.message || 'Error al eliminar producto');
  }
};

/**
 * Get active products (estado = true)
 */
export const getActiveProductos = async (): Promise<Producto[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('estado', '==', true),
      orderBy('nombre')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Producto[];
  } catch (error: any) {
    console.error('Error getting active products:', error);
    throw new Error(error.message || 'Error al obtener productos activos');
  }
};

/**
 * Search products by name
 */
export const searchProductosByName = async (searchTerm: string): Promise<Producto[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('nombre', '>=', searchTerm),
      where('nombre', '<=', searchTerm + '\uf8ff'),
      orderBy('nombre')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Producto[];
  } catch (error: any) {
    console.error('Error searching products:', error);
    throw new Error(error.message || 'Error al buscar productos');
  }
};

/**
 * Upload product image to Firebase Storage
 */
export const uploadProductImage = async (file: File, productId: string): Promise<string> => {
  try {
    const storageRef = ref(storage, `productos/${productId}/${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error: any) {
    console.error('Error uploading image:', error);
    throw new Error(error.message || 'Error al subir imagen');
  }
};

/**
 * Delete product image from Firebase Storage
 */
export const deleteProductImage = async (imageUrl: string): Promise<void> => {
  try {
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
  } catch (error: any) {
    console.error('Error deleting image:', error);
    throw new Error(error.message || 'Error al eliminar imagen');
  }
};

/**
 * Update product stock
 */
export const updateProductStock = async (id: string, newStock: number): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      stock: newStock,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error updating stock:', error);
    throw new Error(error.message || 'Error al actualizar stock');
  }
};
