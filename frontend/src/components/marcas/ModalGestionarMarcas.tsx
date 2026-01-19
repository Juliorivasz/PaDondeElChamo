"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, Edit2, Plus, Check } from "lucide-react"
import type { MarcaLista } from "../../types/dto/Producto"
import { obtenerListaMarcas, crearMarca, modificarMarca } from "../../api/marcaApi"
import { useEscapeKey } from "../../hooks/useEscapeKey"

interface Props {
  isOpen: boolean
  onClose: () => void
  onDataChange: () => void
}

export const ModalGestionarMarcas: React.FC<Props> = ({ isOpen, onClose, onDataChange }) => {
  const [marcas, setMarcas] = useState<MarcaLista[]>([])
  const [cargando, setCargando] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [nombreEditando, setNombreEditando] = useState("")
  const [nuevaMarca, setNuevaMarca] = useState("")
  const [creandoMarca, setCreandoMarca] = useState(false)

  useEffect(() => {
    if (isOpen) {
      cargarMarcas()
    }
  }, [isOpen])

  const cargarMarcas = async (): Promise<void> => {
    setCargando(true)
    try {
      const data = await obtenerListaMarcas()
      setMarcas(data)
    } catch (error) {
      console.error("Error al cargar marcas:", error)
    } finally {
      setCargando(false)
    }
  }

  const manejarCrearMarca = async (): Promise<void> => {
    if (!nuevaMarca.trim()) return

    setCreandoMarca(true)
    try {
      await crearMarca({ nombre: nuevaMarca.trim() })
      setNuevaMarca("")
      await cargarMarcas()
      onDataChange()
    } catch (error) {
      console.error("Error al crear marca:", error)
    } finally {
      setCreandoMarca(false)
    }
  }

  const iniciarEdicion = (marca: MarcaLista): void => {
    setEditandoId(marca.idMarca)
    setNombreEditando(marca.nombre)
  }

  const cancelarEdicion = (): void => {
    setEditandoId(null)
    setNombreEditando("")
  }

  const manejarGuardarEdicion = async (id: number): Promise<void> => {
    if (!nombreEditando.trim()) return

    try {
      await modificarMarca(id, { nombre: nombreEditando.trim() })
      setEditandoId(null)
      setNombreEditando("")
      await cargarMarcas()
      onDataChange()
    } catch (error) {
      console.error("Error al modificar marca:", error)
    }
  }

  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Gestionar Marcas</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Formulario para nueva marca */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Añadir Nueva Marca</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={nuevaMarca}
              onChange={(e) => setNuevaMarca(e.target.value)}
              placeholder="Nombre de la nueva marca"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === "Enter" && manejarCrearMarca()}
            />
            <button
              onClick={manejarCrearMarca}
              disabled={!nuevaMarca.trim() || creandoMarca}
              className="flex items-center space-x-2 px-4 py-2 bg-verde text-white rounded-md hover:bg-verde-dark disabled:opacity-50"
            >
              <Plus size={16} />
              <span>{creandoMarca ? "Creando..." : "Añadir"}</span>
            </button>
          </div>
        </div>

        {/* Tabla de marcas */}
        <div className="flex-1 overflow-y-auto">
          {cargando ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {marcas.map((marca) => (
                  <tr key={marca.idMarca} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editandoId === marca.idMarca ? (
                        // --- MODO EDICIÓN ---
                        // 1. Usamos Flexbox para alinear el input y los botones
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={nombreEditando}
                            onChange={(e) => setNombreEditando(e.target.value)}
                            className="flex-grow px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyPress={(e) => e.key === "Enter" && manejarGuardarEdicion(marca.idMarca)}
                            autoFocus
                          />
                          {/* 2. Movemos los botones aquí dentro */}
                          <button
                            onClick={() => manejarGuardarEdicion(marca.idMarca)}
                            className="text-green-600 hover:text-green-800 ml-2"
                            title="Guardar"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={cancelarEdicion}
                            className="text-red-600 hover:text-red-800"
                            title="Cancelar"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-gray-900">{marca.nombre}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {/* Solo mostramos los botones si NO estamos editando esta fila */}
                      {editandoId !== marca.idMarca && (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => iniciarEdicion(marca)}
                            className="text-gray-900 hover:text-blue-900 mr-6"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          {/* Aquí también iría tu botón de eliminar si lo tuvieras */}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
