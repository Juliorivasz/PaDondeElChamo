import { Navigate } from 'react-router-dom';
import { useUsuarioStore } from '../store/usuarioStore';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ children, allowedRoles }) => {
  const usuario = useUsuarioStore((state) => state.usuario);

  if (!usuario) {
    return <Navigate to="/seleccionar-usuario" replace />;
  }

  if (!allowedRoles.includes(usuario.rol)) {
    return <Navigate to="/acceso-denegado" replace />;
  }

  return <>{children}</>;
};
