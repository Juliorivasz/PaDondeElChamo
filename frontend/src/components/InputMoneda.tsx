"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { formatCurrency } from "../utils/numberFormatUtils"

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: number | null
  onValueChange: (value: number | null) => void
}

export const InputMoneda: React.FC<Props> = ({ value, onValueChange, ...props }) => {
  const [displayValue, setDisplayValue] = useState("")
  const isTypingRef = useRef(false)

  useEffect(() => {
    if (!isTypingRef.current) {
      if (value !== null && value !== undefined) {
        setDisplayValue(formatCurrency(value))
      } else {
        setDisplayValue("")
      }
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isTypingRef.current = true

    const inputValue = e.target.value
    const numeroLimpio = Number(inputValue.replace(/[^0-9]/g, ""))

    if (numeroLimpio > 0) {
      setDisplayValue(formatCurrency(numeroLimpio))
    } else {
      setDisplayValue("")
    }

    onValueChange(numeroLimpio || null)
  }

  const handleBlur = () => {
    isTypingRef.current = false
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      {...props}
    />
  )
}
