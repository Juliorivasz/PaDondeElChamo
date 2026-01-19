import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { PaginaProductos } from "../pages/PaginaProductos";
import PaginaVentas from "../pages/PaginaVentas";
import PaginaHistorial from "../pages/PaginaHistorial";
import PaginaAccesoDenegado from "../pages/PaginaAccesoDenegado";

/**
 * Rutas protegidas - Requieren autenticación pero no roles específicos
 * 
 * Estas rutas son accesibles para cualquier usuario autenticado,
 * independientemente de su rol (EMPLEADO, ADMIN, ).
 * 
 * EMPLEADO tiene acceso a:
 * - Ventas: puede realizar ventas
 * - Historial: solo ve sus propias ventas
 * - Productos: puede consultar y activar/desactivar, no crear/editar/eliminar
 * 
 * Para agregar una nueva ruta protegida accesible para todos los roles:
 * 1. Importar el componente de la página
 * 2. Agregar un objeto con path y element al array
 */
// Componente interno para manejar la redirección basada en el rol
const HomeRedirect = () => {
  // Obtenemos el usuario del almacenamiento local para decidir la redirección
  // Se lee directamente del localStorage para evitar flash de contenido o problemas con el estado inicial
  const storedAuth = localStorage.getItem('autenticacion-storage');
  let role = '';
  
  if (storedAuth) {
    try {
      const parsed = JSON.parse(storedAuth);
      role = parsed.state?.rol || '';
    } catch (e) {
      console.error("Error parsing auth storage", e);
    }
  }

  if (role === 'ADMIN') {
    return <Navigate to="/caja" replace />;
  }
  
  // Por defecto (EMPLEADO u otros) van a ventas
  return <Navigate to="/ventas" replace />;
};

export const protectedRoutes: RouteObject[] = [
  {
    index: true,
    element: <HomeRedirect />,
  },
  {
    path: "ventas",
    element: <PaginaVentas />,
  },
  {
    path: "historial",
    element: <PaginaHistorial />,
  },
  {
    path: "productos",
    element: <PaginaProductos />,
  },
  {
    path: "acceso-denegado",
    element: <PaginaAccesoDenegado />,
  },
];
