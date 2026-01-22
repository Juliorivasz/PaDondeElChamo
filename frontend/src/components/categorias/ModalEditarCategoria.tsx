"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { ModificarCategoriaDTO, Categoria, CategoriaArbol } from "../../types/dto/Categoria"
import { useCategoriaStore } from "../../store/categoriaStore"
import { SelectJerarquico } from "../SelectJerarquico"
import { useEscapeKey } from "../../hooks/useEscapeKey"
import { Plus } from "lucide-react"

interface ModalEditarCategoriaProps {
  isOpen: boolean
  onClose: () => void
  onConfirmar: (id: string, data: ModificarCategoriaDTO) => void
  categoria: Categoria | null
}

export const ModalEditarCategoria: React.FC<ModalEditarCategoriaProps> = ({
  isOpen,
  onClose,
  onConfirmar,
  categoria,
}) => {
  const { categoriasArbol } = useCategoriaStore()

  const [formData, setFormData] = useState<ModificarCategoriaDTO>({
    nombre: "",
    descripcion: "",
    idCategoriaPadre: null,
    stockMinimo: 0,
  })

  // useEffect para rellenar el formulario cuando se abre el modal con una categoría
  useEffect(() => {
    if (categoria && isOpen) {
      setFormData({
        nombre: categoria.nombre,
        descripcion: categoria.descripcion,
        idCategoriaPadre: categoria.idCategoriaPadre,
        stockMinimo: categoria.stockMinimo,
      })
    }
  }, [categoria, isOpen])  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (categoria) {
      onConfirmar(categoria.idCategoria, formData)
    }
  }

  // Lógica para filtrar la categoría actual y sus descendientes de las opciones de "Categoría Padre"
  const filtrarJerarquia = (nodos: CategoriaArbol[], idAExcluir: string): CategoriaArbol[] => {
    return nodos
      .filter(nodo => nodo.idCategoria !== idAExcluir)
      .map(nodo => ({
        ...nodo,
        hijos: filtrarJerarquia(nodo.hijos, idAExcluir),
      }));
  };

  const categoriasParaSelect = categoria ? filtrarJerarquia(categoriasArbol, categoria.idCategoria) : categoriasArbol;

  useEscapeKey(onClose, isOpen);

  if (!isOpen || !categoria) return null

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Editar Categoría</h2>
            <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {categoria.idCategoria}</p>
          </div>
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
              placeholder="Sin descripción"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700 ml-1">Categoría Padre</label>
              <SelectJerarquico
                opciones={categoriasParaSelect}
                selectedValue={formData.idCategoriaPadre ?? null}
                onSelect={(id) => setFormData({ ...formData, idCategoriaPadre: id ?? null })}
                idKey="idCategoria"
                placeholder="Ninguna (Categoría Principal)"
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
              className="px-6 py-2.5 bg-azul text-white font-semibold rounded-lg hover:bg-azul-dark shadow-md transition-all active:scale-95 order-1 sm:order-2 text-sm"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
