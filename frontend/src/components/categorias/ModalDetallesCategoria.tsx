"use client"

import type React from "react"
import type { Categoria } from "../../types/dto/Categoria"
import { formatCurrency } from "../../utils/numberFormatUtils"
import { useEscapeKey } from "../../hooks/useEscapeKey"
import { Plus, Tag, Box, LayoutGrid } from "lucide-react"

interface ModalDetallesCategoriaProps {
  isOpen: boolean
  onClose: () => void
  categoria: Categoria | null
}

export const ModalDetallesCategoria: React.FC<ModalDetallesCategoriaProps> = ({ isOpen, onClose, categoria }) => {

  useEscapeKey(onClose, isOpen);

  if (!isOpen || !categoria) return null

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-azul">
              <Tag size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Detalles de Categoría</h2>
              <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {categoria.idCategoria}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <Plus size={24} className="rotate-45" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{categoria.nombre}</h3>
              <p className="text-sm text-gray-500 mt-1">{categoria.descripcion || "Sin descripción disponible"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${categoria.estado
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : "bg-red-100 text-red-800 border border-red-200"
                  }`}
              >
                {categoria.estado ? "Activa" : "Inactiva"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Box size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Productos Asociados</span>
              </div>
              <p className="text-2xl text-center font-bold text-gray-800">{categoria.productos.length}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <LayoutGrid size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Stock Mínimo Sugerido</span>
              </div>
              <p className="text-2xl text-center font-bold text-gray-800">{categoria.stockMinimo}</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Lista de Productos</label>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-100 bg-white">
              {categoria.productos.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {categoria.productos.map((producto, index) => (
                    <div key={index} className="flex justify-between items-center px-4 py-3 hover:bg-gray-50 transition-colors">
                      <span className="text-sm font-medium text-gray-700">{producto.nombre}</span>
                      <span className="text-sm font-bold text-azul">{formatCurrency(producto.precio)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">No hay productos en esta categoría</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-8 py-2.5 bg-azul text-white font-medium text-sm tracking-widest hover:bg-azul-dark transition-all shadow-md active:scale-95 rounded-lg"
            >
              Cerrar Detalles
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
