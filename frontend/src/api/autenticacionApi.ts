import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { AccesoDTO, AccesoRespuestaDTO, RenovarTokenDTO } from '../types/dto/Autenticacion';

export const iniciarSesion = async (accesoDTO: AccesoDTO): Promise<AccesoRespuestaDTO> => {
  try {
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(
      auth,
      accesoDTO.email,
      accesoDTO.password
    );

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'usuarios', userCredential.user.uid));
    
    if (!userDoc.exists()) {
      throw new Error('Usuario no encontrado en Firestore');
    }

    const userData = userDoc.data();

    // Check if user is active
    if (!userData.isActive) {
      await signOut(auth);
      throw new Error('Usuario inactivo');
    }

    // Get Firebase token
    const token = await userCredential.user.getIdToken();

    // Get custom claims for role
    const idTokenResult = await userCredential.user.getIdTokenResult();
    const rol = (idTokenResult.claims.rol as string) || userData.rol || 'EMPLEADO';

    return {
      token,
      nombre: userData.nombre,
      rol,
      weakPassword: false, // Firebase doesn't have this concept, set to false
    };
  } catch (error: any) {
    console.error('Error al iniciar sesión:', error);
    
    // Map Firebase errors to user-friendly messages
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
      const err: any = new Error('Credenciales incorrectas');
      err.response = { status: 401, data: { message: 'Credenciales incorrectas' } };
      throw err;
    } else if (error.code === 'auth/user-not-found') {
      const err: any = new Error('Usuario no encontrado');
      err.response = { status: 404, data: { message: 'Usuario no encontrado' } };
      throw err;
    } else if (error.code === 'auth/too-many-requests') {
      const err: any = new Error('Demasiados intentos fallidos');
      err.response = { status: 429, data: { message: 'Demasiados intentos. Intenta más tarde.' } };
      throw err;
    } else if (error.message === 'Usuario inactivo') {
      const err: any = new Error('Usuario inactivo');
      err.response = { status: 403, data: { message: 'Tu cuenta está inactiva' } };
      throw err;
    }
    
    throw error;
  }
};

export const renovarToken = async (token: string): Promise<RenovarTokenDTO> => {
  try {
    // Firebase tokens auto-refresh, just get current token
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    const newToken = await user.getIdToken(true); // Force refresh
    return { token: newToken };
  } catch (error) {
    console.error('Error al renovar token:', error);
    throw error;
  }
};

export const solicitarRecuperacion = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Error al solicitar recuperación:', error);
    // Don't throw error to prevent email enumeration
    // Firebase will silently fail if email doesn't exist
  }
};

export const cerrarSesion = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    throw error;
  }
};

export const restablecerPassword = async (token: string, nuevaPassword: string): Promise<void> => {
  // This is handled by Firebase's password reset flow
  // The token is sent via email and user resets password through Firebase UI
  throw new Error('Use Firebase password reset email link');
};

