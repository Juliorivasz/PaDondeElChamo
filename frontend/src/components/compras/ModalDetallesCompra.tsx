"use client"

import type React from "react"
import { ShoppingCart, X } from "lucide-react"
import type { Compra } from "../../types/dto/Compra"
import { formatearFecha, formatearHora } from "../../utils/fechaUtils"
import { formatCurrency } from "../../utils/numberFormatUtils"
import { useEscapeKey } from "../../hooks/useEscapeKey"

interface Props {
  isOpen: boolean
  onClose: () => void
  compra: Compra | null
}

export const ModalDetallesCompra: React.FC<Props> = ({ isOpen, onClose, compra }) => {
  useEscapeKey(onClose, isOpen);

  if (!isOpen || !compra) return null

  const calcularSubtotal = (cantidad: number, costoUnitario: number) => {
    return cantidad * costoUnitario
  }

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <ShoppingCart size={20} className="text-azul" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Detalles de Compra #{compra.idCompra}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Información General y Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 space-y-4">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider ml-1">Información General</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Proveedor</span>
                  <span className="font-bold text-gray-900">{compra.proveedor}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Usuario</span>
                  <span className="font-bold text-gray-900">{compra.usuario}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Fecha de registro</span>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{formatearFecha(compra.fechaHora)}</div>
                    <div className="text-xs text-gray-400">{formatearHora(compra.fechaHora)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-azul/[0.03] p-6 rounded-lg border border-azul/10 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider ml-1 text-azul">Resumen Financiero</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Cantidad de Items</span>
                  <span className="font-bold text-gray-900">{compra.detalles.length}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Total de Productos</span>
                  <span className="font-bold text-gray-900">
                    {compra.detalles.reduce((total, detalle) => total + detalle.cantidad, 0)}
                  </span>
                </div>                
                <div className="pt-3 border-t border-azul/10 flex justify-between items-end">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Total Final</span>
                  <span className="text-3xl font-black text-azul tracking-tight">{formatCurrency(compra.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detalles de Productos */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider ml-1">Productos Comprados</h3>
            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Costo Unit.</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {compra.detalles.map((detalle, index) => (
                      <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">
                            {typeof detalle.producto === "object" ? (detalle.producto as any).nombre : detalle.producto}
                          </div>
                          <div className="text-xs text-gray-400 font-mono">ID: {detalle.idProducto}</div>
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-gray-600">{detalle.cantidad}</td>
                        <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(detalle.costoUnitario)}</td>
                        <td className="px-6 py-4 text-right font-bold text-azul">
                          {formatCurrency(calcularSubtotal(detalle.cantidad, detalle.costoUnitario))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50/50 font-bold">
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-right text-gray-500 uppercase tracking-wider text-xs">
                        Total General
                      </td>
                      <td className="px-6 py-4 text-right text-lg text-azul">
                        {formatCurrency(compra.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/30 flex justify-end">
          <button 
            onClick={onClose} 
            className="w-full sm:w-auto px-8 py-3 bg-white text-gray-600 font-bold rounded-lg border border-gray-200 hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
          >
            Cerrar Detalles
          </button>
        </div>
      </div>
    </div>
  )
}
