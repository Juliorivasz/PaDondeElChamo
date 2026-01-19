import apiClient from "./interceptors/apiClient";
import type { Usuario } from "../types/dto/Usuario";

export interface CrearUsuarioDTO {
  nombre: string;
  email: string;
  password: string;
  rol: string;
}

export interface ActualizarUsuarioDTO {
  nombre?: string;
  email?: string;
  rol?: string;
  password?: string;
  isActive?: boolean;
}

// Obtener la lista de usuarios paginada
export const obtenerUsuarios = async (params?: any): Promise<any> => {
  try {
    const response = await apiClient.get('/usuario/lista', { params }); 
    return response.data;
  } catch (error) {
    console.error("Error al obtener la lista de usuarios:", error);
    throw new Error("No se pudo cargar la lista de usuarios");
  }
};

// Obtener usuarios activos para login
export const obtenerUsuariosActivos = async (): Promise<Usuario[]> => {
  try {
    const response = await apiClient.get<Usuario[]>('/usuario/activos');
    return response.data;
  } catch (error) {
    console.error("Error al obtener usuarios activos:", error);
    throw new Error("No se pudieron cargar los usuarios activos");
  }
};

// Obtener un usuario por ID
export const obtenerUsuarioPorId = async (id: number): Promise<Usuario> => {
  try {
    const response = await apiClient.get<Usuario>(`/usuario/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener el usuario:", error);
    throw new Error("No se pudo cargar el usuario");
  }
};

// Crear un nuevo usuario
export const crearUsuario = async (datos: CrearUsuarioDTO): Promise<Usuario> => {
  try {
    const response = await apiClient.post<Usuario>("/usuario/nuevo", datos);
    return response.data;
  } catch (error) {
    console.error("Error al crear el usuario:", error);
    throw error;
  }
};

// Actualizar un usuario existente
export const actualizarUsuario = async (id: number, datos: ActualizarUsuarioDTO): Promise<Usuario> => {
  try {
    const response = await apiClient.put<Usuario>(`/usuario/${id}`, datos);
    return response.data;
  } catch (error) {
    console.error("Error al actualizar el usuario:", error);
    throw error;
  }
};

// Cambiar contraseña (cualquier usuario autenticado)
export const cambiarPassword = async (password: string): Promise<Usuario> => {
  try {
    const response = await apiClient.patch<Usuario>('/usuario/cambiarPassword', { password });
    return response.data;
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    throw error;
  }
};

// Eliminar un usuario
export const eliminarUsuario = async (id: number): Promise<void> => {
  try {
    await apiClient.delete(`/usuario/${id}`);
  } catch (error) {
    console.error("Error al eliminar el usuario:", error);
    throw error;
  }
};