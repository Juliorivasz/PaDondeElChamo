import { Navigate } from 'react-router-dom';
import { useUsuarioStore } from '../store/usuarioStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Componente que protege rutas requiriendo autenticación.
 * Si el usuario no está autenticado, redirige a la página de inicio de sesión.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const usuario = useUsuarioStore((state) => state.usuario);

  if (!usuario) {
    return <Navigate to="/seleccionar-usuario" replace />;
  }

  return <>{children}</>;
};
