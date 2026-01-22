"use client"

import type React from "react"
import { X, Package2, AlertTriangle, BadgeCheck } from "lucide-react"
import type { Insumo } from "../../types/dto/Insumo"
import { formatCurrency } from "../../utils/numberFormatUtils"
import { useEscapeKey } from "../../hooks/useEscapeKey"

interface Props {
  isOpen: boolean
  onClose: () => void
  insumo: Insumo | null
}

export const ModalDetallesInsumo: React.FC<Props> = ({ isOpen, onClose, insumo }) => {
  useEscapeKey(onClose, isOpen);

  if (!isOpen || !insumo) return null

  const stockBajo = insumo.stock <= insumo.stockMinimo

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[95%] sm:w-full max-w-[500px] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Package2 className="text-azul" size={28} />
            <h2 className="text-xl font-semibold text-gray-800">Detalles del Insumo</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nombre</label>
            <p className="text-lg font-bold text-gray-900">{insumo.nombre}</p>
          </div>

          {/* Descripción */}
          {insumo.descripcion && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Descripción</label>
              <p className="text-gray-700">{insumo.descripcion}</p>
            </div>
          )}

          {/* Stock */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Stock Actual</label>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-4 py-2 text-lg font-bold rounded-lg ${
                  stockBajo
                    ? "bg-red-100 text-red-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {stockBajo ? (
                  <AlertTriangle size={20} className="mr-2" />
                ) : (
                  <BadgeCheck size={20} className="mr-2" />
                )}
                {insumo.stock} {insumo.unidadMedida}
              </span>
              {stockBajo && (
                <span className="text-sm text-red-600 font-medium">¡Stock bajo!</span>
              )}
            </div>
          </div>

          {/* Stock Mínimo */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Stock Mínimo</label>
            <p className="text-gray-700">{insumo.stockMinimo} {insumo.unidadMedida}</p>
          </div>

          {/* Unidad de Medida */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Unidad de Medida</label>
            <p className="text-gray-700 font-medium">{insumo.unidadMedida}</p>
          </div>

          {/* Costo */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Costo por Unidad</label>
            <p className="text-2xl font-bold text-azul">{formatCurrency(insumo.costo)}</p>
          </div>

          {/* Proveedor */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Proveedor</label>
            <p className="text-gray-700">{insumo.proveedor || "Sin proveedor"}</p>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Estado</label>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                insumo.estado
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {insumo.estado ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-100 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
