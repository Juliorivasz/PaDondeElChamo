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

export interface Proveedor {
  idProveedor: string;
  nombre: string;
  telefono?: string;
  email?: string;
  estado: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface CrearProveedorDTO {
  nombre: string;
  telefono?: string;
  email?: string;
}

// Obtener todos los proveedores
export const obtenerProveedores = async (): Promise<Proveedor[]> => {
  try {
    const q = query(collection(db, 'proveedores'), orderBy('nombre'));
    const querySnapshot = await getDocs(q);
    
    const proveedores = querySnapshot.docs.map(doc => {
      const data: any = doc.data();
      return {
        idProveedor: doc.id,
        ...data,
      } as Proveedor;
    });
    
    return proveedores;
  } catch (error) {
    console.error("Error al obtener proveedores:", error);
    throw new Error("No se pudieron cargar los proveedores");
  }
};

// Obtener proveedores activos
export const obtenerProveedoresActivos = async (): Promise<Proveedor[]> => {
  try {
    const q = query(
      collection(db, 'proveedores'),
      where('estado', '==', true),
      orderBy('nombre')
    );
    const querySnapshot = await getDocs(q);
    
    const proveedores = querySnapshot.docs.map(doc => {
      const data: any = doc.data();
      return {
        idProveedor: doc.id,
        ...data,
      } as Proveedor;
    });
    
    return proveedores;
  } catch (error) {
    console.error("Error al obtener proveedores activos:", error);
    throw new Error("No se pudieron cargar los proveedores activos");
  }
};

// Obtener un proveedor por ID
export const obtenerProveedorPorId = async (id: string): Promise<Proveedor> => {
  try {
    const docRef = doc(db, 'proveedores', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error("Proveedor no encontrado");
    }
    
    return {
      idProveedor: docSnap.id,
      ...docSnap.data(),
    } as Proveedor;
  } catch (error) {
    console.error("Error al obtener el proveedor:", error);
    throw error;
  }
};

// Crear un nuevo proveedor
export const crearProveedor = async (datos: CrearProveedorDTO): Promise<Proveedor> => {
  try {
    // Verificar si el nombre ya existe
    const q = query(
      collection(db, 'proveedores'),
      where('nombre', '==', datos.nombre)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const err: any = new Error(`El proveedor ${datos.nombre} ya existe`);
      err.response = { status: 400, data: { message: err.message } };
      throw err;
    }
    
    // Crear nuevo documento
    const docRef = doc(collection(db, 'proveedores'));
    const proveedorData = {
      nombre: datos.nombre,
      telefono: datos.telefono || '',
      email: datos.email || '',
      estado: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(docRef, proveedorData);
    
    return {
      idProveedor: docRef.id,
      ...proveedorData,
    } as Proveedor;
  } catch (error: any) {
    console.error("Error al crear el proveedor:", error);
    throw error;
  }
};

// Actualizar un proveedor
export const modificarProveedor = async (
  id: string,
  datos: Partial<CrearProveedorDTO>
): Promise<Proveedor> => {
  try {
    // Si se está actualizando el nombre, verificar que no exista
    if (datos.nombre) {
      const q = query(
        collection(db, 'proveedores'),
        where('nombre', '==', datos.nombre)
      );
      const querySnapshot = await getDocs(q);
      
      // Verificar que no sea el mismo proveedor
      const exists = querySnapshot.docs.find(doc => doc.id !== id);
      if (exists) {
        const err: any = new Error(`El proveedor ${datos.nombre} ya existe`);
        err.response = { status: 400, data: { message: err.message } };
        throw err;
      }
    }
    
    const docRef = doc(db, 'proveedores', id);
    
    const updateData: any = {
      ...datos,
      updatedAt: serverTimestamp(),
    };
    
    await updateDoc(docRef, updateData);
    
    // Obtener documento actualizado
    const docSnap = await getDoc(docRef);
    return {
      idProveedor: docSnap.id,
      ...docSnap.data(),
    } as Proveedor;
  } catch (error) {
    console.error("Error al actualizar el proveedor:", error);
    throw error;
  }
};

// Cambiar estado de un proveedor
export const cambiarEstadoProveedor = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'proveedores', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error("Proveedor no encontrado");
    }
    
    const currentEstado = docSnap.data().estado;
    
    await updateDoc(docRef, {
      estado: !currentEstado,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error al cambiar estado del proveedor:", error);
    throw error;
  }
};

// Eliminar un proveedor
export const eliminarProveedor = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'proveedores', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error al eliminar el proveedor:", error);
    throw error;
  }
};