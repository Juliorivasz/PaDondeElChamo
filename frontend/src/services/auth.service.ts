import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  User,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { RolUsuario } from '../types/usuario.types';

export interface RegisterData {
  email: string;
  password: string;
  nombre: string;
  rol?: RolUsuario;
}

export interface LoginData {
  email: string;
  password: string;
}

/**
 * Register a new user with email and password
 */
export const registerUser = async (data: RegisterData): Promise<UserCredential> => {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    // Create user document in Firestore
    await setDoc(doc(db, 'usuarios', userCredential.user.uid), {
      nombre: data.nombre,
      email: data.email,
      rol: data.rol || RolUsuario.EMPLEADO,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return userCredential;
  } catch (error: any) {
    console.error('Error registering user:', error);
    throw new Error(error.message || 'Error al registrar usuario');
  }
};

/**
 * Login user with email and password
 */
export const loginUser = async (data: LoginData): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );
    return userCredential;
  } catch (error: any) {
    console.error('Error logging in:', error);
    throw new Error(error.message || 'Error al iniciar sesión');
  }
};

/**
 * Logout current user
 */
export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Error logging out:', error);
    throw new Error(error.message || 'Error al cerrar sesión');
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    throw new Error(error.message || 'Error al enviar email de recuperación');
  }
};

/**
 * Update user password
 */
export const changePassword = async (newPassword: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }
    await updatePassword(user, newPassword);
  } catch (error: any) {
    console.error('Error updating password:', error);
    throw new Error(error.message || 'Error al cambiar contraseña');
  }
};

/**
 * Get current user data from Firestore
 */
export const getCurrentUserData = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
    if (!userDoc.exists()) {
      throw new Error('Usuario no encontrado en Firestore');
    }

    return {
      uid: user.uid,
      ...userDoc.data(),
    };
  } catch (error: any) {
    console.error('Error getting user data:', error);
    throw new Error(error.message || 'Error al obtener datos del usuario');
  }
};

/**
 * Get user role from custom claims
 */
export const getUserRole = async (): Promise<RolUsuario> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    const idTokenResult = await user.getIdTokenResult();
    return (idTokenResult.claims.rol as RolUsuario) || RolUsuario.EMPLEADO;
  } catch (error: any) {
    console.error('Error getting user role:', error);
    throw new Error(error.message || 'Error al obtener rol del usuario');
  }
};
