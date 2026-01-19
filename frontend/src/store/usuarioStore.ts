import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Usuario } from '../types/dto/Usuario';

interface UsuarioState {
  usuario: Usuario | null;
  setUsuario: (usuario: Usuario) => void;
  clearUsuario: () => void;
}

export const useUsuarioStore = create(
  persist<UsuarioState>(
    (set) => ({
      usuario: null,
      setUsuario: (usuario) => set({ usuario }),
      clearUsuario: () => set({ usuario: null }),
    }),
    {
      name: 'usuario-storage', // Nombre para guardar en el localStorage
    }
  )
);