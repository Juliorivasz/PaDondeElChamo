"use client"

import React, { useState, useEffect } from "react"
import type { Categoria, CrearCategoriaDTO, ModificarCategoriaDTO, CategoriaArbol } from "../types/dto/Categoria"
import { obtenerCategorias, crearCategoria, modificarCategoria, cambiarEstadoCategoria } from "../api/categoriaApi"
import { obtenerConfiguracion } from "../api/configuracionApi"
import type { ConfiguracionDTO } from "../types/dto/Configuracion"
import { construirArbolCategorias } from "../utils/categoriaUtils"
import { ModalNuevaCategoria } from "../components/categorias/ModalNuevaCategoria"
import { ModalEditarCategoria } from "../components/categorias/ModalEditarCategoria"
import { ModalDetallesCategoria } from "../components/categorias/ModalDetallesCategoria"
import { Eye, Pencil, Tag, Plus, BrushCleaning, CornerDownRight } from "lucide-react"
import { useCategoriaStore } from "../store/categoriaStore"
import { toast } from "react-toastify"
import { PanelFiltrosColapsable } from "../components/PanelFiltrosColapsable"

type FiltroEstado = "todas" | "activas" | "inactivas"

const PaginaCategorias: React.FC = () => {
  // Estados principales
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [configuracion, setConfiguracion] = useState<ConfiguracionDTO | null>(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { refrescarCategorias } = useCategoriaStore();

  // Estados de filtros
  const [filtroNombre, setFiltroNombre] = useState("")
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todas")

  // Estados de modales
  const [modalNueva, setModalNueva] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const [modalDetalles, setModalDetalles] = useState(false)
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<Categoria | null>(null)

  // Estado de expansión de categorías
  const [categoriasExpandidas, setCategoriasExpandidas] = useState<Record<string, boolean>>({})

  // Cargar categorías y configuración al montar el componente
  useEffect(() => {
    cargarCategorias()
    cargarConfiguracion()
  }, [])

  const cargarConfiguracion = async () => {
    try {
      const config = await obtenerConfiguracion()
      setConfiguracion(config)
    } catch (err) {
      console.error('Error al cargar configuración', err)
    }
  }

  // Transformar a árbol cuando cambian las categorías
  useEffect(() => {
    // Expandir todas las categorías por defecto
    const expandidas: Record<string, boolean> = {}
    categorias.forEach((cat) => {
      expandidas[cat.idCategoria] = true
    })
    setCategoriasExpandidas(expandidas)
  }, [categorias])

  const cargarCategorias = async () => {
    try {
      setCargando(true)
      setError(null)
      const data = await obtenerCategorias()
      setCategorias(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setCargando(false)
    }
  }

  const handleCrearCategoria = async (data: CrearCategoriaDTO) => {
    try {
      setGuardando(true)
      await crearCategoria(data)
      toast.success("Categoría creada con éxito")

      await refrescarCategorias();
      setModalNueva(false)
      await cargarCategorias()
    } catch (error: any) {
      if (error.response && error.response.data) {
        toast.error(error.response.data);
      } else {
        toast.error("No fue posible crear la categoría")
      }
    } finally {
      setGuardando(false)
    }
  }

  const handleModificarCategoria = async (id: string, data: ModificarCategoriaDTO) => {
    try {
      setGuardando(true)
      await modificarCategoria(id, data)
      toast.success("Categoría modificada con éxito")

      await refrescarCategorias();
      setModalEditar(false)
      setCategoriaSeleccionada(null)
      await cargarCategorias()
    } catch (error: any) {
      if (error.response && error.response.data) {
        toast.error(error.response.data);
      } else {
        toast.error("No fue posible modificar la categoría")
      }
    } finally {
      setGuardando(false)
    }
  }

  const handleCambiarEstado = async (id: string) => {
    try {
      setGuardando(true)
      await cambiarEstadoCategoria(id)
      await cargarCategorias()
      toast.success("Estado actualizado")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cambiar estado")
      toast.error("Error al cambiar estado")
    } finally {
      setGuardando(false)
    }
  }

  const handleToggleDescuento = async (id: string, nuevoValor: boolean) => {
    try {
      setGuardando(true)
      await modificarCategoria(id, { aplicaDescuentoAutomatico: nuevoValor })
      await refrescarCategorias()
      await cargarCategorias()
      toast.success(`Descuento automático ${nuevoValor ? 'activado' : 'desactivado'}`)
    } catch (error: any) {
      if (error.response && error.response.data) {
        toast.error(error.response.data)
      } else {
        toast.error('Error al actualizar descuento')
      }
    } finally {
      setGuardando(false)
    }
  }

  // Filtrar categorías
  const categoriasFiltradas = categorias.filter((categoria) => {
    const cumpleNombre = categoria.nombre.toLowerCase().includes(filtroNombre.toLowerCase())
    const cumpleEstado =
      filtroEstado === "todas" ||
      (filtroEstado === "activas" && categoria.estado) ||
      (filtroEstado === "inactivas" && !categoria.estado)

    return cumpleNombre && cumpleEstado
  })

  // Renderizar fila de categoría recursivamente
  const renderizarCategoria = (categoria: CategoriaArbol): React.ReactNode => {
    const tieneHijos = categoria.hijos.length > 0
    const estaExpandida = categoriasExpandidas[categoria.idCategoria]

    return (
      <React.Fragment key={categoria.idCategoria}>
        <tr 
          onClick={() => {
            setCategoriaSeleccionada(categoria)
            setModalDetalles(true)
          }}
          className="group hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <td className="px-6 py-4 text-gray-500 font-mono text-xs">{categoria.idCategoria}</td>

          <td className="px-6 py-4" style={{ paddingLeft: `${24 + categoria.nivel * 24}px` }}>
            {categoria.idCategoriaPadre != null && (
              <div className="flex items-center gap-2">
                <CornerDownRight size={14} className="text-azul/40" />
                <span className="font-semibold text-gray-900">{categoria.nombre}</span>
              </div>
            )}
            {categoria.idCategoriaPadre == null && (
              <div className="flex items-center">
                <span className="font-bold text-gray-900">{categoria.nombre}</span>
              </div>
            )}
          </td>
          <td className={`px-6 py-4 max-w-xs truncate ${!categoria.descripcion
            ? 'text-gray-400 italic'
            : 'text-gray-600'
            }`}>
            {categoria.descripcion || "Sin descripción"}
          </td>
          <td className="px-6 py-4 text-center">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {categoria.productos?.length || 0}
            </span>
          </td>
          <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => handleToggleDescuento(categoria.idCategoria, !categoria.aplicaDescuentoAutomatico)}
              disabled={!configuracion?.descuentoAutomatico}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                !configuracion?.descuentoAutomatico
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : categoria.aplicaDescuentoAutomatico
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={
                !configuracion?.descuentoAutomatico
                  ? 'Descuento automático desactivado en configuración'
                  : categoria.aplicaDescuentoAutomatico
                  ? 'Desactivar descuento automático'
                  : 'Activar descuento automático'
              }
            >
              {categoria.aplicaDescuentoAutomatico ? 'Activo' : 'Inactivo'}
            </button>
          </td>
          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => {
                  setCategoriaSeleccionada(categoria)
                  setModalDetalles(true)
                }}
                className="p-1.5 text-gray-800 hover:text-black transition-colors rounded-lg"
                title="Ver detalles"
              >
                <Eye size={18} />
              </button>

              <button
                onClick={() => {
                  setCategoriaSeleccionada(categoria)
                  setModalEditar(true)
                }}
                className="p-1.5 text-gray-800 hover:text-black transition-colors rounded-lg"
                title="Editar"
              >
                <Pencil size={18} />
              </button>

              <button
                onClick={() => handleCambiarEstado(categoria.idCategoria)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${categoria.estado
                  ? "bg-toggleOn focus:ring-toggleOn"
                  : "bg-toggleOff focus:ring-toggleOff"
                  }`}
                title={categoria.estado ? "Desactivar" : "Activar"}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${categoria.estado ? "translate-x-6" : "translate-x-1"
                    }`}
                />
              </button>
            </div>
          </td>
        </tr>
        {tieneHijos && estaExpandida && categoria.hijos.map((hijo) => renderizarCategoria(hijo))}
      </React.Fragment>
    )
  }

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Cargando categorías...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Tag className="text-azul" size={28} />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Categorías</h1>
            <p className="text-sm sm:text-base text-gray-600">Organiza y gestiona el catálogo de productos</p>
          </div>
        </div>
        <button
          onClick={() => setModalNueva(true)}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-azul text-white rounded-md font-semibold hover:bg-azul-dark shadow-md transition-all active:scale-95 text-sm sm:text-base w-full sm:w-auto"
        >
          <Plus size={20} />
          <span>Nueva Categoría</span>
        </button>
      </div>

      {/* Panel de Filtros */}
      <PanelFiltrosColapsable titulo="Filtros de Búsqueda" defaultOpen={false}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-end">
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Búsqueda rápida</label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
                placeholder="Nombre de la categoría..."
                className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all appearance-none"
            >
              <option value="todas">Todos los estados</option>
              <option value="activas">Solo Activas</option>
              <option value="inactivas">Solo Inactivas</option>
            </select>
          </div>

          <button
            onClick={() => {
              setFiltroNombre("")
              setFiltroEstado("todas")
            }}
            className="p-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center justify-center group w-full lg:w-fit shadow-sm h-[45px] mt-auto"
            title="Limpiar filtros"
          >
            <BrushCleaning size={20} className="group-hover:rotate-12 transition-transform mr-2 lg:mr-0" />
            <span className="lg:hidden font-semibold">Limpiar Filtros</span>
          </button>
        </div>
      </PanelFiltrosColapsable>

      {/* Mensaje de Error */}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      {/* Tabla de Categorías */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cant. Productos
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descuento Auto
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {construirArbolCategorias(categoriasFiltradas).map((categoria) => renderizarCategoria(categoria))}
            </tbody>
          </table>
        </div>

        {categoriasFiltradas.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="text-gray-300" size={32} />
            </div>
            <h3 className="text-gray-900 font-medium">No se encontraron categorías</h3>
            <p className="text-gray-500 text-sm">Intenta ajustar los filtros de búsqueda</p>
          </div>
        )}
      </div>

      {/* Modales */}
      <ModalNuevaCategoria
        isOpen={modalNueva}
        onClose={() => setModalNueva(false)}
        onConfirmar={handleCrearCategoria}
      />

      <ModalEditarCategoria
        isOpen={modalEditar}
        onClose={() => {
          setModalEditar(false)
          setCategoriaSeleccionada(null)
        }}
        onConfirmar={handleModificarCategoria}
        categoria={categoriaSeleccionada}
      />

      <ModalDetallesCategoria
        isOpen={modalDetalles}
        onClose={() => {
          setModalDetalles(false)
          setCategoriaSeleccionada(null)
        }}
        categoria={categoriaSeleccionada}
      />

      {/* Loading Overlay */}
      {guardando && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-blue-100 border-t-azul rounded-full animate-spin"></div>
            <p className="text-gray-700 font-semibold">Guardando cambios...</p>
          </div>
        </div>
      )}
    </div >
  )
}

export default PaginaCategorias;