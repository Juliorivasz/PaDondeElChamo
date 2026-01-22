"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Plus, Pencil, ChevronLeft, ChevronRight, ReceiptText, BrushCleaning, Eye } from "lucide-react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import type { Gasto, PaginaDeGastos } from "../types/dto/Gasto"
import { obtenerTiposGasto, obtenerGastos } from "../api/gastoApi"
import { obtenerUsuarios } from "../api/usuarioApi"
import type { Usuario } from "../types/dto/Usuario"
import { formatearFecha, formatearHora } from "../utils/fechaUtils"
import { ModalNuevoGasto } from "../components/gastos/ModalNuevoGasto"
import { ModalEditarGasto } from "../components/gastos/ModalEditarGasto"
import { ModalDetallesGasto } from "../components/gastos/ModalDetallesGasto"
import { formatCurrency } from "../utils/numberFormatUtils"
import { PanelFiltrosColapsable } from "../components/PanelFiltrosColapsable"

const PaginaGastos: React.FC = () => {
  // Estados principales
  const [paginaDeGastos, setPaginaDeGastos] = useState<PaginaDeGastos | null>(null)
  const [tiposDeGasto, setTiposDeGasto] = useState<string[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalNuevoOpen, setIsModalNuevoOpen] = useState(false)
  const [isModalEditarOpen, setIsModalEditarOpen] = useState(false)
  const [isModalDetallesOpen, setIsModalDetallesOpen] = useState(false)
  const [gastoSeleccionado, setGastoSeleccionado] = useState<Gasto | null>(null)

  // Estados de filtros
  const [filtros, setFiltros] = useState({
    page: 0,
    size: 10,
    tipoGasto: null as string | null,
    fechaInicio: null as string | null,
    fechaFin: null as string | null,
    idUsuario: null as number | null,
  })

  // Cargar tipos de gasto al montar el componente
  useEffect(() => {
    const cargarTiposDeGasto = async () => {
      try {
        const tipos = await obtenerTiposGasto()
        setTiposDeGasto(tipos)
      } catch (error) {
        console.error("Error al cargar tipos de gasto")
      }
    }

    const cargarUsuarios = async () => {
      try {
        const data = await obtenerUsuarios()
        setUsuarios(data)
      } catch (error) {
        console.error("Error al cargar usuarios:", error)
      }
    }

    cargarTiposDeGasto()
    cargarUsuarios()
  }, [])

  // Cargar gastos cuando cambien los filtros
  useEffect(() => {
    const cargarGastos = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const respuesta = await obtenerGastos(filtros)
        setPaginaDeGastos(respuesta)
      } catch (error) {
        setError(error instanceof Error ? error.message : "Error desconocido")
      } finally {
        setIsLoading(false)
      }
    }

    cargarGastos()
  }, [filtros])

  // Manejar cambios en filtros
  const handleFiltroChange = (campo: string, valor: any) => {
    setFiltros((prev) => ({
      ...prev,
      [campo]: valor,
      page: 0,
    }))
  }

  const limpiarFiltros = () => {
    setFiltros({
      page: 0,
      size: 10,
      tipoGasto: null,
      fechaInicio: null,
      fechaFin: null,
      idUsuario: null,
    })
  }

  // Manejar paginación
  const cambiarPagina = (nuevaPagina: number) => {
    setFiltros((prev) => ({
      ...prev,
      page: nuevaPagina,
    }))
  }

  const cambiarTamanoPagina = (nuevoTamano: number) => {
    setFiltros((prev) => ({
      ...prev,
      size: nuevoTamano,
      page: 0,
    }))
  }

  // Manejar edición
  const abrirModalEditar = (gasto: Gasto) => {
    setGastoSeleccionado(gasto)
    setIsModalEditarOpen(true)
  }

  const abrirModalDetalles = (gasto: Gasto) => {
    setGastoSeleccionado(gasto)
    setIsModalDetallesOpen(true)
  }

  // Refrescar datos después de operaciones exitosas
  const refrescarDatos = () => {
    const cargarGastos = async () => {
      try {
        const respuesta = await obtenerGastos(filtros)
        setPaginaDeGastos(respuesta)
      } catch (error) {
        console.error("Error al refrescar datos:", error)
      }
    }
    cargarGastos()
  }

  return (
    <div className="p-6 min-h-screen">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <ReceiptText className="text-azul" size={28} />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Gastos</h1>
            <p className="text-sm sm:text-base text-gray-600">Gestiona y controla los egresos del negocio</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalNuevoOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-azul text-white rounded-md font-semibold hover:bg-azul-dark shadow-md transition-all active:scale-95 text-sm sm:text-base w-full sm:w-auto"
        >
          <Plus size={20} />
          <span>Nuevo Gasto</span>
        </button>
      </div>

      {/* Panel de Filtros */}
      <PanelFiltrosColapsable titulo="Filtros de Búsqueda" defaultOpen={false}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 items-end">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Fecha de Inicio</label>
            <DatePicker
              selected={filtros.fechaInicio ? new Date(filtros.fechaInicio) : null}
              onChange={(date) => handleFiltroChange("fechaInicio", date ? date.toISOString().split("T")[0] : null)}
              locale="es"
              dateFormat="dd/MM/yyyy"
              placeholderText="Seleccionar fecha"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Fecha de Fin</label>
            <DatePicker
              selected={filtros.fechaFin ? new Date(filtros.fechaFin) : null}
              onChange={(date) => handleFiltroChange("fechaFin", date ? date.toISOString().split("T")[0] : null)}
              locale="es"
              dateFormat="dd/MM/yyyy"
              placeholderText="Seleccionar fecha"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Tipo de Gasto</label>
            <select
              value={filtros.tipoGasto || ""}
              onChange={(e) => handleFiltroChange("tipoGasto", e.target.value || null)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all appearance-none"
            >
              <option value="">Todos los tipos</option>
              {tiposDeGasto.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Usuario</label>
            <select
              value={filtros.idUsuario || ""}
              onChange={(e) => handleFiltroChange("idUsuario", e.target.value ? Number(e.target.value) : null)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all appearance-none"
            >
              <option value="">Todos los usuarios</option>
              {Array.isArray(usuarios) && usuarios.map((usuario) => (
                <option key={usuario.idUsuario} value={usuario.idUsuario}>
                  {usuario.nombre}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={limpiarFiltros}
            className="p-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center justify-center group w-full lg:w-fit shadow-sm h-[45px] mt-auto"
            title="Limpiar filtros"
          >
            <BrushCleaning size={20} className="group-hover:rotate-12 transition-transform mr-2 lg:mr-0" />
            <span className="lg:hidden font-semibold">Limpiar</span>
          </button>
        </div>
      </PanelFiltrosColapsable>

      {/* Tabla de Gastos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-100 text-red-600 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-azul/20 border-t-azul mb-4"></div>
            <div className="text-gray-500 font-medium">Cargando gastos...</div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium text-xs uppercase tracking-wider">
                    <th className="px-6 py-3 font-medium">ID</th>
                    <th className="px-6 py-3 font-medium">Tipo</th>
                    <th className="px-6 py-3 font-medium">Descripción</th>
                    <th className="px-6 py-3 font-medium">Monto</th>
                    <th className="px-6 py-3 font-medium">Usuario</th>
                    <th className="px-6 py-3 text-center font-medium">Fecha</th>
                    <th className="px-6 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginaDeGastos?.content.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                        No se encontraron gastos con los filtros aplicados
                      </td>
                    </tr>
                  ) : (
                    paginaDeGastos?.content.map((gasto) => (
                      <tr 
                        key={gasto.idGasto} 
                        onClick={() => abrirModalDetalles(gasto)}
                        className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                      >
                        <td className="px-6 py-4 text-gray-400 font-mono text-xs">#{gasto.idGasto}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-azul/5 text-azul rounded-lg text-xs font-bold uppercase tracking-wider">
                            {gasto.tipoGasto}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate font-medium text-gray-700">
                          {gasto.descripcion || <span className="text-gray-300 italic">Sin descripción</span>}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">{formatCurrency(gasto.monto)}</td>
                        <td className="px-6 py-4 text-gray-600 font-medium">{gasto.usuario}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="font-bold text-gray-900">{formatearFecha(gasto.fechaHora)}</div>
                          <div className="text-[10px] text-gray-400 uppercase font-black">{formatearHora(gasto.fechaHora)}</div>
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end items-center space-x-2">
                            <button
                              onClick={() => abrirModalDetalles(gasto)}
                              className="p-1.5 text-gray-800 hover:text-black transition-colors rounded-lg"
                              title="Ver detalles"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => abrirModalEditar(gasto)}
                              className="p-1.5 text-gray-800 hover:text-black transition-colors rounded-lg"
                              title="Editar gasto"
                            >
                              <Pencil size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {paginaDeGastos && paginaDeGastos.totalPages > 1 && (
              <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-500 font-medium">
                  Mostrando <span className="text-gray-900 font-bold">{paginaDeGastos.number * paginaDeGastos.size + 1}</span> a{" "}
                  <span className="text-gray-900 font-bold">
                    {Math.min((paginaDeGastos.number + 1) * paginaDeGastos.size, paginaDeGastos.totalElements)}
                  </span>{" "}
                  de <span className="text-gray-900 font-bold">{paginaDeGastos.totalElements}</span> gastos
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={filtros.size}
                    onChange={(e) => cambiarTamanoPagina(Number.parseInt(e.target.value))}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-azul/20 transition-all mr-2"
                  >
                    <option value={10}>10 por página</option>
                    <option value={20}>20 por página</option>
                    <option value={50}>50 por página</option>
                  </select>

                  <nav className="flex items-center gap-1">
                    <button
                      onClick={() => cambiarPagina(paginaDeGastos.number - 1)}
                      disabled={paginaDeGastos.number === 0}
                      className="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-azul hover:border-azul disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:border-gray-200 transition-all shadow-sm"
                    >
                      <ChevronLeft size={20} />
                    </button>

                    <div className="px-4 py-2 bg-azul text-white rounded-lg font-bold text-sm shadow-md shadow-azul/20">
                      {paginaDeGastos.number + 1}
                    </div>

                    <button
                      onClick={() => cambiarPagina(paginaDeGastos.number + 1)}
                      disabled={paginaDeGastos.number >= paginaDeGastos.totalPages - 1}
                      className="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-azul hover:border-azul disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:border-gray-200 transition-all shadow-sm"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </nav>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modales */}
      <ModalNuevoGasto
        isOpen={isModalNuevoOpen}
        onClose={() => setIsModalNuevoOpen(false)}
        onSuccess={refrescarDatos}
        tiposDeGasto={tiposDeGasto}
      />

      <ModalEditarGasto
        isOpen={isModalEditarOpen}
        onClose={() => setIsModalEditarOpen(false)}
        onSuccess={refrescarDatos}
        gasto={gastoSeleccionado}
        tiposDeGasto={tiposDeGasto}
      />

      <ModalDetallesGasto
        isOpen={isModalDetallesOpen}
        onClose={() => setIsModalDetallesOpen(false)}
        gasto={gastoSeleccionado}
      />
    </div>
  )
}

export default PaginaGastos
