"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, Tag, AlignLeft, DollarSign } from "lucide-react"
import type { Gasto, GastoDTO } from "../../types/dto/Gasto"
import { modificarGasto } from "../../api/gastoApi"
import { InputMoneda } from "../InputMoneda"
import { useEscapeKey } from "../../hooks/useEscapeKey"
import { toast } from "react-toastify"

interface ModalEditarGastoProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  gasto: Gasto | null
  tiposDeGasto: string[]
}

export const ModalEditarGasto: React.FC<ModalEditarGastoProps> = ({
  isOpen,
  onClose,
  onSuccess,
  gasto,
  tiposDeGasto,
}) => {
  const [formData, setFormData] = useState<GastoDTO>({
    tipoGasto: "",
    descripcion: "",
    monto: 0,
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (gasto && isOpen) {
      setFormData({
        tipoGasto: gasto.tipoGasto,
        descripcion: gasto.descripcion || "",
        monto: gasto.monto,
      })
    }
  }, [gasto, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gasto) return

    if (!formData.tipoGasto || formData.monto <= 0) {
      toast.warning("Por favor complete el tipo de gasto y un monto válido")
      return
    }

    setIsLoading(true)
    try {
      await modificarGasto(gasto.idGasto, formData)
      toast.success("¡Gasto actualizado con éxito!")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error al modificar gasto:", error)
      toast.error("Error al actualizar el gasto")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "monto" ? Number.parseFloat(value) || 0 : value,
    }))
  }

  useEscapeKey(onClose, isOpen)

  if (!isOpen || !gasto) return null

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900">Editar Gasto</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-azul/5 px-4 py-2 rounded-lg text-azul text-xs font-bold uppercase tracking-wider w-fit">
            ID: #{gasto.idGasto}
          </div>

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
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700 ml-1">Monto *</label>
              <div className="relative group">
                <div className="absolute left-4 top-[11px] text-gray-400 group-focus-within:text-verde transition-colors">
                  <DollarSign size={18} />
                </div>
                <InputMoneda
                  value={formData.monto}
                  onValueChange={(nuevoValor) => {
                    setFormData((prev) => ({
                      ...prev,
                      monto: nuevoValor || 0,
                    }))
                  }}
                  required
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde/20 focus:border-verde transition-all font-bold text-verde text-lg"
                  placeholder="0.00"
                />
              </div>
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
            onClick={onClose}
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
            {isLoading ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  )
}
