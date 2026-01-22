"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import { X, Plus, Trash2 } from "lucide-react"
import type { CompraDTO, Compra } from "../../types/dto/Compra"
import { crearCompra, modificarCompra } from "../../api/compraApi"
import { obtenerProveedores } from "../../api/proveedorApi"
import { obtenerInsumos } from "../../api/insumoApi"
import { formatCurrency } from "../../utils/numberFormatUtils"
import { useEscapeKey } from "../../hooks/useEscapeKey"
import { toast } from "react-toastify"
import { useAutocompleteNav } from "../../hooks/useAutocompleteNav"
import { InputPorcentaje } from "../InputPorcentaje"
import { useUsuarioStore } from "../../store/usuarioStore"

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  compraParaEditar?: Compra | null
}

interface DetalleItem {
  idItem: string
  nombre: string
  tipo: 'PRODUCTO' | 'INSUMO'
  cantidad: number
  costoUnitarioOriginal: number
  descuentoIndividual: number
  unidadMedida?: string
}

interface ItemSeleccionable {
  id: string
  nombre: string
  costo: number
  tipo: 'PRODUCTO' | 'INSUMO'
  unidadMedida?: string
}

export const ModalGestionarCompra: React.FC<Props> = ({ isOpen, onClose, onSuccess, compraParaEditar }) => {
  const esEdicion = !!compraParaEditar

  const [cargando, setCargando] = useState(false)
  const [proveedores, setProveedores] = useState<{ idProveedor: string; nombre: string }[]>([])
  const [items, setItems] = useState<ItemSeleccionable[]>([])
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<string>("")

  const [tipoDescuento, setTipoDescuento] = useState<"GLOBAL" | "INDIVIDUAL">("GLOBAL")
  const [descuentoGlobal, setDescuentoGlobal] = useState<number>(0)

  const [detalles, setDetalles] = useState<DetalleItem[]>([])
  const [busqueda, setBusqueda] = useState<string>("")
  const [itemSeleccionado, setItemSeleccionado] = useState<ItemSeleccionable | null>(null)
  const [mostrarSugerencias, setMostrarSugerencias] = useState<boolean>(false)
  const [cantidadInput, setCantidadInput] = useState<number>(1)
  const [descuentoIndividualInput, setDescuentoIndividualInput] = useState<number | null>(null)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputBusquedaRef = useRef<HTMLInputElement>(null)

  const itemsFiltrados = useMemo(() => {
    if (!busqueda) return []
    return items.filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
  }, [items, busqueda])

  const seleccionarItem = (item: ItemSeleccionable) => {
    setItemSeleccionado(item)
    setBusqueda(item.nombre)
    setMostrarSugerencias(false)
  }

  const { activeIndex, setActiveIndex, onKeyDown } = useAutocompleteNav(itemsFiltrados.length, (index) =>
    seleccionarItem(itemsFiltrados[index]),
  )

  useEffect(() => {
    if (activeIndex >= 0 && dropdownRef.current) {
      const activeItem = dropdownRef.current.children[activeIndex] as HTMLElement
      if (activeItem) {
        activeItem.scrollIntoView({ block: "nearest", behavior: "smooth" })
      }
    }
  }, [activeIndex])

  useEffect(() => {
    if (isOpen) {
      const init = async () => {
        await cargarProveedores()
        await cargarItems()
        
        if (esEdicion && compraParaEditar) {
          cargarDatosParaEditar()
        } else {
          resetearFormulario()
        }
      }
      init()
    }
  }, [isOpen, esEdicion, compraParaEditar])

  const cargarDatosParaEditar = async () => {
    if (!compraParaEditar) return

    const proveedor = proveedores.find((p) => p.nombre === compraParaEditar.proveedor)
    if (proveedor) {
      setProveedorSeleccionado(proveedor.idProveedor)
    }

    const detallesFormateados: DetalleItem[] = (compraParaEditar.detalles || []).map((detalle) => ({
      idItem: detalle.idProducto,
      nombre: typeof detalle.producto === "object" ? (detalle.producto as any).nombre : detalle.producto,
      tipo: detalle.tipo || 'PRODUCTO',
      cantidad: detalle.cantidad,
      costoUnitarioOriginal: detalle.costoUnitario,
      descuentoIndividual: 0,
    }))

    setDetalles(detallesFormateados)
  }

  const cargarProveedores = async () => {
    try {
      const data = await obtenerProveedores()
      setProveedores(data)
    } catch (error) {
      console.error("Error al cargar proveedores")
    }
  }

  const cargarItems = async () => {
    try {
      // Solo cargar insumos para compras
      const insumosData = await obtenerInsumos()

      const insumos: ItemSeleccionable[] = insumosData.map(i => ({
        id: i.idInsumo,
        nombre: i.nombre,
        costo: i.costo,
        tipo: 'INSUMO',
        unidadMedida: i.unidadMedida
      }))

      setItems(insumos)
    } catch (error) {
      console.error("Error al cargar items")
    }
  }

  const resetearFormulario = () => {
    setProveedorSeleccionado("")
    setDetalles([])
    setBusqueda("")
    setItemSeleccionado(null)
    setMostrarSugerencias(false)
    setCantidadInput(1)
    setTipoDescuento("GLOBAL")
    setDescuentoGlobal(0)
    setDescuentoIndividualInput(null)
  }

  const calcularCostoUnitarioFinal = (
    costoOriginal: number,
    descuento: number,
  ): number => {
    return Math.round(costoOriginal * (1 - descuento / 100))
  }

  const añadirItem = () => {
    if (!itemSeleccionado || cantidadInput <= 0) return

    const existe = detalles.find((d) => d.idItem === itemSeleccionado.id)
    if (existe) {
      toast.warning(`El item ${itemSeleccionado.nombre} ya se encuentra cargado.`)
      return
    }

    const nuevoDetalle: DetalleItem = {
      idItem: itemSeleccionado.id,
      nombre: itemSeleccionado.nombre,
      tipo: itemSeleccionado.tipo,
      cantidad: cantidadInput,
      costoUnitarioOriginal: itemSeleccionado.costo,
      descuentoIndividual: descuentoIndividualInput || 0,
      unidadMedida: itemSeleccionado.unidadMedida,
    }
    setDetalles((prev) => [...prev, nuevoDetalle])

    setBusqueda("")
    setItemSeleccionado(null)
    setMostrarSugerencias(false)
    setCantidadInput(1)
    setDescuentoIndividualInput(null)

    if (inputBusquedaRef.current) {
      inputBusquedaRef.current.focus()
    }
  }

  const eliminarItem = (id: string) => {
    setDetalles((prev) => prev.filter((d) => d.idItem !== id))
  }

  const modificarCantidadDetalle = (id: string, nuevaCantidad: number) => {
    if (nuevaCantidad < 1) return

    setDetalles((prev) =>
      prev.map((detalle) => (detalle.idItem === id ? { ...detalle, cantidad: nuevaCantidad } : detalle)),
    )
  }

  const modificarDescuentoIndividual = (id: string, nuevoDescuento: number) => {
    setDetalles((prev) =>
      prev.map((detalle) =>
        detalle.idItem === id ? { ...detalle, descuentoIndividual: nuevoDescuento } : detalle,
      ),
    )
  }

  const calcularTotal = () => {
    return detalles.reduce((total, detalle) => {
      const costoFinal = calcularCostoUnitarioFinal(
        detalle.costoUnitarioOriginal,
        tipoDescuento === "GLOBAL" ? descuentoGlobal : detalle.descuentoIndividual,
      )
      return total + detalle.cantidad * costoFinal
    }, 0)
  }

  const cambiarTipoDescuento = (nuevoTipo: "GLOBAL" | "INDIVIDUAL") => {
    setTipoDescuento(nuevoTipo)

    // Clear discounts when switching types
    if (nuevoTipo === "GLOBAL") {
      // Clear individual discounts
      setDetalles((prev) => prev.map((detalle) => ({ ...detalle, descuentoIndividual: 0 })))
      setDescuentoIndividualInput(null)
    } else {
      // Clear global discount
      setDescuentoGlobal(0)
    }
  }

  const manejarGuardar = async () => {
    if (proveedorSeleccionado === "" || detalles.length === 0) {
      toast.info("Debe seleccionar un proveedor y añadir al menos un producto")
      return
    }

    setCargando(true)
    try {
      const usuario = useUsuarioStore.getState().usuario;
      
      const compraData: CompraDTO = {
        idProveedor: proveedorSeleccionado,
        nombreUsuario: usuario?.nombre || 'Sistema',
        detalles: detalles.map((d) => ({
          tipo: d.tipo,
          idItem: d.idItem,
          nombre: d.nombre,
          cantidad: d.cantidad,
          costoUnitario: calcularCostoUnitarioFinal(
            d.costoUnitarioOriginal,
            tipoDescuento === "GLOBAL" ? descuentoGlobal : d.descuentoIndividual,
          ),
        })),
      }

      if (esEdicion && compraParaEditar) {
        await modificarCompra(String(compraParaEditar.idCompra), compraData)
        toast.success("¡Compra actualizada con éxito!")
      } else {
        await crearCompra(compraData)
        toast.success("¡Compra guardada con éxito!")
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error al guardar la compra")
      toast.error("Error al guardar la compra")
    } finally {
      setCargando(false)
    }
  }

  useEscapeKey(onClose, isOpen)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900">{esEdicion ? "Editar Compra" : "Nueva Compra"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700 ml-1">Proveedor *</label>
                <select
                  value={proveedorSeleccionado}
                  onChange={(e) => setProveedorSeleccionado(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all appearance-none"
                >
                  <option value="">Seleccionar proveedor</option>
                  {proveedores.map((proveedor) => (
                    <option key={proveedor.idProveedor} value={proveedor.idProveedor}>
                      {proveedor.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 space-y-4">
                <label className="block text-sm font-bold text-gray-800 uppercase tracking-wider ml-1">Descuento</label>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 cursor-pointer hover:border-azul/30 transition-all group">
                    <input
                      type="radio"
                      name="tipoDescuento"
                      value="GLOBAL"
                      checked={tipoDescuento === "GLOBAL"}
                      onChange={() => cambiarTipoDescuento("GLOBAL")}
                      className="w-4 h-4 text-azul focus:ring-azul"
                    />
                    <span className="text-sm font-medium text-gray-700">Global</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 cursor-pointer hover:border-azul/30 transition-all group">
                    <input
                      type="radio"
                      name="tipoDescuento"
                      value="INDIVIDUAL"
                      checked={tipoDescuento === "INDIVIDUAL"}
                      onChange={() => cambiarTipoDescuento("INDIVIDUAL")}
                      className="w-4 h-4 text-azul focus:ring-azul"
                    />
                    <span className="text-sm font-medium text-gray-700">Individual</span>
                  </label>
                </div>

                {tipoDescuento === "GLOBAL" && (
                  <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-2 ml-1">Valor del descuento (%)</label>
                    <InputPorcentaje
                      value={descuentoGlobal}
                      onValueChange={(nuevoValor) => setDescuentoGlobal(nuevoValor)}
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-azul/20"
                      placeholder="0 %"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2 space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 space-y-5">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider ml-1">Añadir Productos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                  <div className="sm:col-span-6 relative">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 ml-1">Producto / Insumo</label>
                    <input
                      ref={inputBusquedaRef}
                      type="text"
                      placeholder="Buscar..."
                      value={busqueda}
                      onChange={(e) => {
                        setBusqueda(e.target.value)
                        setMostrarSugerencias(true)
                        setItemSeleccionado(null)
                      }}
                      onFocus={() => setMostrarSugerencias(true)}
                      onKeyDown={onKeyDown}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all"
                    />

                    {mostrarSugerencias && busqueda && itemsFiltrados.length > 0 && (
                      <div
                        ref={dropdownRef}
                        className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-lg shadow-xl max-h-60 overflow-y-auto py-2"
                      >
                        {itemsFiltrados.slice(0, 10).map((item, index) => (
                          <div
                            key={item.id}
                            onClick={() => seleccionarItem(item)}
                            onMouseEnter={() => setActiveIndex(index)}
                            className={`px-4 py-3 hover:bg-azul/5 cursor-pointer flex justify-between items-center transition-colors ${index === activeIndex ? "bg-azul/5" : ""}`}
                          >
                            <div>
                              <div className="font-medium text-gray-900">{item.nombre}</div>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.tipo === 'INSUMO' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                {item.tipo}
                              </span>
                            </div>
                            <span className="font-bold text-verde">{formatCurrency(item.costo)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 ml-1">Cant.</label>
                    <input
                      type="number"
                      min="1"
                      value={cantidadInput}
                      onChange={(e) => setCantidadInput(Number(e.target.value) || 1)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all"
                    />
                  </div>

                  {tipoDescuento === "INDIVIDUAL" && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 ml-1">Desc %</label>
                      <InputPorcentaje
                        value={descuentoIndividualInput ?? 0}
                        onValueChange={(nuevoValor) => setDescuentoIndividualInput(nuevoValor)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all"
                        placeholder="0 %"
                      />
                    </div>
                  )}

                  <div className={`${tipoDescuento === "INDIVIDUAL" ? "sm:col-span-2" : "sm:col-span-4"}`}>
                    <button
                      onClick={añadirItem}
                      disabled={!itemSeleccionado || cantidadInput <= 0}
                      className="w-full flex items-center justify-center p-2.5 bg-verde text-white rounded-lg hover:bg-verde-dark disabled:opacity-50 transition-all font-bold group active:scale-95 shadow-md"
                    >
                      <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                    </button>
                  </div>
                </div>

                {itemSeleccionado && (
                  <div className="p-4 bg-white rounded-lg border border-azul/10 animate-in zoom-in-95">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-gray-900">{itemSeleccionado.nombre}</h4>
                         <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${itemSeleccionado.tipo === 'INSUMO' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                          {itemSeleccionado.tipo}
                        </span>
                      </div>
                      <span className="text-azul font-bold">{formatCurrency(itemSeleccionado.costo)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Subtotal con descuento:</span>
                      <span className="text-verde font-bold text-sm">
                        {formatCurrency(
                          calcularCostoUnitarioFinal(
                            itemSeleccionado.costo,
                            tipoDescuento === "GLOBAL" ? descuentoGlobal : descuentoIndividualInput || 0,
                          ) * cantidadInput,
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider ml-1">Resumen de Productos</h3>
            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-600 font-semibold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Producto</th>
                      <th className="px-6 py-4 text-center">Cantidad</th>
                      {tipoDescuento === "INDIVIDUAL" && <th className="px-6 py-4 text-center">Descuento</th>}
                      <th className="px-6 py-4 text-right">Costo Unit.</th>
                      <th className="px-6 py-4 text-right">Subtotal</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(detalles || []).map((detalle, index) => {
                      const costoFinal = calcularCostoUnitarioFinal(
                        detalle.costoUnitarioOriginal,
                        tipoDescuento === "GLOBAL" ? descuentoGlobal : detalle.descuentoIndividual,
                      )
                      return (
                        <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {detalle.nombre}
                            {detalle.unidadMedida && (
                              <span className="ml-2 text-xs text-gray-500">
                                ({detalle.unidadMedida})
                              </span>
                            )}
                            <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded ${detalle.tipo === 'INSUMO' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                              {detalle.tipo}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              <input
                                type="number"
                                min="1"
                                value={detalle.cantidad}
                                onChange={(e) =>
                                  modificarCantidadDetalle(detalle.idItem, Number.parseInt(e.target.value) || 1)
                                }
                                className="w-16 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-center font-bold focus:ring-2 focus:ring-azul/20"
                              />
                            </div>
                          </td>
                          {tipoDescuento === "INDIVIDUAL" && (
                            <td className="px-6 py-4 text-center">
                              <InputPorcentaje
                                value={detalle.descuentoIndividual}
                                onValueChange={(nuevoValor) =>
                                  modificarDescuentoIndividual(detalle.idItem, nuevoValor || 0)
                                }
                                className="w-16 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-center font-bold focus:ring-2 focus:ring-azul/20 inline-block"
                                placeholder="0%"
                              />
                            </td>
                          )}
                          <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(costoFinal)}</td>
                          <td className="px-6 py-4 text-right font-bold text-azul">
                            {formatCurrency(detalle.cantidad * costoFinal)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => eliminarItem(detalle.idItem)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Compra</span>
              <span className="text-3xl font-black text-azul tracking-tight">{formatCurrency(calcularTotal())}</span>
            </div>
            <div className="hidden sm:block h-10 w-px bg-gray-200"></div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ítems</span>
              <span className="text-lg font-bold text-gray-700">{detalles.length} productos</span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-8 py-3 bg-white text-gray-600 font-bold rounded-lg border border-gray-200 hover:bg-gray-50 transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button
              onClick={manejarGuardar}
              disabled={cargando || proveedorSeleccionado === "" || detalles.length === 0}
              className="flex-1 sm:flex-none px-10 py-3 bg-azul text-white font-bold rounded-lg shadow-md hover:bg-azul-dark disabled:opacity-50 transition-all active:scale-95"
            >
              {cargando ? "Guardando..." : esEdicion ? "Actualizar" : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
