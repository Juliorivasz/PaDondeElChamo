"use client"

import type React from "react"
import { X, Phone, Mail, ShieldCheck, ShieldAlert } from "lucide-react"
import type { Proveedor } from "../../types/dto/Proveedor"
import { useEscapeKey } from "../../hooks/useEscapeKey"

interface ModalDetallesProveedorProps {
  isOpen: boolean
  onClose: () => void
  proveedor: Proveedor
}

export const ModalDetallesProveedor: React.FC<ModalDetallesProveedorProps> = ({ isOpen, onClose, proveedor }) => {
  useEscapeKey(onClose, isOpen)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900">Detalles del Proveedor</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-azul/[0.03] p-6 rounded-lg border border-azul/10 space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Información Comercial</h3>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">ID Proveedor</label>
                <div className="text-sm font-mono font-bold text-gray-600 font-mono">#{proveedor.idProveedor}</div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Nombre / Razón Social</label>
                <div className="text-lg font-bold text-gray-900">{proveedor.nombre}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-azul">
                <Phone size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Teléfono</span>
              </div>
              <div className={`text-sm font-bold ${proveedor.telefono ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                {proveedor.telefono || "No especificado"}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-azul">
                <Mail size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Email</span>
              </div>
              <div className={`text-sm font-bold ${proveedor.email ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                {proveedor.email || "No especificado"}
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all duration-300 ${
            proveedor.estado 
              ? 'bg-verde/5 border-verde/20 text-verde' 
              : 'bg-gray-100 border-gray-200 text-gray-500'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                proveedor.estado ? 'bg-verde/10' : 'bg-gray-200'
              }`}>
                {proveedor.estado ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Estado</div>
                <div className="text-sm font-black uppercase tracking-wide">
                  {proveedor.estado ? 'Activo' : 'Inactivo'}
                </div>
              </div>
            </div>
            <div className={`w-2.5 h-2.5 rounded-full ${proveedor.estado ? 'bg-verde animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-300'}`} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-center bg-gray-50/50">
          <button
            onClick={onClose}
            className="w-full px-6 py-2.5 bg-azul text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-azul-dark transition-all shadow-lg active:scale-95"
          >
            Cerrar Detalles
          </button>
        </div>
      </div>
    </div>
  )
}
