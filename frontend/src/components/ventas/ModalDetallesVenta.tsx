"use client"

import type React from "react"
import { X } from "lucide-react"
import type { VentaHistorial } from "../../types/dto/Venta"
import { formatCurrency } from "../../utils/numberFormatUtils"
import { formatearFecha, formatearHora } from "../../utils/fechaUtils"
import { useEscapeKey } from "../../hooks/useEscapeKey"

interface Props {
  isOpen: boolean
  onClose: () => void
  venta: VentaHistorial | null
}

export const ModalDetallesVenta: React.FC<Props> = ({ isOpen, onClose, venta }) => {
  const calcularSubtotal = (cantidad: number, precioUnitario: number) => {
    return cantidad * precioUnitario
  }

  useEscapeKey(onClose, isOpen)

  if (!isOpen || !venta) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-0">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Detalles de Venta #{venta.idVenta}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Información General */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Información General</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">ID de Venta:</span>
                  <span className="font-medium">#{venta.idVenta}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Método de Pago:</span>
                  <span className="font-medium">{venta.metodoDePago}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Usuario:</span>
                  <span className="font-medium">{venta.usuario}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha:</span>
                  <span className="font-medium">{formatearFecha(venta.fechaHora)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hora:</span>
                  <span className="font-medium">{formatearHora(venta.fechaHora)}</span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Resumen de Venta</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cantidad de Items:</span>
                  <span className="font-medium">{venta.detalles.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total de Productos:</span>
                  <span className="font-medium">
                    {venta.detalles.reduce((total, detalle) => total + detalle.cantidad, 0)}
                  </span>
                </div>
                {venta.descuento != null && venta.descuento > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span className="font-medium">
                      Descuento
                      {venta.tipoDescuento === "AUTOMATICO"
                        ? ` (Automático ${venta.porcentajeAplicado}%)`
                        : venta.tipoDescuento === "PORCENTAJE"
                          ? ` (${venta.porcentajeAplicado}%)`
                          : ""}
                      :
                    </span>
                    <span className="font-semibold">-{formatCurrency(venta.descuento)}</span>
                  </div>
                )}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-800">Total:</span>
                    <span className="text-2xl font-bold text-green-600">{formatCurrency(venta.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detalles de Productos */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">Productos Vendidos</h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Producto</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">Cantidad</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">Precio Unitario</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {venta.detalles.map((detalle, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{detalle.nombre}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-center">{detalle.cantidad}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">
                        {formatCurrency(detalle.precioUnitario)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-semibold text-right">
                        {formatCurrency(calcularSubtotal(detalle.cantidad, detalle.precioUnitario))}
                      </td>
                    </tr>
                  ))}
                  {venta.montoAdicional !== null && venta.montoAdicional > 0 && (
                    <tr className="hover:bg-gray-50 bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">Otros</td>
                      <td className="px-6 py-4 text-sm text-gray-400 text-center">-</td>
                      <td className="px-6 py-4 text-sm text-gray-400 text-right">-</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-semibold text-right">
                        {formatCurrency(venta.montoAdicional)}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-sm font-semibold text-gray-800 text-right">
                      Total General:
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600 text-right">
                      {formatCurrency(venta.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Botón de Cerrar */}
          <div className="flex justify-end pt-4">
            <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
