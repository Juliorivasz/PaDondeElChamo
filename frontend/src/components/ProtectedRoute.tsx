import { Navigate } from 'react-router-dom';
import { useUsuarioStore } from '../store/usuarioStore';
import { useAutenticacionStore } from '../store/autenticacionStore';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Componente que protege rutas requiriendo autenticación.
 * Si el usuario no está autenticado, redirige a la página de inicio de sesión.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const usuario = useUsuarioStore((state) => state.usuario);
  const setUsuario = useUsuarioStore((state) => state.setUsuario);
  const clearUsuario = useUsuarioStore((state) => state.clearUsuario);
  const establecerAutenticacion = useAutenticacionStore((state) => state.establecerAutenticacion);
  const cerrarSesion = useAutenticacionStore((state) => state.cerrarSesion);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Set user in store
            setUsuario({
              idUsuario: firebaseUser.uid,
              ...userData,
            } as any);

            // Get token and set authentication
            const token = await firebaseUser.getIdToken();
            const idTokenResult = await firebaseUser.getIdTokenResult();
            const rol = (idTokenResult.claims.rol as string) || userData.rol || 'EMPLEADO';
            
            establecerAutenticacion(token, userData.nombre, rol, false);
          } else {
            // User exists in Auth but not in Firestore
            clearUsuario();
            cerrarSesion();
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          clearUsuario();
          cerrarSesion();
        }
      } else {
        // No user logged in
        clearUsuario();
        cerrarSesion();
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUsuario, clearUsuario, establecerAutenticacion, cerrarSesion]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/seleccionar-usuario" replace />;
  }

  return <>{children}</>;
};

