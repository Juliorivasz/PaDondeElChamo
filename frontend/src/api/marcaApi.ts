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

export interface Marca {
  idMarca: string;
  nombre: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface CrearMarcaDTO {
  nombre: string;
}

// Obtener todas las marcas
export const obtenerListaMarcas = async (): Promise<Marca[]> => {
  try {
    const q = query(collection(db, 'marcas'), orderBy('nombre'));
    const querySnapshot = await getDocs(q);
    
    const marcas = querySnapshot.docs.map(doc => {
      const data: any = doc.data();
      return {
        idMarca: doc.id,
        ...data,
      } as Marca;
    });
    
    return marcas;
  } catch (error) {
    console.error("Error al obtener marcas:", error);
    throw new Error("No se pudieron cargar las marcas");
  }
};

// Crear una nueva marca
export const crearMarca = async (datos: CrearMarcaDTO): Promise<Marca> => {
  try {
    // Verificar si el nombre ya existe
    const q = query(
      collection(db, 'marcas'),
      where('nombre', '==', datos.nombre)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const err: any = new Error(`La marca ${datos.nombre} ya existe`);
      err.response = { status: 400, data: { message: err.message } };
      throw err;
    }
    
    // Crear nuevo documento
    const docRef = doc(collection(db, 'marcas'));
    const marcaData = {
      nombre: datos.nombre,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(docRef, marcaData);
    
    return {
      idMarca: docRef.id,
      ...marcaData,
    } as Marca;
  } catch (error: any) {
    console.error("Error al crear la marca:", error);
    throw error;
  }
};

// Actualizar una marca
export const modificarMarca = async (
  id: string,
  datos: Partial<CrearMarcaDTO>
): Promise<Marca> => {
  try {
    // Si se está actualizando el nombre, verificar que no exista
    if (datos.nombre) {
      const q = query(
        collection(db, 'marcas'),
        where('nombre', '==', datos.nombre)
      );
      const querySnapshot = await getDocs(q);
      
      // Verificar que no sea la misma marca
      const exists = querySnapshot.docs.find(doc => doc.id !== id);
      if (exists) {
        const err: any = new Error(`La marca ${datos.nombre} ya existe`);
        err.response = { status: 400, data: { message: err.message } };
        throw err;
      }
    }
    
    const docRef = doc(db, 'marcas', id);
    
    const updateData: any = {
      ...datos,
      updatedAt: serverTimestamp(),
    };
    
    await updateDoc(docRef, updateData);
    
    // Obtener documento actualizado
    const docSnap = await getDoc(docRef);
    return {
      idMarca: docSnap.id,
      ...docSnap.data(),
    } as Marca;
  } catch (error) {
    console.error("Error al actualizar la marca:", error);
    throw error;
  }
};

// Eliminar una marca
export const eliminarMarca = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'marcas', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error al eliminar la marca:", error);
    throw error;
  }
};
