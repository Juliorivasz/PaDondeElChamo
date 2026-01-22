"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X } from "lucide-react"
import type { CrearInsumoDTO } from "../../types/dto/Insumo"
import type { ProveedorLista } from "../../types/dto/Producto"
import { UNIDADES_MEDIDA, TIPOS_INSUMO } from "../../types/dto/Insumo"
import { crearInsumo } from "../../api/insumoApi"
import { obtenerProveedores } from "../../api/proveedorApi"
import { InputMoneda } from "../InputMoneda"
import { useEscapeKey } from "../../hooks/useEscapeKey"
import { toast } from "react-toastify"

interface Props {
  isOpen: boolean
  onClose: () => void
  alConfirmar: () => void
}

export const ModalNuevoInsumo: React.FC<Props> = ({ isOpen, onClose, alConfirmar }) => {
  const [cargando, setCargando] = useState(false)
  const [proveedores, setProveedores] = useState<ProveedorLista[]>([])
  
  const [formulario, setFormulario] = useState<CrearInsumoDTO>({
    nombre: "",
    descripcion: "",
    stock: 0,
    stockMinimo: 0,
    unidadMedida: "kg",
    costo: 0,
    idProveedor: "",
    tipoInsumo: "PRODUCCION",
    precioVenta: undefined,
    categoria: "",
  })

  useEffect(() => {
    if (isOpen) {
      cargarProveedores()
    }
  }, [isOpen])

  const cargarProveedores = async (): Promise<void> => {
    try {
      const data = await obtenerProveedores()
      setProveedores(data)
    } catch (error) {
      console.error("Error al cargar proveedores:", error)
    }
  }

  const manejarCambio = (campo: keyof CrearInsumoDTO, valor: string | number): void => {
    setFormulario((prev) => ({
      ...prev,
      [campo]: valor,
    }))
  }

  const manejarEnvio = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setCargando(true)

    try {
      await crearInsumo(formulario)
      toast.success("Insumo creado con éxito!")
      alConfirmar()
      
      setFormulario({
        nombre: "",
        descripcion: "",
        stock: 0,
        stockMinimo: 0,
        unidadMedida: "kg",
        costo: 0,
        idProveedor: "",
        tipoInsumo: "PRODUCCION",
        precioVenta: undefined,
        categoria: "",
      })
    } catch (error: any) {
      if (error.response && error.response.data) {
        toast.error(error.response.data.message || error.response.data);
      } else {
        toast.error("Error al crear el insumo");
      }
    } finally {
      setCargando(false)
    }
  }

  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-[95%] sm:w-full max-w-[600px] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Nuevo Insumo</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 ml-3">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={manejarEnvio} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={formulario.nombre}
              onChange={(e) => manejarCambio("nombre", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={formulario.descripcion}
              onChange={(e) => manejarCambio("descripcion", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          {/* Stock y Stock Mínimo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Inicial *</label>
              <input
                type="number"
                value={formulario.stock}
                min="0"
                step="0.01"
                onChange={(e) => manejarCambio("stock", Number.parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo *</label>
              <input
                type="number"
                value={formulario.stockMinimo}
                min="0"
                step="0.01"
                onChange={(e) => manejarCambio("stockMinimo", Number.parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Unidad de Medida */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de Medida *</label>
            <select
              value={formulario.unidadMedida}
              onChange={(e) => manejarCambio("unidadMedida", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {UNIDADES_MEDIDA.map((unidad) => (
                <option key={unidad} value={unidad}>
                  {unidad}
                </option>
              ))}
            </select>
          </div>

          {/* Costo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Costo por Unidad *</label>
            <InputMoneda
              value={formulario.costo}
              onValueChange={(nuevoValor) => manejarCambio("costo", nuevoValor || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="$ 0"
              required
            />
          </div>

          {/* Proveedor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor *</label>
            <select
              value={formulario.idProveedor}
              onChange={(e) => manejarCambio("idProveedor", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccionar proveedor</option>
              {proveedores.map((proveedor) => (
                <option key={proveedor.idProveedor} value={proveedor.idProveedor}>
                  {proveedor.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Insumo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Insumo *</label>
            <select
              value={formulario.tipoInsumo}
              onChange={(e) => manejarCambio("tipoInsumo", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {TIPOS_INSUMO.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label} - {tipo.descripcion}
                </option>
              ))}
            </select>
          </div>

          {/* Precio de Venta (solo si es VENDIBLE o MIXTO) */}
          {(formulario.tipoInsumo === 'VENDIBLE' || formulario.tipoInsumo === 'MIXTO') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio de Venta *</label>
              <InputMoneda
                value={formulario.precioVenta || 0}
                onValueChange={(nuevoValor) => manejarCambio("precioVenta", nuevoValor || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="$ 0"
                required
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg transition-colors order-2 sm:order-1 text-sm shadow-sm border border-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="px-6 py-2.5 bg-azul text-white font-semibold rounded-lg hover:bg-azul-dark transition-all shadow-md active:scale-95 order-1 sm:order-2 text-sm disabled:opacity-50"
            >
              {cargando ? "Creando..." : "Crear Insumo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
