"use client"

import type React from "react"
import { X, User, Mail, Shield, ShieldCheck, Fingerprint } from "lucide-react"
import type { Usuario } from "../../types/dto/Usuario"
import { useEscapeKey } from "../../hooks/useEscapeKey"

interface ModalDetallesUsuarioProps {
  isOpen: boolean
  onClose: () => void
  usuario: Usuario | null
}

export const ModalDetallesUsuario: React.FC<ModalDetallesUsuarioProps> = ({ 
  isOpen, 
  onClose, 
  usuario 
}) => {
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
            <h2 className="text-xl font-bold text-gray-900">Detalles de Usuario</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Avatar / Icono grande */}
          <div className="flex flex-col items-center gap-4 py-4">
            <div className={`p-6 rounded-full ${esAdmin ? 'bg-blue-100 text-azul' : 'bg-gray-100 text-gray-600'}`}>
              {esAdmin ? <ShieldCheck size={48} /> : <User size={48} />}
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900">{usuario.nombre}</h3>
              <p className="text-sm font-medium text-gray-500">{usuario.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Info ID */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
              <div className="p-2 bg-white rounded-lg shadow-sm text-gray-400 border border-gray-100 shrink-0">
                <Fingerprint size={20} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">ID de Usuario</span>
                <span className="text-sm font-bold text-gray-900 break-words">{usuario.idUsuario}</span>
              </div>
            </div>

            {/* Info Rol */}
            <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
              esAdmin 
                ? 'bg-blue-50 border-blue-100' 
                : 'bg-green-50 border-green-100'
            }`}>
              <div className={`p-2 bg-white rounded-lg shadow-sm border shrink-0 ${
                esAdmin ? 'text-azul border-blue-100' : 'text-verde border-green-100'
              }`}>
                <Shield size={20} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  esAdmin ? 'text-azul/60' : 'text-verde/60'
                }`}>Rol Asignado</span>
                <span className={`text-sm font-bold break-words ${
                  esAdmin ? 'text-azul' : 'text-verde'
                }`}>{usuario.rol}</span>
              </div>
            </div>

            {/* Info Canal / Email */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
              <div className="p-2 bg-white rounded-lg shadow-sm text-gray-400 border border-gray-100 shrink-0">
                <Mail size={20} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Correo Principal</span>
                <span className="text-sm font-bold text-gray-900 break-words">{usuario.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-center bg-gray-50/50">
          <button
            onClick={onClose}
            className="w-full px-6 py-2.5 bg-gray-900 text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95"
          >
            Cerrar Detalles
          </button>
        </div>
      </div>
    </div>
  )
}
