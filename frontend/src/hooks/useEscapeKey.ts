import { useEffect } from 'react';

export const useEscapeKey = (callback: () => void, isActive: boolean) => {
  useEffect(() => {
    // Si no está activo, no hacemos nada.
    if (!isActive) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // La función de limpieza
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, callback]); // El efecto depende de si está activo y de la función de callback
};