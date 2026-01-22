"use client"

import React, { useState, useEffect } from "react"
import { X, Pencil, Loader2 } from "lucide-react"
import type { ProductoAbm } from "../../types/dto/Producto"
import { formatCurrency } from "../../utils/numberFormatUtils"
import { useEscapeKey } from "../../hooks/useEscapeKey"
import { useUsuarioStore } from "../../store/usuarioStore"

interface Props {
  isOpen: boolean
  producto: ProductoAbm | null
  onClose: () => void
  onEdit?: (producto: ProductoAbm) => void
  onToggleState?: (idProducto: string) => void
}

export const ModalDetallesProducto: React.FC<Props> = ({ isOpen, producto, onClose, onEdit, onToggleState }) => {
  useEscapeKey(onClose, isOpen);
  const { usuario } = useUsuarioStore();
  const esAdmin = usuario?.rol === 'ADMIN';
  const [procesando, setProcesando] = useState(false);

  // Reset loading state when modal opens/closes or product changes
  useEffect(() => {
    if (isOpen) {
      setProcesando(false);
    }
  }, [isOpen, producto]);

  if (!isOpen || !producto) return null

  const handleToggle = async () => {
    if (onToggleState) {
      try {
        setProcesando(true);
        await onToggleState(producto.idProducto);
        // El cierre del modal se puede hacer aquí o dejar que el padre lo maneje si refresca todo
        onClose();
      } catch (error) {
        console.error("Error al cambiar estado:", error);
      } finally {
        if (isOpen) setProcesando(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[95%] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Detalles del Producto</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded" disabled={procesando}>
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Product Image */}
          {producto.imagenUrl && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 mb-2">Imagen del Producto</label>
              <div className="flex justify-center bg-gray-50 rounded-lg border-2 border-gray-200 p-4">
                <img
                  src={producto.imagenUrl}
                  alt={producto.nombre}
                  className="max-w-full max-h-96 object-contain rounded"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Nombre</label>
              <p className="text-gray-900 font-medium break-words">{producto.nombre}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Estado</label>
              <span
                className={`inline-block px-2 py-1 text-xs rounded ${producto.estado ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
              >
                {producto.estado ? "Activo" : "Inactivo"}
              </span>
            </div>
            {producto.codigoDeBarras && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Código de Barras</label>
                <p className="text-gray-900 font-medium">{producto.codigoDeBarras}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Costo</label>
              <p className="text-gray-900">{formatCurrency(producto.costo)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Precio</label>
              <p className="text-gray-900 font-semibold">{formatCurrency(producto.precio)}</p>
            </div>
          </div>

          {producto.porcentaje && producto.precioConDescuento && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Descuento</label>
                <p className="text-blue-600 font-medium">-{producto.porcentaje}%</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Precio con Descuento</label>
                <p className="text-green-600 font-semibold">{formatCurrency(producto.precioConDescuento)}</p>
              </div>
            </div>
          )}

          {producto.cantidadMinima && producto.nuevoPrecio && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Cantidad Mínima</label>
                <p className="text-blue-600 font-medium">{producto.cantidadMinima} unidades</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Precio por Cantidad</label>
                <p className="text-green-600 font-semibold">{formatCurrency(producto.nuevoPrecio)}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Stock Actual</label>
              <p
                className={`font-semibold ${producto.stock <= producto.stockMinimo ? "text-red-600" : "text-gray-900"}`}
              >
                {producto.stock}
                {producto.stock <= producto.stockMinimo && (
                  <span className="text-xs text-red-500 block">Stock bajo</span>
                )}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Stock Mínimo (Categoría)</label>
              <p className="text-gray-900">{producto.stockMinimo}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Categoría</label>
              <p className="text-gray-900">{producto.categoria}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Marca</label>
              <p className="text-gray-900">{producto.marca}</p>
            </div>
            {producto.proveedor && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Proveedor</label>
                <p className="text-gray-900">{producto.proveedor}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Tipo de Producto</label>
              <span className={`inline-block px-2 py-1 text-xs rounded font-medium ${
                producto.tipoProducto === 'ELABORADO' ? 'bg-purple-100 text-purple-800' :
                producto.tipoProducto === 'MIXTO' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {producto.tipoProducto || 'SIMPLE'}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Cantidad Vendida</label>
              <p className="text-gray-900 font-medium">{producto.cantVendida || 0}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Cantidad Comprada</label>
              <p className="text-gray-900 font-medium">{producto.cantComprada || 0}</p>
            </div>
          </div>

          {/* Receta para productos ELABORADOS */}
          {producto.tipoProducto === 'ELABORADO' && producto.receta && producto.receta.length > 0 && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Receta (Ingredientes)</label>
              
              {/* Vista de tabla para desktop */}
              <div className="hidden md:block bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Insumo</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Cantidad</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Unidad</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase">Costo Unit.</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {producto.receta.map((ingrediente, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">{ingrediente.nombreInsumo}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{ingrediente.cantidad}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{ingrediente.unidadMedida}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">
                          {ingrediente.costoUnitario ? formatCurrency(ingrediente.costoUnitario) : '-'}
                        </td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                          {ingrediente.subtotal ? formatCurrency(ingrediente.subtotal) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vista de cards para mobile */}
              <div className="md:hidden space-y-3">
                {producto.receta.map((ingrediente, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">{ingrediente.nombreInsumo}</h4>
                      {ingrediente.subtotal && (
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(ingrediente.subtotal)}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Cantidad:</span>
                        <span className="ml-1 text-gray-900 font-medium">
                          {ingrediente.cantidad} {ingrediente.unidadMedida}
                        </span>
                      </div>
                      {ingrediente.costoUnitario && (
                        <div className="text-right">
                          <span className="text-gray-500">Costo Unit.:</span>
                          <span className="ml-1 text-gray-900 font-medium">
                            {formatCurrency(ingrediente.costoUnitario)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

         {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between p-6 border-t border-gray-100 bg-gray-50/50">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {esAdmin && onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(producto);
                }}
                disabled={procesando}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-azul text-white font-semibold rounded-lg hover:bg-azul-dark transition-all shadow-md active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Pencil size={16} />
                Editar Producto
              </button>
            )}
            {onToggleState && (
              <button
                onClick={handleToggle}
                disabled={procesando}
                className={`flex items-center justify-center gap-2 px-6 py-2.5 font-semibold rounded-lg transition-all shadow-md active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                  producto.estado
                    ? 'bg-toggleOff hover:bg-toggleOff/90'
                    : 'bg-toggleOn hover:bg-toggleOn/90'
                }`}
              >
                {procesando ? (
                   <>
                     <Loader2 size={16} className="animate-spin" />
                     Procesando...
                   </>
                ) : (
                  producto.estado ? 'Desactivar' : 'Activar'
                )}
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={procesando}
            className="px-8 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all shadow-md active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
