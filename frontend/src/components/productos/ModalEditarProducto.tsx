"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X } from "lucide-react"
import type { ProductoDTO, ProductoAbm, MarcaLista, ProveedorLista } from "../../types/dto/Producto"
import { modificarProducto } from "../../api/productoApi"
import { useCategoriaStore } from "../../store/categoriaStore"
import { obtenerListaMarcas } from "../../api/marcaApi"
import { obtenerListaProveedores } from "../../api/proveedorApi"
import { SelectJerarquico } from "../SelectJerarquico"
import { ModalNuevaMarcaRapida } from "../marcas/ModalNuevaMarcaRapida"
import { InputMoneda } from "../InputMoneda"
import { ImageUpload } from "../ImageUpload"
import { useUploadImage } from "../../hooks/useUploadImage"
import { useEscapeKey } from "../../hooks/useEscapeKey"
import { toast } from "react-toastify"

interface Props {
  isOpen: boolean
  producto: ProductoAbm | null
  onClose: () => void
  alConfirmar: () => void
}

export const ModalEditarProducto: React.FC<Props> = ({ isOpen, producto, onClose, alConfirmar }) => {
  const [cargando, setCargando] = useState(false)
  const { uploadImage } = useUploadImage()

  // Obtiene las categorías del store de Zustand
  const { categoriasArbol, cargarCategorias } = useCategoriaStore()

  const [marcas, setMarcas] = useState<MarcaLista[]>([])
  const [proveedores, setProveedores] = useState<ProveedorLista[]>([])
  const [formulario, setFormulario] = useState<ProductoDTO>({
    nombre: "",
    codigoDeBarras: "",
    precio: 0,
    costo: 0,
    stock: 0,
    idMarca: 0,
    idCategoria: 0,
    idProveedor: 0,
    imagenUrl: null,
  })

  const [modalMarcaRapidaAbierto, setModalMarcaRapidaAbierto] = useState(false)

  // Carga los datos de los selects y rellena el formulario cuando el modal se abre
  useEffect(() => {
    const inicializarModal = async () => {
      if (isOpen && producto) {
        try {
          // Carga los datos de los selects
          await cargarCategorias()
          const [marcasData, proveedoresData] = await Promise.all([obtenerListaMarcas(), obtenerListaProveedores()])
          setMarcas(marcasData)
          setProveedores(proveedoresData)

          // Rellena el formulario con los datos del producto
          setFormulario({
            nombre: producto.nombre,
            codigoDeBarras: producto.codigoDeBarras,
            precio: producto.precio,
            costo: producto.costo,
            stock: producto.stock,
            idMarca: marcasData.find((m) => m.nombre === producto.marca)?.idMarca ?? 0,
            idCategoria: producto.idCategoria, // <-- Obtenido directamente
            idProveedor: proveedoresData.find((p) => p.nombre === producto.proveedor)?.idProveedor ?? 0,
            imagenUrl: (producto as any).imagenUrl || null,
          })
        } catch (error) {
          console.error("Error al inicializar modal de edición:", error)
        }
      }
    }
    inicializarModal()
  }, [isOpen, producto])

  const manejarCambio = (campo: keyof ProductoDTO, valor: string | number | null): void => {
    setFormulario((prev) => ({
      ...prev,
      [campo]: valor,
    }))
  }

  const handleNuevaMarcaSuccess = (nuevaMarca: MarcaLista) => {
    // 1. Reload marca list - we need to create this function
    cargarDatosSelect()
    // 2. Auto-select the new marca in the form
    setFormulario((prev) => ({ ...prev, idMarca: nuevaMarca.idMarca }))
  }

  const cargarDatosSelect = async (): Promise<void> => {
    try {
      const [marcasData, proveedoresData] = await Promise.all([obtenerListaMarcas(), obtenerListaProveedores()])
      setMarcas(marcasData)
      setProveedores(proveedoresData)
    } catch (error) {
      console.error("Error al cargar datos de los select:", error)
    }
  }

  const manejarEnvio = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!producto) return

    setCargando(true)
    try {
      let imagenUrl = formulario.imagenUrl

      // If imagenUrl is a File, upload it to Cloudinary first
      if (formulario.imagenUrl instanceof File) {
        const response = await uploadImage(formulario.imagenUrl)
        imagenUrl = response.url
      }

      // Clean payload: convert 0 to null for optional fields
      const payload = {
        ...formulario,
        imagenUrl: typeof imagenUrl === 'string' ? imagenUrl : null,
        idMarca: formulario.idMarca === 0 ? null : formulario.idMarca,
        // Ensure numbers are numbers
        precio: Number(formulario.precio),
        costo: Number(formulario.costo),
        stock: Number(formulario.stock),
        idCategoria: Number(formulario.idCategoria),
        idProveedor: Number(formulario.idProveedor),
      } as any; // Cast to any to avoid strict type check on null idMarca if interface forbids it

      await modificarProducto(producto.idProducto, payload)
      toast.success("Producto modificado con éxito!")
      alConfirmar()
    } catch (error: any) {
      console.error("Error al modificar producto:", error);
      if (error.response && error.response.data) {
        const data = error.response.data;
        if (Array.isArray(data.message)) {
           // NestJS validation error array
           toast.error(data.message.join(", "));
        } else if (typeof data.message === 'string') {
           toast.error(data.message);
        } else if (typeof data === 'string') {
           toast.error(data);
        } else {
           toast.error("Error de validación");
        }
      } else {
        toast.error("No fue posible modificar el producto");
      }
    } finally {
      setCargando(false)
    }
  }

  useEscapeKey(onClose, isOpen);

  if (!isOpen || !producto) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-[95%] sm:w-full max-w-[600px] max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Editar Producto</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={manejarEnvio} className="space-y-4">
          {/* ... otros campos del formulario (nombre, precio, etc.) ... */}
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                value={formulario.nombre}
                onChange={(e) => manejarCambio("nombre", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
              <SelectJerarquico
                opciones={categoriasArbol}
                selectedValue={formulario.idCategoria === 0 ? null : formulario.idCategoria}
                onSelect={(id) => manejarCambio("idCategoria", id ?? 0)}
                idKey="idCategoria"
                placeholder="Seleccionar categoría"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código de Barras</label>
            <input
              type="text"
              value={formulario.codigoDeBarras}
              onChange={(e) => manejarCambio("codigoDeBarras", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingrese el código de barras"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
              <InputMoneda
                value={formulario.precio}
                onValueChange={(nuevoValor) => manejarCambio("precio", nuevoValor || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="$ 0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo *</label>
              <InputMoneda
                value={formulario.costo}
                onValueChange={(nuevoValor) => manejarCambio("costo", nuevoValor || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="$ 0"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
              <input
                type="number"
                value={formulario.stock}
                min="0"
                onChange={(e) => manejarCambio("stock", Number.parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Image Upload */}
          <ImageUpload
            value={formulario.imagenUrl || null}
            onChange={(url) => manejarCambio("imagenUrl", url)}
          />


          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marca *</label>
            <div className="flex gap-2">
              <select
                value={formulario.idMarca}
                onChange={(e) => manejarCambio("idMarca", Number.parseInt(e.target.value))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value={0}>Seleccionar marca</option>
                {marcas.map((marca) => (
                  <option key={marca.idMarca} value={marca.idMarca}>
                    {marca.nombre}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setModalMarcaRapidaAbierto(true)}
                className="px-3 py-2 bg-white text-gray-800 rounded-md hover:underline text-sm whitespace-nowrap"
                title="Añadir nueva marca"
              >
                <span>Nueva Marca</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor *</label>
            <select
              value={formulario.idProveedor}
              onChange={(e) => manejarCambio("idProveedor", Number.parseInt(e.target.value))}
              className="w-[300px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value={0}>Seleccionar proveedor</option>
              {proveedores.map((proveedor) => (
                <option key={proveedor.idProveedor} value={proveedor.idProveedor}>
                  {proveedor.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg transition-colors order-2 sm:order-1 text-sm shadow-sm border border-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="px-6 py-2.5 bg-azul text-white font-semibold rounded-lg hover:bg-azul-dark transition-all shadow-md active:scale-95 order-1 sm:order-2 text-sm disabled:opacity-50"
            >
              {cargando ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>

        <ModalNuevaMarcaRapida
          isOpen={modalMarcaRapidaAbierto}
          onClose={() => setModalMarcaRapidaAbierto(false)}
          onSuccess={handleNuevaMarcaSuccess}
        />
      </div>
    </div>
  )
}
