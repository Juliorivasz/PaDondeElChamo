"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Package, Plus, Eye, Pencil, ChevronLeft, ChevronRight, AlertTriangle, BrushCleaning, Settings, BadgeCheck, Printer, ImageOff } from "lucide-react"
import type { PaginaDeProductos, ProductoAbm, MarcaLista, ProveedorLista } from "../types/dto/Producto"
import { obtenerProductos, cambiarEstadoProducto } from "../api/productoApi"
import { useCategoriaStore } from "../store/categoriaStore"
import { SelectJerarquico } from "../components/SelectJerarquico"
import { obtenerListaMarcas } from "../api/marcaApi"
import { obtenerListaProveedores } from "../api/proveedorApi"
import { ModalNuevoProducto } from "../components/productos/ModalNuevoProducto"
import { ModalEditarProducto } from "../components/productos/ModalEditarProducto"
import { ModalDetallesProducto } from "../components/productos/ModalDetallesProducto"
import { formatCurrency } from "../utils/numberFormatUtils"
import { useAutenticacionStore } from "../store/autenticacionStore"

import { ModalGestionarMarcas } from "../components/marcas/ModalGestionarMarcas"
import { ModalImagenPreview } from "../components/ModalImagenPreview"
import { toast } from "react-toastify"

export const PaginaProductos: React.FC = () => {
  const rol = useAutenticacionStore((state) => state.rol);
  const esAdmin = rol === 'ADMIN';

  const [datosProductos, setDatosProductos] = useState<PaginaDeProductos | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados para los filtros
  const [filtros, setFiltros] = useState({
    nombre: "",
    idCategoria: 0,
    idMarca: 0,
    idProveedor: 0,
    bajoStock: false,
    page: 0,
    size: 25,
  })

  // Estados para las listas de los select
  const [marcas, setMarcas] = useState<MarcaLista[]>([])
  const [proveedores, setProveedores] = useState<ProveedorLista[]>([])

  const categoriasArbol = useCategoriaStore((state) => state.categoriasArbol);
  const cargarCategorias = useCategoriaStore((state) => state.cargarCategorias);

  // Estados para los modales
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false)
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false)
  const [modalDetallesAbierto, setModalDetallesAbierto] = useState(false)

  const [modalMarcasAbierto, setModalMarcasAbierto] = useState(false)
  const [modalImagenAbierto, setModalImagenAbierto] = useState(false)
  const [imagenSeleccionada, setImagenSeleccionada] = useState<{ url: string; nombre: string } | null>(null)
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoAbm | null>(null)

  // Cargar productos cada vez que cambien los filtros
  useEffect(() => {
    cargarProductos()
  }, [
    filtros.nombre,
    filtros.idCategoria,
    filtros.idMarca,
    filtros.idProveedor,
    filtros.bajoStock,
    filtros.page,
    filtros.size
  ]);

  useEffect(() => {
    const cargarDatosSelect = async (): Promise<void> => {
      try {
        await cargarCategorias()

        const [marcasData, proveedoresData] = await Promise.all([obtenerListaMarcas(), obtenerListaProveedores()])
        setMarcas(marcasData)
        setProveedores(proveedoresData)
      } catch (error) {
        console.error("Error al cargar datos de los select:", error)
      }
    }

    cargarDatosSelect()
  }, []) // Removido cargarCategorias de las dependencias para evitar bucle infinito

  const cargarProductos = async (): Promise<void> => {
    setCargando(true)
    setError(null)

    try {
      const datos = await obtenerProductos(filtros)
      setDatosProductos(datos)
    } catch (error) {
      console.error("No fue posible cargar los productos")
    } finally {
      setCargando(false)
    }
  }

  const manejarCambioFiltro = (campo: string, valor: string | number | boolean): void => {
    setFiltros((prev) => ({
      ...prev,
      [campo]: valor,
      page: 0,
    }))
  }

  const limpiarFiltros = (): void => {
    setFiltros({
      nombre: "",
      idCategoria: 0,
      idMarca: 0,
      idProveedor: 0,
      bajoStock: false,
      page: 0,
      size: 10,
    })
  }

  const manejarCambioPagina = (nuevaPagina: number): void => {
    setFiltros((prev) => ({
      ...prev,
      page: nuevaPagina,
    }))
  }

  const manejarCambioTamano = (nuevoTamano: number): void => {
    setFiltros((prev) => ({
      ...prev,
      size: nuevoTamano,
      page: 0,
    }))
  }

  const manejarCambiarEstado = async (id: number): Promise<void> => {
    try {
      await cambiarEstadoProducto(id)
      cargarProductos()
    } catch (error) {
      console.error("Error al cambiar estado:", error)
    }
  }

  const abrirModalEditar = (producto: ProductoAbm): void => {
    setProductoSeleccionado(producto)
    setModalEditarAbierto(true)
  }

  const abrirModalDetalles = (producto: ProductoAbm): void => {
    setProductoSeleccionado(producto)
    setModalDetallesAbierto(true)
  }



  const cerrarModales = (): void => {
    setModalNuevoAbierto(false)
    setModalEditarAbierto(false)
    setModalDetallesAbierto(false)

    setModalMarcasAbierto(false)
    setProductoSeleccionado(null)
  }

  const confirmarAccion = (): void => {
    cerrarModales()
    cargarProductos()
  }

  const recargarDatosSelect = async (): Promise<void> => {
    try {
      const [marcasData, proveedoresData] = await Promise.all([obtenerListaMarcas(), obtenerListaProveedores()])
      setMarcas(marcasData)
      setProveedores(proveedoresData)
    } catch (error) {
      console.error("Error al cargar datos de los select:", error)
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={cargarProductos} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
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
          <Package className="text-azul" size={32} />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Productos</h1>
            <p className="text-sm md:text-base text-gray-600">Gestiona las productos del negocio</p>
          </div>
        </div>

        {esAdmin && (
          <button
            onClick={() => setModalNuevoAbierto(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-azul text-white rounded-md hover:bg-azul-dark w-full sm:w-auto"
          >
            <Plus size={20} />
            <span>Nuevo Producto</span>
          </button>
        )}
      </div>


      {/* Panel de Filtros */}
      <div className="bg-white rounded-lg shadow-sm border-gray-200 p-5 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Buscar por nombre</label>
            <input
              type="text"
              value={filtros.nombre}
              onChange={(e) => manejarCambioFiltro("nombre", e.target.value)}
              placeholder="Escribir nombre..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Categoría</label>
            <SelectJerarquico
              opciones={categoriasArbol}
              selectedValue={filtros.idCategoria === 0 ? null : filtros.idCategoria}
              onSelect={(id) => manejarCambioFiltro("idCategoria", id ?? 0)}
              idKey="idCategoria"
              placeholder="Todas las categorías"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Marca</label>
            <select
              value={filtros.idMarca}
              onChange={(e) => manejarCambioFiltro("idMarca", Number.parseInt(e.target.value))}
              className="w-full h-[45px] px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all"
            >
              <option value={0}>Todas</option>
              {marcas.map((marca) => (
                <option key={marca.idMarca} value={marca.idMarca}>
                  {marca.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Proveedor</label>
            <select
              value={filtros.idProveedor}
              onChange={(e) => manejarCambioFiltro("idProveedor", Number.parseInt(e.target.value))}
              className="w-full h-[45px] px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all"
            >
              <option value={0}>Todos</option>
              {proveedores.map((proveedor) => (
                <option key={proveedor.idProveedor} value={proveedor.idProveedor}>
                  {proveedor.nombre}
                </option>
              ))}
            </select>
          </div>
          {esAdmin && (
            <div className="flex items-end mb-1">
              <button
                onClick={() => manejarCambioFiltro("bajoStock", !filtros.bajoStock)}
                className={`w-full mt-5 h-[45px] flex items-center justify-center border px-4 py-2 rounded-lg text-sm font-semibold tracking-wider transition-all shadow-sm ${filtros.bajoStock
                  ? "bg-amber-100 text-amber-800 border-amber-400"
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
              >
                <AlertTriangle size={16} className="mr-2" />
                Bajo Stock
              </button>
            </div>
          )}

          <button
            onClick={limpiarFiltros}
            className="p-2.5 mt-5 h-[45px] bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center justify-center group w-full lg:w-fit shadow-sm"
            title="Limpiar filtros"
          >
            <BrushCleaning size={20} className="group-hover:rotate-12 transition-transform mr-2 lg:mr-0" />
            <span className="lg:hidden font-semibold">Limpiar</span>
          </button>
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {cargando ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando productos...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Imagen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    {esAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                    )}
                    <th className="flex px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marca
                      {esAdmin && (
                        <button
                          onClick={() => setModalMarcasAbierto(true)}
                          className="pl-2 text-gray-800 hover:text-black transition-colors hover:bg-gray-50 bg-transparent border-none cursor-pointer"
                          title="Administrar Marcas"
                        >
                          <Settings size={14} />
                        </button>
                      )}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {datosProductos?.content.map((producto) => (
                    <tr key={producto.idProducto} className="hover:bg-opacity-80">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{producto.idProducto}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {producto.imagenUrl ? (
                          <img
                            src={producto.imagenUrl}
                            alt={producto.nombre}
                            className="w-12 h-12 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-75 transition-opacity"
                            onClick={() => {
                              setImagenSeleccionada({ url: producto.imagenUrl!, nombre: producto.nombre })
                              setModalImagenAbierto(true)
                            }}
                            title="Click para ver imagen completa"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                            <ImageOff size={20} className="text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{producto.nombre}</div>
                        <div className="text-sm text-gray-500">{producto.categoria}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-semibold">{formatCurrency(producto.precio)}</div>
                      </td>

                      {esAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span
                            className={`inline-flex items-center px-3 py-1 text-sm font-bold rounded-full ${producto.stock <= producto.stockMinimo
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                              }`}
                          >
                            {producto.stock <= producto.stockMinimo ? (
                              <AlertTriangle size={16} className="mr-1.5" />
                            ) : (
                              <BadgeCheck size={16} className="mr-1.5" />
                            )}
                            {producto.stock}
                          </span>
                        </td>
                      )}
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${!producto.marca
                        ? 'text-gray-400 italic'
                        : 'text-gray-900'
                        }`}>
                        {producto.marca || "Sin Marca"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => abrirModalDetalles(producto)}
                            className="text-gray-800 hover:text-black transition-colors"
                            title="Ver detalles"
                          >
                            <Eye size={18} />
                          </button>
                          {esAdmin && (
                            <button onClick={() => abrirModalEditar(producto)} className="text-gray-800 hover:text-black transition-colors" title="Editar">
                              <Pencil size={18} />
                            </button>
                          )}

                          <button
                            onClick={() => toast.warning("Esta función no se encuentra disponible")}
                            className="text-gray-800 hover:text-black transition-colors"
                            title="Imprimir códigos de barras"
                          >
                            <Printer size={18} />
                          </button>

                          <button
                            onClick={() => manejarCambiarEstado(producto.idProducto)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${producto.estado ? "bg-toggleOn focus:ring-toggleOn" : "bg-toggleOff focus:ring-toggleOff"
                              }`}
                            title={producto.estado ? "Desactivar" : "Activar"}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${producto.estado ? "translate-x-6" : "translate-x-1"
                                }`}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {datosProductos && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => manejarCambioPagina(datosProductos.number - 1)}
                    disabled={datosProductos.number === 0}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => manejarCambioPagina(datosProductos.number + 1)}
                    disabled={datosProductos.number >= datosProductos.totalPages - 1}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-4">
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{datosProductos.number * datosProductos.size + 1}</span> a{" "}
                      <span className="font-medium">
                        {Math.min((datosProductos.number + 1) * datosProductos.size, datosProductos.totalElements)}
                      </span>{" "}
                      de <span className="font-medium">{datosProductos.totalElements}</span> resultados
                    </p>
                    <select
                      value={filtros.size}
                      onChange={(e) => manejarCambioTamano(Number.parseInt(e.target.value))}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                    >
                      <option value={10}>10 por página</option>
                      <option value={25}>25 por página</option>
                      <option value={50}>50 por página</option>
                    </select>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => manejarCambioPagina(datosProductos.number - 1)}
                        disabled={datosProductos.number === 0}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronLeft size={20} />
                      </button>

                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        Página {datosProductos.number + 1} de {datosProductos.totalPages}
                      </span>

                      <button
                        onClick={() => manejarCambioPagina(datosProductos.number + 1)}
                        disabled={datosProductos.number >= datosProductos.totalPages - 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modales */}
      <ModalNuevoProducto isOpen={modalNuevoAbierto} onClose={cerrarModales} alConfirmar={confirmarAccion} />

      <ModalEditarProducto
        isOpen={modalEditarAbierto}
        producto={productoSeleccionado}
        onClose={cerrarModales}
        alConfirmar={confirmarAccion}
      />

      <ModalDetallesProducto
        isOpen={modalDetallesAbierto}
        producto={productoSeleccionado}
        onClose={cerrarModales}
      />

      <ModalImagenPreview
        isOpen={modalImagenAbierto}
        imageUrl={imagenSeleccionada?.url || ""}
        imageName={imagenSeleccionada?.nombre || ""}
        onClose={() => setModalImagenAbierto(false)}
      />

      <ModalGestionarMarcas
        isOpen={modalMarcasAbierto}
        onClose={() => setModalMarcasAbierto(false)}
        onDataChange={recargarDatosSelect}
      />
    </div>
  )
}
