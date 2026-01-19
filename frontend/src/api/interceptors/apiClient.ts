import axios from 'axios';
import { useUsuarioStore } from '../../store/usuarioStore';
import { useAutenticacionStore } from '../../store/autenticacionStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// --- INTERCEPTOR DE PETICIONES ---
apiClient.interceptors.request.use(
  (config) => {
    const usuario = useUsuarioStore.getState().usuario;
    const { token } = useAutenticacionStore.getState();
    
    if (usuario && usuario.idUsuario) {
      config.headers['X-Usuario-ID'] = usuario.idUsuario;
    }

    // Agregar token JWT si existe
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- INTERCEPTOR DE RESPUESTAS ---
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si recibimos un 401 y no es un reintento
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { token, establecerAutenticacion, cerrarSesion } = useAutenticacionStore.getState();
        const usuario = useUsuarioStore.getState().usuario;

        if (token) {
          // Usamos fetch para evitar que el interceptor capture esta petición también
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/renovarToken`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            const nuevoToken = data.token;

            // Actualizar store
            if (usuario) {
                establecerAutenticacion(nuevoToken, usuario.nombre, (usuario as any).rol || 'EMPLEADO');
            }
            
            // Actualizar header de la petición original
            originalRequest.headers['Authorization'] = `Bearer ${nuevoToken}`;
            
            // Reintentar petición original con el nuevo token
            return apiClient(originalRequest);
          } else {
            // Si falla la renovación, cerrar sesión y forzar recarga
            console.error('Token expirado - cerrando sesión');
            cerrarSesion();
            useUsuarioStore.getState().clearUsuario();
            localStorage.clear(); // Limpiar todo el localStorage
            sessionStorage.clear(); // Limpiar sessionStorage también
            
            // Forzar recarga completa de la página para limpiar todo el estado
            window.location.replace('/seleccionar-usuario');
            
            // Retornar una promesa rechazada para detener la ejecución
            return new Promise(() => {}); // Promesa que nunca se resuelve
          }
        } else {
          // No hay token, cerrar sesión directamente
          cerrarSesion();
          useUsuarioStore.getState().clearUsuario();
          localStorage.clear();
          sessionStorage.clear();
          window.location.replace('/seleccionar-usuario');
          return new Promise(() => {});
        }
      } catch (refreshError) {
        // Error al intentar renovar - cerrar sesión y forzar recarga
        console.error('Error al renovar token:', refreshError);
        const { cerrarSesion } = useAutenticacionStore.getState();
        cerrarSesion();
        useUsuarioStore.getState().clearUsuario();
        
        // LIMPIEZA COMPLETA
        localStorage.clear();
        sessionStorage.clear();
        
        // Forzar recarga completa
        window.location.replace('/seleccionar-usuario');
        
        // Retornar promesa que nunca se resuelve para detener ejecución
        return new Promise(() => {});
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
