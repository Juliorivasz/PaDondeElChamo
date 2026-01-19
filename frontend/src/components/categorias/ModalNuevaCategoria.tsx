"use client"

import type React from "react"
import { useState } from "react"
import type { CrearCategoriaDTO } from "../../types/dto/Categoria"
import { useCategoriaStore } from "../../store/categoriaStore"
import { SelectJerarquico } from "../SelectJerarquico"
import { Plus } from "lucide-react"
import { useEscapeKey } from "../../hooks/useEscapeKey"

interface ModalNuevaCategoriaProps {
  isOpen: boolean
  onClose: () => void
  onConfirmar: (data: CrearCategoriaDTO) => void
}

export const ModalNuevaCategoria: React.FC<ModalNuevaCategoriaProps> = ({
  isOpen,
  onClose,
  onConfirmar
}) => {
  const { categoriasArbol } = useCategoriaStore()

  const [formData, setFormData] = useState<CrearCategoriaDTO>({
    nombre: "",
    descripcion: "",
    idCategoriaPadre: null,
    stockMinimo: 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirmar(formData)
    setFormData({ nombre: "", descripcion: "", idCategoriaPadre: null, stockMinimo: 0 })
  }

  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900">Nueva Categoría</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <Plus size={24} className="rotate-45" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700 ml-1">Nombre</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Anillos de Oro"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700 ml-1">Descripción</label>
            <textarea
              rows={3}
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Breve descripción de la categoría..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700 ml-1">Categoría Padre</label>
              <SelectJerarquico
                opciones={categoriasArbol}
                selectedValue={formData.idCategoriaPadre}
                onSelect={(id) => setFormData({ ...formData, idCategoriaPadre: id })}
                idKey="idCategoria"
                placeholder="Sin categoría padre"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700 ml-1">Stock Mínimo Sugerido</label>
              <input
                type="number"
                min="0"
                value={formData.stockMinimo}
                onChange={(e) => setFormData({ ...formData, stockMinimo: Number.parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg transition-colors order-2 sm:order-1 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-azul text-white font-semibold rounded-lg hover:bg-azul-dark transition-all shadow-md active:scale-95 order-1 sm:order-2 text-sm"
            >
              Crear Categoría
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
