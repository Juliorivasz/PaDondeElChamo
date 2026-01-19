import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface EstadoAutenticacion {
  token: string | null;
  nombre: string | null;
  rol: string | null;
  estaAutenticado: boolean;
  weakPassword?: boolean;
  establecerAutenticacion: (token: string, nombre: string, rol: string, weakPassword?: boolean) => void;
  cerrarSesion: () => void;
  limpiarAdvertenciaPassword: () => void;
}

export const useAutenticacionStore = create(
  persist<EstadoAutenticacion>(
    (set) => ({
      token: null,
      nombre: null,
      rol: null,
      estaAutenticado: false,
      weakPassword: false,
      establecerAutenticacion: (token, nombre, rol, weakPassword = false) =>
        set({
          token,
          nombre,
          rol,
          estaAutenticado: true,
          weakPassword,
        }),
      cerrarSesion: () =>
        set({
          token: null,
          nombre: null,
          rol: null,
          estaAutenticado: false,
          weakPassword: false,
        }),
      limpiarAdvertenciaPassword: () => set({ weakPassword: false }),
    }),
    {
      name: 'autenticacion-storage',
    }
  )
);
