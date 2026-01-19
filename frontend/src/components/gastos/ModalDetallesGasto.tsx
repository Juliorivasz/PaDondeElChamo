"use client"

import type React from "react"
import { X, Calendar, Clock, User, Tag, DollarSign } from "lucide-react"
import type { Gasto } from "../../types/dto/Gasto"
import { formatearFecha, formatearHora } from "../../utils/fechaUtils"
import { formatCurrency } from "../../utils/numberFormatUtils"
import { useEscapeKey } from "../../hooks/useEscapeKey"

interface ModalDetallesGastoProps {
  isOpen: boolean
  onClose: () => void
  gasto: Gasto | null
}

export const ModalDetallesGasto: React.FC<ModalDetallesGastoProps> = ({ isOpen, onClose, gasto }) => {
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
          <h2 className="text-xl font-bold text-gray-900">Detalles del Gasto</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex justify-between items-start gap-4">
            <div className="bg-azul/[0.03] p-4 rounded-lg border border-azul/10 flex-1">
              <div className="flex items-center gap-2 text-azul mb-1">
                <Tag size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Categoría</span>
              </div>
              <div className="text-lg font-bold text-gray-900 uppercase tracking-tight">
                {gasto.tipoGasto}
              </div>
            </div>

            <div className="bg-verde/[0.03] p-4 rounded-lg border border-verde/10 flex-1 text-right">
              <div className="flex items-center justify-end gap-2 text-verde mb-1">
                <DollarSign size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Monto Total</span>
              </div>
              <div className="text-2xl font-bold text-verde tracking-tight">
                {formatCurrency(gasto.monto)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-400">
              <Calendar size={16} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Fecha</span>
            </div>
            <div className="text-sm font-bold text-gray-900">
              {formatearFecha(gasto.fechaHora)}
            </div>
          </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-gray-400">
                <Clock size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Hora</span>
              </div>
              <div className="text-sm font-bold text-gray-900">
                {formatearHora(gasto.fechaHora)}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-400">
              <User size={16} />
              <span className="text-[10px] font-black uppercase tracking-wider">Registrado por</span>
            </div>
            <div className="text-sm font-bold text-gray-900">
              {gasto.usuario}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Descripción</h3>
            <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm min-h-[100px] text-gray-600 leading-relaxed text-sm">
              {gasto.descripcion || <span className="text-gray-300 italic">Sin descripción proporcionada</span>}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-center bg-gray-50/50">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-12 py-2.5 bg-azul text-white rounded-lg font-bold text-sm uppercase tracking-widest hover:bg-azul-dark transition-all shadow-md active:scale-95"
          >
            Cerrar Detalles
          </button>
        </div>
      </div>
    </div>
  )
}
