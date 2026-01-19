import React, { useState, useEffect } from 'react';

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type' | 'min' | 'max'> {
  value: number; // El estado padre ahora es siempre number
  onValueChange: (value: number) => void; // El callback ahora siempre espera number
}

export const InputPorcentaje: React.FC<Props> = ({ value, onValueChange, ...props }) => {
  const [displayValue, setDisplayValue] = useState('');

  // Formatea el valor numérico para mostrarlo con '%'
  const formatValue = (num: number): string => {
    // Muestra % solo si el número es mayor a 0
    return num > 0 ? `${num} %` : '';
  };

  // Actualiza el display si el valor numérico cambia desde fuera
  useEffect(() => {
    setDisplayValue(formatValue(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numeroLimpioStr = inputValue.replace(/[^0-9]/g, '');
    let numeroLimpio = Number(numeroLimpioStr);

    if (numeroLimpio > 100) {
      numeroLimpio = 100;
    }
    
    // Determinamos el valor numérico final (0 si está vacío)
    const finalValue = numeroLimpioStr === '' ? 0 : numeroLimpio;

    // --- CORRECCIÓN AQUÍ ---
    // Siempre llamamos a onValueChange con un número (0 si está vacío)
    onValueChange(finalValue); 
    // ----------------------
    
    // Actualizamos el valor mostrado
    setDisplayValue(formatValue(finalValue));
  };

  const handleBlur = () => {
    // Re-formateamos al salir para manejar casos como escribir "5%" directamente
    setDisplayValue(formatValue(value));
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      {...props}
    />
  );
};