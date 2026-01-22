"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X } from "lucide-react"
import type { ProductoDTO, MarcaLista, ProveedorLista, DetalleReceta } from "../../types/dto/Producto"
import { crearProducto } from "../../api/productoApi"
import { useCategoriaStore } from "../../store/categoriaStore"
import { useAlertasStore } from "../../store/alertasStore"
import { obtenerListaMarcas } from "../../api/marcaApi"
import { obtenerProveedores } from "../../api/proveedorApi"
import { SelectJerarquico } from "../SelectJerarquico"
import { ModalNuevaMarcaRapida } from "../marcas/ModalNuevaMarcaRapida"
import { InputMoneda } from "../InputMoneda"
import { useEscapeKey } from "../../hooks/useEscapeKey"
import { toast } from "react-toastify"
import { RecipeEditor } from "./RecipeEditor"

interface Props {
  isOpen: boolean
  onClose: () => void
  alConfirmar: () => void
}

export const ModalNuevoProducto: React.FC<Props> = ({ isOpen, onClose, alConfirmar }) => {
  const [cargando, setCargando] = useState(false)

  // 3. Obtiene las categorías del store de Zustand
  const { categoriasArbol, cargarCategorias } = useCategoriaStore()
  const triggerRecarga = useAlertasStore((state) => state.triggerRecarga)

  const [marcas, setMarcas] = useState<MarcaLista[]>([])
  const [proveedores, setProveedores] = useState<ProveedorLista[]>([])
  const [formulario, setFormulario] = useState<ProductoDTO>({
    nombre: "",
    precio: 0,
    costo: 0,
    stock: 0,
    idMarca: "",
    idCategoria: "",
    idProveedor: "",
    tipoProducto: "SIMPLE",
    receta: [],
    imagenUrl: null,
  })

  const [modalMarcaRapidaAbierto, setModalMarcaRapidaAbierto] = useState(false)

  useEffect(() => {
    // Carga los datos para los selects solo cuando el modal se abre
    if (isOpen) {
      cargarDatosSelect()
    }
  }, [isOpen])

  const cargarDatosSelect = async (): Promise<void> => {
    try {
      await cargarCategorias()

      const [marcasData, proveedoresData] = await Promise.all([obtenerListaMarcas(), obtenerProveedores()])
      setMarcas(marcasData)
      setProveedores(proveedoresData)
    } catch (error) {
      console.error("Error al cargar datos de los select:", error)
    }
  }

  const manejarCambio = (campo: keyof ProductoDTO, valor: string | number | boolean | File | null): void => {
    setFormulario((prev) => ({
      ...prev,
      [campo]: valor,
    }))
  }

  const handleNuevaMarcaSuccess = (nuevaMarca: MarcaLista) => {
    // 1. Reload marca list
    cargarDatosSelect()
    // 2. Auto-select the new marca in the form
    setFormulario((prev) => ({ ...prev, idMarca: nuevaMarca.idMarca }))
  }

  const manejarEnvio = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setCargando(true)


    try {
      // Create product with the image URL
      await crearProducto({
        ...formulario,
        codigoDeBarras: undefined, 
        imagenUrl: null,
      })
      
      toast.success("Producto creado con éxito!")
      triggerRecarga() // Trigger alert reload
      alConfirmar()
      
      setFormulario({
        nombre: "",
        precio: 0,
        costo: 0,
        stock: 0,
        idMarca: "",
        idCategoria: "",
        idProveedor: "",
        tipoProducto: "SIMPLE",
        receta: [],
        imagenUrl: null,
      })
    } catch (error: any) {
      if (error.response && error.response.data) {
        toast.error(error.response.data);
      } else {
        console.error("Error al crear el nuevo producto");
      }
    } finally {
      setCargando(false)
    }
  }

  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-[95%] sm:w-full max-w-[600px] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Nuevo Producto</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 ml-3">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={manejarEnvio} className="space-y-4">
          {/* Selector de Tipo de Producto */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Producto</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className={`
                flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all
                ${formulario.tipoProducto === 'SIMPLE' 
                  ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' 
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}
              `}>
                <input 
                  type="radio" 
                  className="sr-only"
                  checked={formulario.tipoProducto === 'SIMPLE'}
                  onChange={() => manejarCambio('tipoProducto', 'SIMPLE')}
                />
                <span className="font-bold text-sm">Simple</span>
                <span className="text-xs text-center mt-1 opacity-80">Se compra y se vende</span>
              </label>

              <label className={`
                flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all
                ${formulario.tipoProducto === 'ELABORADO' 
                  ? 'bg-purple-50 border-purple-500 text-purple-700 ring-1 ring-purple-500' 
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}
              `}>
                <input 
                  type="radio" 
                  className="sr-only"
                  checked={formulario.tipoProducto === 'ELABORADO'}
                  onChange={() => manejarCambio('tipoProducto', 'ELABORADO')}
                />
                <span className="font-bold text-sm">Elaborado</span>
                <span className="text-xs text-center mt-1 opacity-80">Se fabrica con receta</span>
              </label>

              <label className={`
                flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all
                ${formulario.tipoProducto === 'MIXTO' 
                  ? 'bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500' 
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}
              `}>
                <input 
                  type="radio" 
                  className="sr-only"
                  checked={formulario.tipoProducto === 'MIXTO'}
                  onChange={() => manejarCambio('tipoProducto', 'MIXTO')}
                />
                <span className="font-bold text-sm">Mixto</span>
                <span className="text-xs text-center mt-1 opacity-80">Se produce y compra</span>
              </label>
            </div>
          </div>

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
                selectedValue={formulario.idCategoria === "" ? null : formulario.idCategoria}
                onSelect={(id) => manejarCambio("idCategoria", id ?? "")}
                idKey="idCategoria"
                placeholder="Seleccionar categoría"
              />
            </div>
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
                value={formulario.stock || ''}
                min="0"
                onChange={(e) => {
                  const valor = e.target.value;
                  if (valor === '' || valor === '0') {
                    manejarCambio("stock", 0);
                  } else {
                    manejarCambio("stock", Number.parseInt(valor) || 0);
                  }
                }}
                onFocus={(e) => {
                  if (parseFloat(e.target.value) === 0) {
                    e.target.value = '';
                  } else {
                    e.target.select();
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === '') {
                    manejarCambio("stock", 0);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>



          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
            <div className="flex gap-2">
              <select
                value={formulario.idMarca}
                onChange={(e) => manejarCambio("idMarca", e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccionar marca</option>
                {marcas.map((marca) => (
                  <option key={marca.idMarca} value={marca.idMarca}>
                    {marca.nombre}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setModalMarcaRapidaAbierto(true)}
                className="px-3 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 text-sm whitespace-nowrap"
                title="Añadir nueva marca"
              >
                <span>Nueva Marca</span>
              </button>
            </div>
          </div>



          {/* Sección de Receta (Solo para ELABORADO o MIXTO) */}
          {(formulario.tipoProducto === 'ELABORADO' || formulario.tipoProducto === 'MIXTO') && (
            <RecipeEditor 
              receta={formulario.receta || []}
              onChange={(nuevaReceta: DetalleReceta[]) => {
                // Calcular nuevo costo total
                const nuevoCosto = nuevaReceta.reduce((total, item) => total + (item.subtotal || 0), 0)
                
                setFormulario(prev => ({
                  ...prev,
                  receta: nuevaReceta,
                  costo: nuevoCosto // Actualizar costo del producto automáticamente
                }))
              }}
              costoTotal={formulario.costo}
            />
          )}

          {/* Proveedor: Ocultar si es ELABORADO puros */}
          {formulario.tipoProducto !== 'ELABORADO' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor *</label>
              <select
                value={formulario.idProveedor}
                onChange={(e) => manejarCambio("idProveedor", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-hidden text-ellipsis"
                required
              >
                <option value="">Seleccionar proveedor</option>
                {proveedores.map((proveedor) => (
                  <option key={proveedor.idProveedor} value={proveedor.idProveedor}>
                    {proveedor.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

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
              {cargando ? "Creando..." : "Crear Producto"}
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
