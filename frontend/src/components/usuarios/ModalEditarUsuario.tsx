"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, User, Mail, Shield } from "lucide-react"
import type { Usuario } from "../../types/dto/Usuario"
import { actualizarUsuario, type ActualizarUsuarioDTO } from "../../api/usuarioApi"
import { useEscapeKey } from "../../hooks/useEscapeKey"
import { toast } from "react-toastify"

interface ModalEditarUsuarioProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  usuario: Usuario | null
  rolesDisponibles: string[]
}

export const ModalEditarUsuario: React.FC<ModalEditarUsuarioProps> = ({
  isOpen,
  onClose,
  onSuccess,
  usuario,
  rolesDisponibles,
}) => {
  const [formData, setFormData] = useState<ActualizarUsuarioDTO>({
    nombre: "",
    email: "",
    rol: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (usuario && isOpen) {
      setFormData({
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      })
    }
  }, [usuario, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usuario) return

    if (!formData.nombre || !formData.email || !formData.rol) {
      toast.warning("Por favor complete todos los campos obligatorios")
      return
    }

    setIsLoading(true)
    try {
      await actualizarUsuario(usuario.idUsuario, formData)
      toast.success("¡Usuario actualizado con éxito!")
      onSuccess()
      onClose()
    } catch (error: any) {
      const mensaje = error.response?.data?.message || "Error al actualizar el usuario"
      toast.error(mensaje)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  useEscapeKey(onClose, isOpen)

  if (!isOpen || !usuario) return null

  const esAdmin = usuario.rol === "ADMIN"

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-azul">
              <User size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Editar Usuario</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="bg-blue-50 px-4 py-2 rounded-lg text-azul text-xs font-bold uppercase tracking-wider w-fit">
            ID: #{usuario.idUsuario}
          </div>

          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700 ml-1">Nombre Completo *</label>
            <div className="relative group">
              <div className="absolute left-4 top-[11px] text-gray-400 group-focus-within:text-azul transition-colors">
                <User size={18} />
              </div>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all font-medium"
                placeholder="Ej: Juan Pérez"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700 ml-1">Correo Electrónico *</label>
            <div className="relative group">
              <div className="absolute left-4 top-[11px] text-gray-400 group-focus-within:text-azul transition-colors">
                <Mail size={18} />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all font-medium"
                placeholder="usuario@ejemplo.com"
              />
            </div>
          </div>

          {/* Rol */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700 ml-1">Rol del Sistema *</label>
            <div className="relative group">
              <div className="absolute left-4 top-[11px] text-gray-400 group-focus-within:text-azul transition-colors">
                <Shield size={18} />
              </div>
              {esAdmin ? (
                <input
                  type="text"
                  value="ADMIN"
                  disabled
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed font-medium"
                />
              ) : (
                <select
                  name="rol"
                  value={formData.rol}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all font-medium appearance-none"
                >
                  {rolesDisponibles.map((rol) => (
                    <option key={rol} value={rol}>
                      {rol}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-white text-gray-700 rounded-lg font-semibold border border-gray-200 hover:bg-gray-50 transition-all text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2.5 bg-azul text-white rounded-lg font-semibold hover:bg-azul-dark shadow-md transition-all active:scale-95 disabled:opacity-50 text-sm"
          >
            {isLoading ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  )
}
