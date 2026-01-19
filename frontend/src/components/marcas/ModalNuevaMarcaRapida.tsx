"use client"

import type React from "react"
import { useState } from "react"
import { X } from "lucide-react"
import type { MarcaLista } from "../../types/dto/Producto"
import { crearMarca } from "../../api/marcaApi"
import { useEscapeKey } from "../../hooks/useEscapeKey"

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: (nuevaMarca: MarcaLista) => void
}

export const ModalNuevaMarcaRapida: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [nombre, setNombre] = useState("")
  const [cargando, setCargando] = useState(false)

  const manejarEnvio = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!nombre.trim()) return

    setCargando(true)
    try {
      const nuevaMarca = await crearMarca({ nombre: nombre.trim() })
      onSuccess(nuevaMarca)
      setNombre("")
      onClose()
    } catch (error) {
      console.error("Error al crear marca")
    } finally {
      setCargando(false)
    }
  }

  const manejarCerrar = (): void => {
    setNombre("")
    onClose()
  }

  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[90%] sm:w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Nueva Marca</h2>
          <button onClick={manejarCerrar} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={manejarEnvio} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ingrese el nombre de la marca"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              autoFocus
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={manejarCerrar}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!nombre.trim() || cargando}
              className="px-4 py-2 bg-verde text-white rounded-md hover:bg-verde-dark disabled:opacity-50"
            >
              {cargando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
