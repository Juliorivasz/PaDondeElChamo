import type { RouteObject } from "react-router-dom";
import PaginaInicioSesion from "../pages/PaginaInicioSesion";

export const publicRoutes: RouteObject[] = [
  {
    path: "/seleccionar-usuario",
    element: <PaginaInicioSesion />,
  },  
];
