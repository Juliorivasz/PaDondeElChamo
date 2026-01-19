import apiClient from "./interceptors/apiClient";

// Obtener todos los roles disponibles
export const obtenerRoles = async (): Promise<string[]> => {
  try {
    const response = await apiClient.get<string[]>('/roles');
    return response.data;
  } catch (error) {
    console.error("Error al obtener roles:", error);
    throw new Error("No se pudieron cargar los roles");
  }
};
