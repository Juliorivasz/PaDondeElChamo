"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  ShoppingCart,
  Plus,
  Eye,
  Pencil,
  ChevronLeft,
  ChevronRight,
  BrushCleaning,
  Printer,
} from "lucide-react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import type { PaginaDeCompras, Compra } from "../types/dto/Compra"
import { descargarComprobanteCompra, obtenerCompras, toggleEstadoPagoCompra } from "../api/compraApi"
import { obtenerListaProveedores } from "../api/proveedorApi"
import { formatearFecha, formatearHora } from "../utils/fechaUtils"
import { ModalGestionarCompra } from "../components/compras/ModalGestionarCompra"
import { ModalDetallesCompra } from "../components/compras/ModalDetallesCompra"
import { formatCurrency } from "../utils/numberFormatUtils"
import type { Usuario } from "../types/dto/Usuario"
import { obtenerUsuarios } from "../api/usuarioApi"
import { toast } from "react-toastify"

const PaginaCompras: React.FC = () => {
  // Estados principales
  const [paginaDeCompras, setPaginaDeCompras] = useState<PaginaDeCompras | null>(null)
  const [proveedores, setProveedores] = useState<{ idProveedor: number; nombre: string }[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados de filtros
  const [filtros, setFiltros] = useState({
    pagina: 0,
    tamaño: 10,
    idProveedor: null as number | null,
    fechaInicio: null as Date | null,
    fechaFin: null as Date | null,
    idUsuario: null as number | null,
  })

  // Estados de modales
  const [modalGestionarAbierto, setModalGestionarAbierto] = useState(false)
  const [compraParaEditar, setCompraParaEditar] = useState<Compra | null>(null)
  const [modalDetallesAbierto, setModalDetallesAbierto] = useState(false)
  const [compraSeleccionada, setCompraSeleccionada] = useState<Compra | null>(null)

  // Cargar proveedores al montar el componente
  useEffect(() => {
    cargarProveedores()
    cargarUsuarios()
  }, [])

  // Cargar compras cuando cambien los filtros
  useEffect(() => {
    cargarCompras()
  }, [filtros])

  const cargarProveedores = async () => {
    try {
      const data = await obtenerListaProveedores()
      setProveedores(data)
    } catch (error) {
      console.error("Error al cargar proveedores")
    }
  }

  const cargarUsuarios = async () => {
    try {
      const data = await obtenerUsuarios()
      setUsuarios(data)
    } catch (error) {
      console.error("Error al cargar usuarios")
    }
  }

  const cargarCompras = async () => {
    setCargando(true)
    setError(null)

    try {
      const filtrosApi = {
        ...filtros,
        fechaInicio: filtros.fechaInicio ? filtros.fechaInicio.toISOString().split("T")[0] : null,
        fechaFin: filtros.fechaFin ? filtros.fechaFin.toISOString().split("T")[0] : null,
      }
      const data = await obtenerCompras(filtrosApi)
      setPaginaDeCompras(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al cargar compras")
    } finally {
      setCargando(false)
    }
  }

  const handleDescargar = async (idCompra: number) => {
    const toastId = toast.loading("Generando comprobante...")
    try {
      await descargarComprobanteCompra(idCompra)
      toast.update(toastId, {
        render: "Comprobante generado correctamente",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      })
    } catch (error) {
      toast.update(toastId, {
        render: "Error al generar el comprobante.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      })
    }
  }

  const manejarCambioFiltro = (campo: string, valor: any) => {
    setFiltros((prev) => ({
      ...prev,
      [campo]: valor,
      pagina: 0,
    }))
  }

  const limpiarFiltros = () => {
    setFiltros({
      pagina: 0,
      tamaño: 10,
      idProveedor: null,
      fechaInicio: null,
      fechaFin: null,
      idUsuario: null,
    })
  }

  const cambiarPagina = (nuevaPagina: number) => {
    setFiltros((prev) => ({
      ...prev,
      pagina: nuevaPagina,
    }))
  }

  const cambiarTamanoPagina = (nuevoTamano: number) => {
    setFiltros((prev) => ({
      ...prev,
      tamaño: nuevoTamano,
      pagina: 0,
    }))
  }

  const abrirModalDetalles = (compra: Compra) => {
    setCompraSeleccionada(compra)
    setModalDetallesAbierto(true)
  }

  const abrirModalNuevo = () => {
    setCompraParaEditar(null)
    setModalGestionarAbierto(true)
  }

  const abrirModalEditar = (compra: Compra) => {
    setCompraParaEditar(compra)
    setModalGestionarAbierto(true)
  }

  const refrescarDatos = () => {
    cargarCompras()
  }

  const cerrarModales = () => {
    setModalGestionarAbierto(false)
    setModalDetallesAbierto(false)
    setCompraSeleccionada(null)
    setCompraParaEditar(null)
  }

  const handleToggleEstado = async (idCompra: number): Promise<void> => {
    try {
      await toggleEstadoPagoCompra(idCompra)
      toast.info("Se modificó el estado de la compra")

      await cargarCompras()
    } catch (error) {
      toast.error("Error al cambiar el estado de la compra")
    }
  }

  return (
    <div className="p-6 min-h-screen">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <ShoppingCart className="text-azul" size={28} />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Compras</h1>
            <p className="text-sm sm:text-base text-gray-600">Gestiona y controla las compras a proveedores</p>
          </div>
        </div>
        <button
          onClick={abrirModalNuevo}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-azul text-white rounded-md font-semibold hover:bg-azul-dark shadow-md transition-all active:scale-95 text-sm sm:text-base w-full sm:w-auto"
        >
          <Plus size={20} />
          <span>Nueva Compra</span>
        </button>
      </div>

      {/* Panel de Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 items-end">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Fecha de Inicio</label>
            <div className="relative">
              <DatePicker
                selected={filtros.fechaInicio}
                onChange={(date) => manejarCambioFiltro("fechaInicio", date)}
                locale="es"
                dateFormat="dd/MM/yyyy"
                placeholderText="Seleccionar fecha"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Fecha de Fin</label>
            <div className="relative">
              <DatePicker
                selected={filtros.fechaFin}
                onChange={(date) => manejarCambioFiltro("fechaFin", date)}
                locale="es"
                dateFormat="dd/MM/yyyy"
                placeholderText="Seleccionar fecha"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Proveedor</label>
            <select
              value={filtros.idProveedor || ""}
              onChange={(e) => manejarCambioFiltro("idProveedor", e.target.value ? Number(e.target.value) : null)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all appearance-none"
            >
              <option value="">Todos los proveedores</option>
              {proveedores.map((proveedor) => (
                <option key={proveedor.idProveedor} value={proveedor.idProveedor}>
                  {proveedor.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Usuario</label>
            <select
              value={filtros.idUsuario || ""}
              onChange={(e) => manejarCambioFiltro("idUsuario", e.target.value ? Number(e.target.value) : null)}
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
            className="p-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center justify-center group w-full lg:w-fit shadow-sm"
            title="Limpiar filtros"
          >
            <BrushCleaning size={20} className="group-hover:rotate-12 transition-transform mr-2 lg:mr-0" />
            <span className="lg:hidden font-semibold">Limpiar</span>
          </button>
        </div>
      </div>

      {/* Tabla de Compras */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {error && <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700">{error}</div>}

        {cargando ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-azul/20 border-t-azul mb-4"></div>
            <div className="text-gray-500 font-medium">Cargando compras...</div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginaDeCompras?.content.map((compra) => (
                    <tr key={compra.idCompra} className="hover:bg-azul/5 transition-colors group">
                      <td className="px-6 py-4 text-gray-500 font-mono text-xs">{compra.idCompra}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {typeof compra.proveedor === "object" ? (compra.proveedor as any).nombre : compra.proveedor}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        {formatCurrency(compra.total)}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {typeof compra.usuario === "object" ? (compra.usuario as any).nombre : compra.usuario}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900 font-medium">{formatearFecha(compra.fechaHora)}</div>
                        <div className="text-gray-400 text-xs">{formatearHora(compra.fechaHora)}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleEstado(compra.idCompra)}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold transition-all ${compra.estadoCompra === "PAGADO"
                            ? "bg-green-100 text-green-700 border border-green-200 hover:bg-green-200"
                            : "bg-yellow-100 text-yellow-700 border border-yellow-200 hover:bg-yellow-200"
                            }`}
                        >
                          {compra.estadoCompra}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center items-center space-x-2">
                          <button
                            onClick={() => abrirModalEditar(compra)}
                            className="p-1.5 text-gray-800 hover:text-black transition-colors rounded-lg"
                            title="Editar compra"
                          >
                            <Pencil size={18} />
                          </button>

                          <button
                            onClick={() => abrirModalDetalles(compra)}
                            className="p-1.5 text-gray-800 hover:text-black transition-colors rounded-lg"
                            title="Ver detalles"
                          >
                            <Eye size={18} />
                          </button>

                          <button
                            onClick={() => handleDescargar(compra.idCompra)}
                            className="p-1.5 text-gray-800 hover:text-black transition-colors rounded-lg"
                            title="Descargar Comprobante"
                          >
                            <Printer size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {paginaDeCompras && (
              <div className="bg-white px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <p className="text-sm text-gray-500">
                    Mostrando <span className="font-bold text-gray-900">{paginaDeCompras.number * paginaDeCompras.size + 1}</span> a{" "}
                    <span className="font-bold text-gray-900">
                      {Math.min((paginaDeCompras.number + 1) * paginaDeCompras.size, paginaDeCompras.totalElements)}
                    </span> de <span className="font-bold text-gray-900">{paginaDeCompras.totalElements}</span> resultados
                  </p>
                  <select
                    value={filtros.tamaño}
                    onChange={(e) => cambiarTamanoPagina(Number.parseInt(e.target.value))}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-azul/20"
                  >
                    <option value={10}>10 por página</option>
                    <option value={25}>25 por página</option>
                    <option value={50}>50 por página</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => cambiarPagina(paginaDeCompras.number - 1)}
                    disabled={paginaDeCompras.number === 0}
                    className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-gray-50 transition-colors border border-gray-100"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="px-4 py-1.5 bg-azul/5 text-azul text-sm font-bold rounded-lg border border-azul/10">
                    Página {paginaDeCompras.number + 1} de {paginaDeCompras.totalPages}
                  </div>
                  <button
                    onClick={() => cambiarPagina(paginaDeCompras.number + 1)}
                    disabled={paginaDeCompras.number >= paginaDeCompras.totalPages - 1}
                    className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-gray-50 transition-colors border border-gray-100"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}

            {paginaDeCompras?.content.length === 0 && (
              <div className="text-center py-16">
                <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="text-gray-300" size={40} />
                </div>
                <h3 className="text-gray-900 font-bold text-lg">No se encontraron compras</h3>
                <p className="text-gray-500">Intenta cambiar los filtros de búsqueda o registra una nueva compra.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modales */}
      <ModalGestionarCompra
        isOpen={modalGestionarAbierto}
        onClose={cerrarModales}
        onSuccess={refrescarDatos}
        compraParaEditar={compraParaEditar}
      />

      <ModalDetallesCompra isOpen={modalDetallesAbierto} onClose={cerrarModales} compra={compraSeleccionada} />
    </div>
  )
}

export default PaginaCompras
