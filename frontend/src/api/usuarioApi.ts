import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import type { Usuario } from "../types/dto/Usuario";

export interface CrearUsuarioDTO {
  nombre: string;
  email: string;
  password: string;
  rol: string;
}

export interface ActualizarUsuarioDTO {
  nombre?: string;
  email?: string;
  rol?: string;
  password?: string;
  isActive?: boolean;
}

// Obtener la lista de usuarios paginada
export const obtenerUsuarios = async (_params?: any): Promise<any> => {
  try {
    const q = query(collection(db, 'usuarios'), orderBy('nombre'));
    const querySnapshot = await getDocs(q);
    
    const usuarios = querySnapshot.docs.map(doc => {
      const data: any = doc.data();
      return {
        idUsuario: doc.id,
        ...data,
      } as Usuario;
    });

    return {
      usuarios,
      total: usuarios.length,
    };
  } catch (error) {
    console.error("Error al obtener la lista de usuarios:", error);
    throw new Error("No se pudo cargar la lista de usuarios");
  }
};

// Obtener usuarios activos para login
export const obtenerUsuariosActivos = async (): Promise<Usuario[]> => {
  try {
    const q = query(
      collection(db, 'usuarios'),
      where('isActive', '==', true)
      // Removed orderBy to avoid composite index requirement
      // Users will be sorted in the frontend if needed
    );
    const querySnapshot = await getDocs(q);
    
    const usuarios = querySnapshot.docs.map(doc => {
      const data: any = doc.data();
      return {
        idUsuario: doc.id,
        ...data,
      } as Usuario;
    });
    
    // Sort by name in JavaScript instead of Firestore
    return usuarios.sort((a, b) => a.nombre.localeCompare(b.nombre));
  } catch (error) {
    console.error("Error al obtener usuarios activos:", error);
    throw new Error("No se pudieron cargar los usuarios activos");
  }
};

// Obtener un usuario por ID
export const obtenerUsuarioPorId = async (id: string): Promise<Usuario> => {
  try {
    const docRef = doc(db, 'usuarios', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Usuario no encontrado');
    }
    
    return {
      idUsuario: docSnap.id,
      ...docSnap.data(),
    } as Usuario;
  } catch (error) {
    console.error("Error al obtener el usuario:", error);
    throw new Error("No se pudo cargar el usuario");
  }
};

// Crear un nuevo usuario
export const crearUsuario = async (datos: CrearUsuarioDTO): Promise<Usuario> => {
  try {
    // Use Cloud Function to create user (avoids logging out the admin)
    const { httpsCallable } = await import('firebase/functions');
    const { functions } = await import('../config/firebase');
    
    const crearNuevoUsuario = httpsCallable(functions, 'crearNuevoUsuario');
    
    const result = await crearNuevoUsuario({
      nombre: datos.nombre,
      email: datos.email,
      password: datos.password,
      rol: datos.rol,
    });

    const data = result.data as any;

    return {
      idUsuario: data.userId,
      nombre: datos.nombre,
      email: datos.email,
      rol: datos.rol,
      isActive: true,
    } as Usuario;
  } catch (error: any) {
    console.error("Error al crear el usuario:", error);
    
    // Map Firebase Functions errors
    if (error.code === 'functions/already-exists') {
      const err: any = new Error('El email ya está en uso');
      err.response = { status: 400, data: { message: 'El email ya está en uso' } };
      throw err;
    } else if (error.code === 'functions/permission-denied') {
      const err: any = new Error('No tienes permisos para crear usuarios');
      err.response = { status: 403, data: { message: 'No tienes permisos' } };
      throw err;
    }
    
    throw error;
  }
};

// Actualizar un usuario existente
export const actualizarUsuario = async (id: string, datos: ActualizarUsuarioDTO): Promise<Usuario> => {
  try {
    const docRef = doc(db, 'usuarios', id);
    
    const updateData: any = {
      ...datos,
      updatedAt: serverTimestamp(),
    };
    
    // Remove password from Firestore update (handled separately)
    delete updateData.password;
    
    await updateDoc(docRef, updateData);
    
    // Get updated document
    const docSnap = await getDoc(docRef);
    return {
      idUsuario: docSnap.id,
      ...docSnap.data(),
    } as Usuario;
  } catch (error) {
    console.error("Error al actualizar el usuario:", error);
    throw error;
  }
};

// Re-autenticar usuario (para operaciones sensibles)
export const reautenticarUsuario = async (password: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user || (!user.email && !user.phoneNumber)) {
      throw new Error('No hay usuario autenticado');
    }

    // Nota: Esto asume provider de Email/Password. 
    // Si usas Google Auth, el flujo es diferente (reauthenticateWithPopup)
    if (user.providerData.some(p => p.providerId === 'password')) {
      const credential = EmailAuthProvider.credential(user.email || "", password);
      await reauthenticateWithCredential(user, credential);
    } else {
       // Si no es password provider, quizás no necesite esto o sea otro método
       // Por ahora lo dejamos pasar o lanzamos error si es estricto
       console.warn("Usuario no usa autenticación por contraseña");
    }
  } catch (error) {
    console.error("Error al re-autenticar:", error);
    throw new Error("Contraseña actual incorrecta o sesión inválida");
  }
};

// Cambiar contraseña (cualquier usuario autenticado)
export const cambiarPassword = async (password: string): Promise<Usuario> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    await updatePassword(user, password);
    
    // Get user data from Firestore
    const docRef = doc(db, 'usuarios', user.uid);
    const docSnap = await getDoc(docRef);
    
    return {
      idUsuario: docSnap.id,
      ...docSnap.data(),
    } as Usuario;
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    throw error;
  }
};

// Eliminar un usuario
export const eliminarUsuario = async (id: string): Promise<void> => {
  try {
    // Note: This only deletes from Firestore
    // To delete from Firebase Auth, you need Admin SDK (Cloud Functions)
    await deleteDoc(doc(db, 'usuarios', id));
  } catch (error) {
    console.error("Error al eliminar el usuario:", error);
    throw error;
  }
};
