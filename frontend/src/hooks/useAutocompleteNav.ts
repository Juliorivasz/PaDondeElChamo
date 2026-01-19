import { useState, useEffect, useCallback } from 'react';

// El hook recibe la cantidad de items y la función para seleccionar uno.
export const useAutocompleteNav = (itemCount: number, onSelect: (index: number) => void) => {
  const [activeIndex, setActiveIndex] = useState(-1);

  // Resetea el índice cuando la lista de items cambia
  useEffect(() => {
    setActiveIndex(-1);
  }, [itemCount]);

  // Manejador de teclado
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (itemCount === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, itemCount - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => Math.max(0, prev - 1));
        break;
      case 'Enter':
        e.preventDefault();
        // Si no hay ninguno seleccionado con las flechas, selecciona el primero.
        // Si sí hay uno seleccionado, lo usa.
        const selectedIndex = activeIndex >= 0 ? activeIndex : 0;
        onSelect(selectedIndex);
        break;
      case 'Escape':
        // El componente que lo usa se encargará de cerrar el dropdown
        break;
    }
  }, [activeIndex, itemCount, onSelect]);

  return {
    activeIndex,
    setActiveIndex,
    onKeyDown: handleKeyDown,
  };
};