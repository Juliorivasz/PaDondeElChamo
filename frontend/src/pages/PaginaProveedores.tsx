"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Plus, Pencil, Truck, BrushCleaning, Eye, Search } from "lucide-react"
import type { Proveedor, ProveedorDTO } from "../types/dto/Proveedor"
import { obtenerProveedores, crearProveedor, modificarProveedor, cambiarEstadoProveedor } from "../api/proveedorApi"
import { ModalDetallesProveedor } from "../components/proveedores/ModalDetallesProveedor"
import { toast } from "react-toastify"
import { ModalNuevoProveedor } from "../components/proveedores/ModalNuevoProveedor"
import { ModalEditarProveedor } from "../components/proveedores/ModalEditarProveedor"
import { PanelFiltrosColapsable } from "../components/PanelFiltrosColapsable"

const PaginaProveedores: React.FC = () => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [guardando, setGuardando] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [busqueda, setBusqueda] = useState<string>("")
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "activos" | "inactivos">("todos")
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState<boolean>(false)
  const [modalEditarAbierto, setModalEditarAbierto] = useState<boolean>(false)
  const [modalDetallesAbierto, setModalDetallesAbierto] = useState<boolean>(false)
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<Proveedor | null>(null)

  // Cargar proveedores al montar el componente
  useEffect(() => {
    cargarProveedores()
  }, [])

  const cargarProveedores = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await obtenerProveedores()
      setProveedores(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar proveedores")
    } finally {
      setLoading(false)
    }
  }

  // Filtrar proveedores basado en búsqueda y estado
  const proveedoresFiltrados = useMemo(() => {
    return proveedores.filter((proveedor) => {
      const coincideNombre = proveedor.nombre.toLowerCase().includes(busqueda.toLowerCase())
      const coincideEstado =
        filtroEstado === "todos" ||
        (filtroEstado === "activos" && proveedor.estado) ||
        (filtroEstado === "inactivos" && !proveedor.estado)

      return coincideNombre && coincideEstado
    })
  }, [proveedores, busqueda, filtroEstado])

  const handleCrearProveedor = async (data: ProveedorDTO) => {
    try {
      setGuardando(true)
      await crearProveedor(data)
      toast.success("Proveedor cargado con éxito")
      setModalNuevoAbierto(false)
      await cargarProveedores()
    } catch (err) {
      toast.error("No fue posible cargar el nuevo proveedor")
    } finally {
      setGuardando(false)
    }
  }

  const handleEditarProveedor = async (id: string, data: ProveedorDTO) => {
    try {
      setGuardando(true)
      await modificarProveedor(id, data)
      toast.success("Proveedor modificado con éxito")
      setModalEditarAbierto(false)
      setProveedorSeleccionado(null)
      await cargarProveedores()
    } catch (err) {
      toast.error("No fue posible modificar el proveedor")
    } finally {
      setGuardando(false)
    }
  }

  const handleCambiarEstado = async (id: string) => {
    try {
      setGuardando(true)
      await cambiarEstadoProveedor(id)
      await cargarProveedores()
      toast.success("Estado actualizado")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cambiar estado")
      toast.error("Error al cambiar estado")
    } finally {
      setGuardando(false)
    }
  }

  const abrirModalEditar = (proveedor: Proveedor) => {
    setProveedorSeleccionado(proveedor)
    setModalEditarAbierto(true)
  }

  const abrirModalDetalles = (proveedor: Proveedor) => {
    setProveedorSeleccionado(proveedor)
    setModalDetallesAbierto(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Cargando proveedores...</div>
      </div>
    )
  }

  return (
    <div className="p-6 min-h-screen">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Truck className="text-azul" size={28} />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Proveedores</h1>
            <p className="text-sm sm:text-base text-gray-600">Gestiona y controla los socios comerciales</p>
          </div>
        </div>
        <button
          onClick={() => setModalNuevoAbierto(true)}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-azul text-white rounded-md font-semibold hover:bg-azul-dark shadow-md transition-all active:scale-95 text-sm sm:text-base w-full sm:w-auto"
        >
          <Plus size={20} />
          <span>Nuevo Proveedor</span>
        </button>
      </div>

      {/* Panel de Filtros */}
      <PanelFiltrosColapsable titulo="Filtros de Búsqueda" defaultOpen={false}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-end">
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Búsqueda rápida</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Nombre del proveedor..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as "todos" | "activos" | "inactivos")}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all appearance-none"
            >
              <option value="todos">Todos los estados</option>
              <option value="activos">Solo Activos</option>
              <option value="inactivos">Solo Inactivos</option>
            </select>
          </div>

          <button
            onClick={() => {
              setBusqueda("")
              setFiltroEstado("todos")
            }}
            className="p-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center justify-center group w-full lg:w-fit shadow-sm h-[45px] mt-auto"
            title="Limpiar filtros"
          >
            <BrushCleaning size={20} className="group-hover:rotate-12 transition-transform mr-2 lg:mr-0" />
            <span className="lg:hidden font-semibold">Limpiar Filtros</span>
          </button>
        </div>
      </PanelFiltrosColapsable>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl flex items-center gap-3">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Tabla de proveedores */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium text-xs uppercase tracking-wider">
                <th className="px-6 py-3 text-left">ID</th>
                <th className="px-6 py-3 text-left">Proveedor</th>
                <th className="px-6 py-3 text-left">Contacto</th>

                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {proveedoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Truck size={48} className="text-gray-200" />
                      <p className="text-gray-400 font-medium text-lg">No se encontraron proveedores</p>
                    </div>
                  </td>
                </tr>
              ) : (
                proveedoresFiltrados.map((proveedor) => (
                  <tr 
                    key={proveedor.idProveedor} 
                    onClick={() => abrirModalDetalles(proveedor)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 text-gray-400 font-mono text-xs">#{proveedor.idProveedor}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 leading-tight">{proveedor.nombre}</div>
                    </td>
                    <td className="px-6 py-4 space-y-0.5">
                      <div className={`text-sm ${proveedor.telefono ? 'text-gray-600 font-medium' : 'text-gray-400 italic'}`}>
                        {proveedor.telefono || "Sin teléfono"}
                      </div>
                      <div className={`text-xs ${proveedor.email ? 'text-gray-500' : 'text-gray-400 italic'}`}>
                        {proveedor.email || "Sin email"}
                      </div>
                    </td>

                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => abrirModalDetalles(proveedor)}
                          className="p-1.5 text-gray-800 hover:text-black transition-colors rounded-lg"
                          title="Ver detalles"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => abrirModalEditar(proveedor)}
                          className="p-1.5 text-gray-800 hover:text-black transition-colors rounded-lg"
                          title="Editar proveedor"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleCambiarEstado(proveedor.idProveedor)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm ${proveedor.estado
                            ? "bg-toggleOn focus:ring-toggleOn"
                            : "bg-toggleOff focus:ring-toggleOff"
                            }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${proveedor.estado ? "translate-x-6" : "translate-x-1"
                              }`}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      <ModalNuevoProveedor
        isOpen={modalNuevoAbierto}
        onClose={() => setModalNuevoAbierto(false)}
        onConfirm={handleCrearProveedor}
      />

      <ModalEditarProveedor
        isOpen={modalEditarAbierto}
        onClose={() => {
          setModalEditarAbierto(false)
          setProveedorSeleccionado(null)
        }}
        onConfirm={handleEditarProveedor}
        proveedor={proveedorSeleccionado as Proveedor}
      />

      {proveedorSeleccionado && (
        <ModalDetallesProveedor
          isOpen={modalDetallesAbierto}
          onClose={() => {
            setModalDetallesAbierto(false)
            setProveedorSeleccionado(null)
          }}
          proveedor={proveedorSeleccionado as Proveedor}
        />
      )}

      {/* Loading Overlay */}
      {guardando && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-blue-100 border-t-azul rounded-full animate-spin"></div>
            <p className="text-gray-700 font-semibold">Guardando cambios...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaginaProveedores;
