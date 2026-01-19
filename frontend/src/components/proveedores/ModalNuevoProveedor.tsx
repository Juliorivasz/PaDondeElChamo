"use client"

import type React from "react"
import { useState } from "react"
import { X, User, Phone, Mail } from "lucide-react"
import type { ProveedorDTO } from "../../types/dto/Proveedor"
import { useEscapeKey } from "../../hooks/useEscapeKey"

interface ModalNuevoProveedorProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: ProveedorDTO) => void
}

const estadoInicial = {
  nombre: "",
  telefono: null,
  email: null,
}

export const ModalNuevoProveedor: React.FC<ModalNuevoProveedorProps> = ({ isOpen, onClose, onConfirm }) => {
  const [formData, setFormData] = useState<ProveedorDTO>(estadoInicial)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? null : value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.nombre.trim()) {
      onConfirm(formData)
      handleClose()
    }
  }

  const handleClose = () => {
    setFormData(estadoInicial)
    onClose()
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
          <h2 className="text-xl font-bold text-gray-900">Nuevo Proveedor</h2>
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
            {/* Nombre */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700 ml-1">Nombre Comercial *</label>
              <div className="relative group">
                <div className="absolute left-4 top-[11px] text-gray-400 group-focus-within:text-azul transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej: Joyas Premium S.A."
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all font-medium"
                  required
                />
              </div>
            </div>

            {/* Teléfono */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700 ml-1">Teléfono</label>
              <div className="relative group">
                <div className="absolute left-4 top-[11px] text-gray-400 group-focus-within:text-azul transition-colors">
                  <Phone size={18} />
                </div>
                <input
                  type="text"
                  name="telefono"
                  value={formData.telefono || ""}
                  onChange={handleInputChange}
                  placeholder="Ej: +54 9 11 1234-5678"
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all font-medium"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700 ml-1">Correo Electrónico</label>
              <div className="relative group">
                <div className="absolute left-4 top-[11px] text-gray-400 group-focus-within:text-azul transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleInputChange}
                  placeholder="contacto@proveedor.com"
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all font-medium"
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
            className="px-6 py-2.5 bg-white text-gray-700 rounded-xl font-semibold border border-gray-200 hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-azul text-white rounded-xl font-semibold hover:bg-azul-dark shadow-lg shadow-azul/20 transition-all active:scale-95"
          >
            Guardar Proveedor
          </button>
        </div>
      </div>
    </div>
  )
}
