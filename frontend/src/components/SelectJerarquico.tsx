// src/components/SelectJerarquico.tsx

import React, { useState, useEffect, useRef } from 'react';
import { CornerDownRight } from 'lucide-react';

// --- Interfaz para las props del componente ---
interface Props {
  opciones: any[];
  selectedValue: number | null;
  onSelect: (id: number | null) => void;
  placeholder?: string;
  // Propiedades opcionales para mapear campos si no son 'id', 'nombre', 'hijos'
  idKey?: string;
  labelKey?: string;
  hijosKey?: string;
}

// --- Componente recursivo para renderizar cada opción ---
const OpcionRecursiva: React.FC<{ 
  opcion: any; 
  nivel: number; 
  onSelect: (id: number, nombre: string) => void;
  idKey: string;
  labelKey: string;
  hijosKey: string;
}> = ({ opcion, nivel, onSelect, idKey, labelKey, hijosKey }) => {
  const idValue = opcion[idKey];
  const labelValue = opcion[labelKey];
  const hijos = opcion[hijosKey] || [];

  return (
    <>
      <div
        onClick={() => onSelect(idValue, labelValue)}
        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
        style={{ paddingLeft: `${16 + nivel * 22}px` }}
      >
        {nivel > 0 && <CornerDownRight size={14} className="mr-[8px] flex-shrink-0" />}
        <span className="truncate">{labelValue}</span>
      </div>

      {hijos.map((hijo: any) => (
        <OpcionRecursiva 
          key={hijo[idKey]} 
          opcion={hijo} 
          nivel={nivel + 1} 
          onSelect={onSelect}
          idKey={idKey}
          labelKey={labelKey}
          hijosKey={hijosKey}
        />
      ))}
    </>
  );
};


// --- Componente principal del Select Jerárquico ---
export const SelectJerarquico: React.FC<Props> = ({ 
  opciones, 
  selectedValue, 
  onSelect, 
  placeholder = "Seleccionar...",
  idKey = "id",
  labelKey = "nombre",
  hijosKey = "hijos"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string>(placeholder);
  const ref = useRef<HTMLDivElement>(null);

  // Encontrar la etiqueta del valor seleccionado para mostrarla en el botón
  useEffect(() => {
    if (selectedValue) {
      const encontrarLabel = (nodos: any[]): string | null => {
        for (const nodo of nodos) {
          if (nodo[idKey] === selectedValue) return nodo[labelKey];
          const labelEncontrada = encontrarLabel(nodo[hijosKey] || []);
          if (labelEncontrada) return labelEncontrada;
        }
        return null;
      };
      const label = encontrarLabel(opciones);
      setSelectedLabel(label || placeholder);
    } else {
      setSelectedLabel(placeholder);
    }
  }, [selectedValue, opciones, placeholder, idKey, labelKey, hijosKey]);

  // Hook para cerrar el dropdown si se hace clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref]);

  const handleSelect = (id: number, nombre: string) => {
    onSelect(id);
    setSelectedLabel(nombre);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-[45px] px-3 py-2 text-left bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all"
      >
        <span className="block truncate">{selectedLabel}</span>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg max-h-60 overflow-auto border border-gray-100">
          {opciones.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-500 italic">Sin opciones</div>
          ) : (
            opciones.map((opcion) => (
              <OpcionRecursiva 
                key={opcion[idKey]} 
                opcion={opcion} 
                nivel={0} 
                onSelect={handleSelect}
                idKey={idKey}
                labelKey={labelKey}
                hijosKey={hijosKey}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
