export interface Usuario {
  idUsuario: string; // Changed from number to string for Firebase UID
  nombre: string;
  email: string;
  rol: string;
  isActive: boolean;
}