import { useNavigate } from 'react-router-dom';
import { useUsuarioStore } from '../store/usuarioStore';
import { ShieldAlert, Home } from 'lucide-react';

/**
 * Página que se muestra cuando un usuario intenta acceder a una ruta
 * para la cual no tiene los permisos necesarios.
 */
export const PaginaAccesoDenegado = () => {
  const navigate = useNavigate();
  const usuario = useUsuarioStore((state) => state.usuario);

  const handleVolverInicio = () => {
    navigate('/ventas');
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 p-6 rounded-full">
            <ShieldAlert className="w-16 h-16 text-red-600" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Acceso Denegado
        </h1>
        
        <p className="text-gray-600 mb-2">
          No tienes permisos para acceder a esta página.
        </p>
        
        {usuario && (
          <p className="text-sm text-gray-500 mb-6">
            Tu rol actual es: <span className="font-semibold">{usuario.rol}</span>
          </p>
        )}
        
        <button
          onClick={handleVolverInicio}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <Home className="w-5 h-5 mr-2" />
          Volver al Inicio
        </button>
      </div>
    </div>
  );
};

export default PaginaAccesoDenegado;
