"use client"

import type React from "react"
import { useState } from "react"
import { createPortal } from "react-dom"
import { X, Lock, Save, Eye, EyeOff, ShieldAlert } from "lucide-react"
import { toast } from "react-toastify"
// import { actualizarUsuario } from "../api/usuarioApi" Removed to fix lint
import { useAutenticacionStore } from "../store/autenticacionStore"
import { useUsuarioStore } from "../store/usuarioStore"
import { useEscapeKey } from "../hooks/useEscapeKey"

interface ModalCambioPasswordProps {
  isOpen: boolean
  onClose: () => void
  isForced?: boolean // Si es forzado por contraseña débil
  userId?: string // ID del usuario al que se le cambiará la contraseña (opcional, por defecto el usuario logueado)
}

const ModalCambioPassword: React.FC<ModalCambioPasswordProps> = ({ isOpen, onClose, isForced = false, userId }) => {
  const [currentPassword, setCurrentPassword] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const usuarioLogueado = useUsuarioStore((state) => state.usuario)
  const limpiarAdvertencia = useAutenticacionStore((state) => state.limpiarAdvertenciaPassword)

  const resetForm = () => {
    setCurrentPassword("")
    setPassword("")
    setConfirmPassword("")
    setMostrarPassword(false)
  }

  useEscapeKey(() => {
    if (!isForced) {
      resetForm()
      onClose()
    }
  }, isOpen)

  if (!isOpen) return null

  // Determinar a qué usuario se le va a cambiar la contraseña
  const targetUserId = userId || usuarioLogueado?.idUsuario

  const validatePassword = (pass: string): string | null => {
    if (pass.length < 6) return "La contraseña debe tener al menos 6 caracteres"
    if (/admin/i.test(pass)) return 'La contraseña no puede contener la palabra "admin"'
    if (!/[A-Z]/.test(pass)) return "La contraseña debe tener al menos una mayúscula"
    if (!/[a-z]/.test(pass)) return "La contraseña debe tener al menos una minúscula"
    if (!/[0-9]/.test(pass)) return "La contraseña debe tener al menos un número"
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    const error = validatePassword(password)
    if (error) {
      toast.error(error)
      return
    }

    if (!targetUserId) {
      toast.error("No se pudo identificar al usuario")
      return
    }

    try {
      setLoading(true)
      
      // Verificar si es el mismo usuario logueado
      if (targetUserId === usuarioLogueado?.idUsuario) {
        // Usar la función de Firebase Auth
        const { cambiarPassword, reautenticarUsuario } = await import("../api/usuarioApi")
        await reautenticarUsuario(currentPassword)
        await cambiarPassword(password)
      } else {
        // TODO: Implementar Cloud Function para cambiar contraseña de OTRO usuario
        // Por ahora, lanzamos error para no dar falso positivo
        // await actualizarUsuario(targetUserId, { password }) // ESTO NO FUNCIONA (borra el campo)
        
        throw new Error("Solo puedes cambiar tu propia contraseña por ahora. La gestión de contraseñas de otros usuarios requiere backend.")
      }

      toast.success("¡Contraseña actualizada correctamente!")
      limpiarAdvertencia()
      resetForm()
      onClose()
    } catch (error: any) {
      console.error("Error al cambiar contraseña:", error)
      toast.error(error.message || "Error al actualizar la contraseña")
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div 
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-azul">
              <Lock size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Seguridad</h2>
          </div>
          {!isForced && (
            <button 
              onClick={() => { resetForm(); onClose(); }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {isForced && (
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
              <div className="text-amber-500 shrink-0">
                <ShieldAlert size={20} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-amber-900">Actualización Obligatoria</p>
                <p className="text-xs text-amber-700 leading-relaxed font-medium">Contraseña insegura detectada. Por favor, actualízala para proteger tu cuenta.</p>
              </div>
            </div>
          )}

          <div className="space-y-1.5 text-center pb-2">
            <h3 className="text-lg font-bold text-gray-900">Cambiar Contraseña</h3>
            <p className="text-xs text-gray-400 font-medium">Establece una nueva clave de acceso segura</p>
          </div>

          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700 ml-1">Contraseña Actual</label>
            <div className="relative group">
              <div className="absolute left-4 top-[11px] text-gray-400 group-focus-within:text-azul transition-colors">
                <Lock size={18} />
              </div>
              <input
                type={mostrarPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all font-medium"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Nueva Password */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700 ml-1">Nueva Contraseña</label>
            <div className="relative group">
              <div className="absolute left-4 top-[11px] text-gray-400 group-focus-within:text-azul transition-colors">
                <Lock size={18} />
              </div>
              <input
                type={mostrarPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all font-medium"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 ml-1 font-medium italic">
              * Mín. 6 caracteres, Mayúscula, Minúscula y Número.
            </p>
          </div>

          {/* Confirmar Password */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700 ml-1">Confirmar Contraseña</label>
            <div className="relative group">
              <div className="absolute left-4 top-[11px] text-gray-400 group-focus-within:text-azul transition-colors">
                <Lock size={18} />
              </div>
              <input
                type={mostrarPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all font-medium"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex flex-col gap-3 bg-gray-50/50">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-azul text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-azul-dark shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <Save size={18} />
            {loading ? "Guardando..." : "Actualizar Contraseña"}
          </button>
          
          {!isForced ? (
            <button
              type="button"
              onClick={() => { resetForm(); onClose(); }}
              disabled={loading}
              className="w-full px-6 py-2 bg-transparent text-gray-500 rounded-lg font-semibold text-xs hover:text-gray-700 transition-all uppercase tracking-wider"
            >
              Cancelar
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full px-6 py-2 bg-transparent text-gray-400 rounded-lg font-semibold text-[10px] hover:text-gray-600 transition-all uppercase tracking-wider"
            >
              Recordármelo más tarde
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ModalCambioPassword
