"use client"

import type React from "react"
import { useState } from "react"
import { X, Tag, AlignLeft } from "lucide-react"
import type { GastoDTO } from "../../types/dto/Gasto"
import { crearGasto } from "../../api/gastoApi"
import { InputMoneda } from "../InputMoneda"
import { useEscapeKey } from "../../hooks/useEscapeKey"
import { toast } from "react-toastify"

interface ModalNuevoGastoProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  tiposDeGasto: string[]
}

const estadoInicial: GastoDTO = {
  tipoGasto: "",
  descripcion: "",
  monto: 0,
}

export const ModalNuevoGasto: React.FC<ModalNuevoGastoProps> = ({ isOpen, onClose, onSuccess, tiposDeGasto }) => {
  const [formData, setFormData] = useState<GastoDTO>(estadoInicial)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.tipoGasto || formData.monto <= 0) {
      toast.warning("Por favor complete el tipo de gasto y un monto válido")
      return
    }

    setIsLoading(true)
    try {
      await crearGasto(formData)
      toast.success("¡Gasto registrado con éxito!")
      onSuccess()
      handleClose()
    } catch (error) {
      console.error("No fue posible cargar el gasto")
      toast.error("Error al registrar el gasto")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFormData(estadoInicial)
    onClose()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "monto" ? Number.parseFloat(value) || 0 : value,
    }))
  }

  useEscapeKey(handleClose, isOpen)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900">Registrar Gasto</h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Tipo de Gasto */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700 ml-1">Tipo de Gasto *</label>
              <div className="relative group">
                <div className="absolute left-4 top-[11px] text-gray-400 group-focus-within:text-azul transition-colors">
                  <Tag size={18} />
                </div>
                <select
                  name="tipoGasto"
                  value={formData.tipoGasto}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all font-medium appearance-none"
                >
                  <option value="">Seleccionar tipo</option>
                  {tiposDeGasto.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Monto */}
            <div className="relative">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Monto *
              </label>
              <InputMoneda
                value={formData.monto}
                onValueChange={(nuevoValor) => {
                  setFormData((prev) => ({
                    ...prev,
                    monto: nuevoValor || 0,
                  }))
                }}
                required
                className="w-full pl-4 pr-4 py-3 text-xl font-semibold text-gray-800 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="$ 0"
              />
            </div>

            {/* Descripción */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700 ml-1">Descripción</label>
              <div className="relative group">
                <div className="absolute left-4 top-3 text-gray-400 group-focus-within:text-azul transition-colors">
                  <AlignLeft size={18} />
                </div>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  rows={3}
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all font-medium resize-none"
                  placeholder="Explique brevemente el motivo del gasto..."
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2.5 bg-white text-gray-700 rounded-lg font-semibold border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2.5 bg-azul text-white rounded-lg font-semibold hover:bg-azul-dark shadow-md shadow-azul/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? "Registrando..." : "Confirmar Gasto"}
          </button>
        </div>
      </div>
    </div>
  )
}
