import React, { useState, useEffect, useRef } from "react"

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: number
  onChange: (value: number) => void
}

export const InputCantidad: React.FC<Props> = ({ value, onChange, onFocus, className, ...props }) => {
  const [localValue, setLocalValue] = useState(value.toString())
  const isTypingRef = useRef(false)

  useEffect(() => {
    if (!isTypingRef.current) {
      setLocalValue(value.toString())
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isTypingRef.current = true
    const newVal = e.target.value
    
    // Permitir vacío o números
    if (newVal === "" || /^\d+$/.test(newVal)) {
      setLocalValue(newVal)
      
      const parsed = parseInt(newVal)
      // Solo notificamos cambios válidos mayores a 0
      // Si el usuario borra todo, no actualizamos el padre (para evitar ponerlo en 1 o borrar el item)
      if (!isNaN(parsed) && parsed > 0) {
        onChange(parsed)
      }
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    isTypingRef.current = false
    // Si quedó vacío o inválido, restauramos el valor original
    if (localValue === "" || isNaN(parseInt(localValue)) || parseInt(localValue) === 0) {
      setLocalValue(value.toString())
    }
    if (props.onBlur) props.onBlur(e)
  }

  const handleFocusInternal = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
    
    // Scroll Into View Logic integrado
    setTimeout(() => {
        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);

    if (onFocus) onFocus(e)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={localValue}
      onChange={handleChange}
      onFocus={handleFocusInternal}
      onBlur={handleBlur}
      className={className}
      {...props}
    />
  )
}
