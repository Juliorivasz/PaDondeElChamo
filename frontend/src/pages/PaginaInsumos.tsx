"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Package2, Plus, Eye, Pencil, AlertTriangle, BrushCleaning, BadgeCheck } from "lucide-react"
import type { Insumo } from "../types/dto/Insumo"
import type { ProveedorLista } from "../types/dto/Producto"
import { obtenerInsumos, cambiarEstadoInsumo } from "../api/insumoApi"
import { obtenerProveedores } from "../api/proveedorApi"
import { formatCurrency } from "../utils/numberFormatUtils"
import { toast } from "react-toastify"
import { useAutenticacionStore } from "../store/autenticacionStore"
import { ModalNuevoInsumo } from "../components/insumos/ModalNuevoInsumo"
import { ModalEditarInsumo } from "../components/insumos/ModalEditarInsumo"
import { ModalDetallesInsumo } from "../components/insumos/ModalDetallesInsumo"
import { PanelFiltrosColapsable } from "../components/PanelFiltrosColapsable"

const PaginaInsumos: React.FC = () => {
  const rol = useAutenticacionStore((state) => state.rol);
  const esAdmin = rol === 'ADMIN';

  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [busqueda, setBusqueda] = useState("")
  const [filtroProveedor, setFiltroProveedor] = useState("")
  const [filtroBajoStock, setFiltroBajoStock] = useState(false)

  // Listas para filtros
  const [proveedores, setProveedores] = useState<ProveedorLista[]>([])

  // Modales
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false)
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false)
  const [modalDetallesAbierto, setModalDetallesAbierto] = useState(false)
  const [insumoSeleccionado, setInsumoSeleccionado] = useState<Insumo | null>(null)

  useEffect(() => {
    cargarDatos()
  }, [busqueda, filtroProveedor, filtroBajoStock])

  const cargarDatos = async (): Promise<void> => {
    setCargando(true)
    setError(null)

    try {
      const [insumosData, proveedoresData] = await Promise.all([
        obtenerInsumos({
          busqueda,
          idProveedor: filtroProveedor || undefined,
          bajoStock: filtroBajoStock,
        }),
        obtenerProveedores()
      ])
      
      setInsumos(insumosData)
      setProveedores(proveedoresData)
    } catch (err) {
      console.error("Error al cargar datos:", err)
      setError("No se pudieron cargar los insumos")
      toast.error("Error al cargar insumos")
    } finally {
      setCargando(false)
    }
  }

  const handleCambiarEstado = async (id: string): Promise<void> => {
    try {
      setGuardando(true)
      await cambiarEstadoInsumo(id)
      await cargarDatos()
      toast.success("Estado actualizado")
    } catch (error) {
      console.error("Error al cambiar estado:", error)
      toast.error("Error al cambiar estado")
    } finally {
      setGuardando(false)
    }
  }

  const limpiarFiltros = (): void => {
    setBusqueda("")
    setFiltroProveedor("")
    setFiltroBajoStock(false)
  }

  const abrirModalEditar = (insumo: Insumo): void => {
    setInsumoSeleccionado(insumo)
    setModalEditarAbierto(true)
  }

  const abrirModalDetalles = (insumo: Insumo): void => {
    setInsumoSeleccionado(insumo)
    setModalDetallesAbierto(true)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => cargarDatos()} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Package2 className="text-azul" size={32} />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Insumos</h1>
            <p className="text-sm md:text-base text-gray-600">Gestiona ingredientes y materias primas</p>
          </div>
        </div>

        {esAdmin && (
          <button
            onClick={() => setModalNuevoAbierto(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-azul text-white rounded-md hover:bg-azul-dark w-full sm:w-auto"
          >
            <Plus size={20} />
            <span>Nuevo Insumo</span>
          </button>
        )}
      </div>

      {/* Panel de Filtros */}
      <div className="bg-white rounded-lg shadow-sm border-gray-200 p-5 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Buscar</label>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre o descripción..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Proveedor</label>
            <select
              value={filtroProveedor}
              onChange={(e) => setFiltroProveedor(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all"
            >
              <option value="">Todos</option>
              {proveedores.map((proveedor) => (
                <option key={proveedor.idProveedor} value={proveedor.idProveedor}>
                  {proveedor.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFiltroBajoStock(!filtroBajoStock)}
              className={`w-full h-[45px] flex items-center justify-center border px-4 py-2 rounded-lg text-sm font-semibold tracking-wider transition-all shadow-sm ${
                filtroBajoStock
                  ? "bg-amber-100 text-amber-800 border-amber-400"
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <AlertTriangle size={16} className="mr-2" />
              Stock Bajo
            </button>
          </div>

          <button
            onClick={limpiarFiltros}
            className="p-2.5 h-[45px] bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center justify-center group shadow-sm"
            title="Limpiar filtros"
          >
            <BrushCleaning size={20} className="group-hover:rotate-12 transition-transform mr-2 lg:mr-0" />
            <span className="lg:hidden font-semibold">Limpiar</span>
          </button>
        </div>
      </div>

      {/* Tabla de Insumos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {cargando ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando insumos...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium text-xs uppercase tracking-wider">
                  <th className="px-6 py-3 text-left">Nombre</th>
                  <th className="px-6 py-3 text-left">Stock</th>
                  <th className="px-6 py-3 text-left">Unidad</th>
                  <th className="px-6 py-3 text-left">Costo</th>
                  {esAdmin && <th className="px-6 py-3 text-left">Proveedor</th>}
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {insumos.length === 0 ? (
                  <tr>
                    <td colSpan={esAdmin ? 6 : 5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Package2 size={48} className="text-gray-200" />
                        <p className="text-gray-400 font-medium text-lg">No se encontraron insumos</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  insumos.map((insumo) => (
                    <tr 
                      key={insumo.idInsumo} 
                      onClick={() => abrirModalDetalles(insumo)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 leading-tight">{insumo.nombre}</div>
                        {insumo.descripcion && (
                          <div className="text-xs text-gray-500">{insumo.descripcion}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 text-sm font-bold rounded-full ${
                            insumo.stock <= insumo.stockMinimo
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {insumo.stock <= insumo.stockMinimo ? (
                            <AlertTriangle size={16} className="mr-1.5" />
                          ) : (
                            <BadgeCheck size={16} className="mr-1.5" />
                          )}
                          {insumo.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{insumo.unidadMedida}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(insumo.costo)}</td>
                      {esAdmin && (
                        <td className="px-6 py-4 text-gray-600">{insumo.proveedor || "Sin proveedor"}</td>
                      )}
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => abrirModalDetalles(insumo)}
                            className="p-1.5 text-gray-800 hover:text-black transition-colors rounded-lg"
                            title="Ver detalles"
                          >
                            <Eye size={18} />
                          </button>
                          {esAdmin && (
                            <>
                              <button
                                onClick={() => abrirModalEditar(insumo)}
                                className="p-1.5 text-gray-800 hover:text-black transition-colors rounded-lg"
                                title="Editar"
                              >
                                <Pencil size={18} />
                              </button>
                              <button
                                onClick={() => handleCambiarEstado(insumo.idInsumo)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm ${
                                  insumo.estado
                                    ? "bg-toggleOn focus:ring-toggleOn"
                                    : "bg-toggleOff focus:ring-toggleOff"
                                }`}
                                title={insumo.estado ? "Desactivar" : "Activar"}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${
                                    insumo.estado ? "translate-x-6" : "translate-x-1"
                                  }`}
                                />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {guardando && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-blue-100 border-t-azul rounded-full animate-spin"></div>
            <p className="text-gray-700 font-semibold">Guardando cambios...</p>
          </div>
        </div>
      )}

      {/* Modales */}
      <ModalNuevoInsumo
        isOpen={modalNuevoAbierto}
        onClose={() => setModalNuevoAbierto(false)}
        alConfirmar={() => {
          setModalNuevoAbierto(false)
          cargarDatos()
        }}
      />

      <ModalEditarInsumo
        isOpen={modalEditarAbierto}
        onClose={() => {
          setModalEditarAbierto(false)
          setInsumoSeleccionado(null)
        }}
        alConfirmar={() => {
          setModalEditarAbierto(false)
          setInsumoSeleccionado(null)
          cargarDatos()
        }}
        insumo={insumoSeleccionado}
      />

      <ModalDetallesInsumo
        isOpen={modalDetallesAbierto}
        onClose={() => {
          setModalDetallesAbierto(false)
          setInsumoSeleccionado(null)
        }}
        insumo={insumoSeleccionado}
      />
    </div>
  )
}

export default PaginaInsumos
