import { useEffect, useState, useCallback } from 'react';
import { useAutenticacionStore } from '../store/autenticacionStore';
import { renovarToken } from '../api/autenticacionApi';

interface SessionMonitorState {
  showWarning: boolean;
  timeRemaining: number; // segundos restantes
  isExpired: boolean;
}

export const useSessionMonitor = () => {
  const { token, cerrarSesion, establecerAutenticacion } = useAutenticacionStore();
  const [state, setState] = useState<SessionMonitorState>({
    showWarning: false,
    timeRemaining: 0,
    isExpired: false,
  });

  // Decodificar token JWT para obtener la fecha de expiración
  const getTokenExpiration = useCallback((token: string): number | null => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000; // Convertir a milisegundos
    } catch (error) {
      console.error('Error decodificando token:', error);
      return null;
    }
  }, []);

  // Renovar sesión
  const handleRenovarSesion = useCallback(async () => {
    if (!token) return;

    try {
      const response = await renovarToken(token);
      const { nombre, rol } = useAutenticacionStore.getState();
      
      if (nombre && rol) {
        establecerAutenticacion(response.token, nombre, rol);
      }

      setState({
        showWarning: false,
        timeRemaining: 0,
        isExpired: false,
      });
    } catch (error) {
      console.error('Error renovando token:', error);
      cerrarSesion();
      window.location.href = '/seleccionar-usuario';
    }
  }, [token, establecerAutenticacion, cerrarSesion]);

  // Cerrar sesión
  const handleCerrarSesion = useCallback(() => {
    cerrarSesion();
    window.location.href = '/seleccionar-usuario';
  }, [cerrarSesion]);

  useEffect(() => {
    if (!token) {
      setState({
        showWarning: false,
        timeRemaining: 0,
        isExpired: false,
      });
      return;
    }

    const expirationTime = getTokenExpiration(token);
    if (!expirationTime) return;

    // Resetear el estado cuando cambia el token (ej. después de renovar)
    setState({
      showWarning: false,
      timeRemaining: 0,
      isExpired: false,
    });

    const checkExpiration = () => {
      const now = Date.now();
      const timeLeft = expirationTime - now;
      const timeLeftSeconds = Math.floor(timeLeft / 1000);

      // Si el token ya expiró
      if (timeLeft <= 0) {
        setState({
          showWarning: false,
          timeRemaining: 0,
          isExpired: true,
        });
        cerrarSesion();
        window.location.href = '/seleccionar-usuario';
        return;
      }

      // Si faltan 5 minutos o menos (300 segundos)
      if (timeLeft < 300000) {
        setState({
          showWarning: true,
          timeRemaining: timeLeftSeconds,
          isExpired: false,
        });
      } else {
        setState({
          showWarning: false,
          timeRemaining: timeLeftSeconds,
          isExpired: false,
        });
      }
    };

    // Verificar inmediatamente
    checkExpiration();

    // Verificar cada segundo
    const interval = setInterval(checkExpiration, 1000);

    return () => clearInterval(interval);
  }, [token, getTokenExpiration, cerrarSesion]);

  return {
    showWarning: state.showWarning,
    timeRemaining: state.timeRemaining,
    isExpired: state.isExpired,
    renovarSesion: handleRenovarSesion,
    cerrarSesion: handleCerrarSesion,
  };
};
