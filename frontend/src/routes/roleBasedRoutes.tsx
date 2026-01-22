import type { RouteObject } from "react-router-dom";
import PaginaUsuarios from "../pages/PaginaUsuarios";
import PaginaCategorias from "../pages/PaginaCategorias";
import PaginaGastos from "../pages/PaginaGastos";
import PaginaProveedores from "../pages/PaginaProveedores";
import PaginaCompras from "../pages/PaginaCompras";
import PaginaEstadisticas from "../pages/PaginaEstadisticas";
import { RoleBasedRoute } from "../components/RoleBasedRoute";
import PaginaConfiguracion from "../pages/PaginaConfiguracion";
import PaginaCaja from "../pages/PaginaCaja";

/**
 * Rutas con restricción por rol
 * 
 * Estas rutas requieren roles específicos para acceder.
 * Cada ruta está envuelta en un RoleBasedRoute que verifica los permisos.
 * 
 * Actualmente, todas estas rutas requieren ADMIN o .
 * EMPLEADO no tiene acceso a ninguna de estas páginas.
 * 
 * Para agregar una nueva ruta con restricción por rol:
 * 1. Importar el componente de la página
 * 2. Agregar un objeto con:
 *    - path: la ruta
 *    - element: el componente envuelto en RoleBasedRoute
 *    - allowedRoles: array de roles permitidos
 */
export const roleBasedRoutes: RouteObject[] = [
  {
    path: "categorias",
    element: (
      <RoleBasedRoute allowedRoles={['ADMIN']}>
        <PaginaCategorias />
      </RoleBasedRoute>
    ),
  },
  {
    path: "compras",
    element: (
      <RoleBasedRoute allowedRoles={['ADMIN']}>
        <PaginaCompras />
      </RoleBasedRoute>
    ),
  },
  {
    path: "proveedores",
    element: (
      <RoleBasedRoute allowedRoles={['ADMIN']}>
        <PaginaProveedores />
      </RoleBasedRoute>
    ),
  },
  {
    path: "gastos",
    element: (
      <RoleBasedRoute allowedRoles={['ADMIN']}>
        <PaginaGastos />
      </RoleBasedRoute>
    ),
  },
  {
    path: "estadisticas",
    element: (
      <RoleBasedRoute allowedRoles={['ADMIN']}>
        <PaginaEstadisticas />
      </RoleBasedRoute>
    ),
  },
  {
    path: "usuarios",
    element: (
      <RoleBasedRoute allowedRoles={['ADMIN']}>
        <PaginaUsuarios />
      </RoleBasedRoute>
    ),
  },
  {
    path: "configuracion",
    element: (
      <RoleBasedRoute allowedRoles={['ADMIN']}>
        <PaginaConfiguracion />
      </RoleBasedRoute>
    ),
  },
  {
    path: "caja",
    element: (
      <RoleBasedRoute allowedRoles={['ADMIN']}>
        <PaginaCaja />
      </RoleBasedRoute>
    ),
  },
];
