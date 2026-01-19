"use client"

import type React from "react"
import { useState } from "react"
import { X, User, Mail, Lock, Shield, Eye, EyeOff } from "lucide-react"
import { crearUsuario, type CrearUsuarioDTO } from "../../api/usuarioApi"
import { useEscapeKey } from "../../hooks/useEscapeKey"
import { toast } from "react-toastify"

interface ModalNuevoUsuarioProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  rolesDisponibles: string[]
}

const estadoInicial: CrearUsuarioDTO = {
  nombre: "",
  email: "",
  password: "",
  rol: "",
}

export const ModalNuevoUsuario: React.FC<ModalNuevoUsuarioProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  rolesDisponibles 
}) => {
  const [formData, setFormData] = useState<CrearUsuarioDTO>({
    ...estadoInicial,
    rol: rolesDisponibles[0] || "",
  })
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nombre || !formData.email || !formData.password || !formData.rol) {
      toast.warning("Por favor complete todos los campos obligatorios")
      return
    }

    if (formData.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setIsLoading(true)
    try {
      await crearUsuario(formData)
      toast.success("¡Usuario creado con éxito!")
      onSuccess()
      handleClose()
    } catch (error: any) {
      const mensaje = error.response?.data?.message || "Error al crear el usuario"
      toast.error(mensaje)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      ...estadoInicial,
      rol: rolesDisponibles[0] || "",
    })
    setMostrarPassword(false)
    onClose()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  useEscapeKey(handleClose, isOpen)

  if (!isOpen) return null

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
            <h2 className="text-xl font-bold text-gray-900">Nuevo Usuario</h2>
          </div>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
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

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700 ml-1">Contraseña *</label>
            <div className="relative group">
              <div className="absolute left-4 top-[11px] text-gray-400 group-focus-within:text-azul transition-colors">
                <Lock size={18} />
              </div>
              <input
                type={mostrarPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full pl-11 pr-11 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all font-medium"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Rol */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700 ml-1">Rol del Sistema *</label>
            <div className="relative group">
              <div className="absolute left-4 top-[11px] text-gray-400 group-focus-within:text-azul transition-colors">
                <Shield size={18} />
              </div>
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
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button
            type="button"
            onClick={handleClose}
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
            {isLoading ? "Creando..." : "Crear Usuario"}
          </button>
        </div>
      </div>
    </div>
  )
}
