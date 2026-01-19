import type { RouteObject } from "react-router-dom";
import App from "../App";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { publicRoutes } from "./publicRoutes";
import { protectedRoutes } from "./protectedRoutes";
import { roleBasedRoutes } from "./roleBasedRoutes";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
    children: [
      ...protectedRoutes,
      ...roleBasedRoutes,
    ],
  },
  ...publicRoutes,
];
