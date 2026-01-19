"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useParams } from "react-router-dom"
import { Search, Plus, Trash2, ListPlus, RefreshCw, X, ShoppingBasket, Percent } from "lucide-react"
import type { ItemCatalogo, ItemVenta, VentaDTO } from "../types/dto/Venta"
import { motion, AnimatePresence } from "framer-motion"
import { obtenerCatalogoVenta, obtenerMetodosDePago, crearVenta } from "../api/ventaApi"
import { buscarProductoPorCodigo } from "../api/productoApi"
import { formatCurrency } from "../utils/numberFormatUtils"
import { toast } from "react-toastify"
import { InputMoneda } from "../components/InputMoneda"
import { InputPorcentaje } from "../components/InputPorcentaje"
import { obtenerConfiguracion } from "../api/configuracionApi"
import type { ConfiguracionDTO } from "../types/dto/Configuracion"
import { useUsuarioStore } from "../store/usuarioStore"

import { checkSessionStatus, abrirCajaManual } from "../api/cajaApi"

const PaginaVentas: React.FC = () => {
  const { idVenta } = useParams<{ idVenta: string }>()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputBusquedaRef = useRef<HTMLInputElement>(null)

  // Interfaces para el manejo de múltiples carritos
  interface EstadoCarrito {
    id: string
    items: ItemVenta[]
    metodoPago: string
    descuento: number | null
    tipoDescuento: "MONTO" | "PORCENTAJE" | "AUTOMATICO"
    montoAdicional: number | null
  }

  // Estados principales
  const [catalogo, setCatalogo] = useState<ItemCatalogo[]>([])
  const [metodosDePago, setMetodosDePago] = useState<string[]>([])
  const [configuracion, setConfiguracion] = useState<ConfiguracionDTO | null>(null)

  // Estado de los carritos
  const [carritos, setCarritos] = useState<EstadoCarrito[]>([
    {
      id: "1",
      items: [],
      metodoPago: "",
      descuento: null,
      tipoDescuento: "MONTO",
      montoAdicional: null,
    },
  ])
  const [activeCartId, setActiveCartId] = useState<string>("1")
  const [inputOtros, setInputOtros] = useState<number | null>(null)

  // Computed: Carrito Activo
  const activeCart = useMemo(
    () => carritos.find((c) => c.id === activeCartId) || carritos[0],
    [carritos, activeCartId],
  )

  // Estados para el constructor de venta
  const [busquedaItem, setBusquedaItem] = useState<string>("")
  const [itemSeleccionado, setItemSeleccionado] = useState<ItemCatalogo | null>(null)
  const [cantidad, setCantidad] = useState<number>(1)
  const [mostrarSugerencias, setMostrarSugerencias] = useState<boolean>(false)
  const [activeIndex, setActiveIndex] = useState<number>(-1)

  // --- NEW: Session Check for Admin ---
  const user = useUsuarioStore(state => state.usuario);
  const [sessionActive, setSessionActive] = useState<boolean>(true);
  const [checkingSession, setCheckingSession] = useState<boolean>(false);

  useEffect(() => {
    if (user?.rol === 'ADMIN') {
      const check = async () => {
        try {
          // Block UI while checking
          setSessionActive(false);
          setCheckingSession(true);
          const { active } = await checkSessionStatus(user.idUsuario);
          setSessionActive(active);
        } catch (error) {
          console.error("Error checking session", error);
          // If error, assume active? Or fail safe? 
          // Let's assume NOT active so user can try again via button?
          // No, if API fails, button might also fail.
          // Keep default true, but log error.
        } finally {
          setCheckingSession(false);
        }
      };
      check();
    }
  }, [user]);

  const handleIniciarTurno = async () => {
    if (!user) return;
    try {
      await abrirCajaManual(user.idUsuario);
      setSessionActive(true);
      toast.success("Turno iniciado correctamente");
    } catch (error: any) {
      if (error.response && error.response.status === 409) {
        // Conflict: Arqueo already exists
        toast.warning(error.response.data.message || "Ya existe un turno en curso");
      } else {
        toast.error("Error al iniciar turno");
      }
    }
  };

  // ------------------------------------

  // Estados de carga
  const [cargando, setCargando] = useState<boolean>(true)
  const [procesandoVenta, setProcesandoVenta] = useState<boolean>(false)

  const seleccionarItem = (item: ItemCatalogo) => {
    setItemSeleccionado(item)
    setBusquedaItem(item.nombre)
    setMostrarSugerencias(false)
    setActiveIndex(-1) // Reseteamos el índice
  }

  // --- 3. INICIO DE LA LÓGICA DEL LECTOR DE CÓDIGO DE BARRAS ---

  const [codigoDeBarras, setCodigoDeBarras] = useState("")
  const timerRef = useRef<number | null>(null)

  // Lógica para añadir un item al carrito (ahora en useCallback)
  // Lógica para añadir un item al carrito (ahora en useCallback)
  const añadirItemAlCarrito = useCallback(
    (itemToAdd: ItemCatalogo, cantidadToAdd: number): void => {
      if (!itemToAdd || cantidadToAdd <= 0) return

      const precioUnitario = calcularPrecioUnitario(itemToAdd, cantidadToAdd)

      setCarritos((prevCarritos) =>
        prevCarritos.map((carrito) => {
          if (carrito.id === activeCartId) {
            const indiceExistente = carrito.items.findIndex(
              (cItem) => cItem.item.id === itemToAdd.id && cItem.item.tipo === itemToAdd.tipo,
            )

            let nuevosItems = [...carrito.items]

            if (indiceExistente >= 0) {
              const itemExistente = nuevosItems[indiceExistente]
              const nuevaCantidad = itemExistente.cantidad + cantidadToAdd
              nuevosItems[indiceExistente] = {
                ...itemExistente,
                cantidad: nuevaCantidad,
                precioUnitarioAplicado: calcularPrecioUnitario(itemExistente.item, nuevaCantidad),
              }
            } else {
              const nuevoItem: ItemVenta = {
                item: itemToAdd,
                cantidad: cantidadToAdd,
                precioUnitarioAplicado: precioUnitario,
              }
              nuevosItems = [...nuevosItems, nuevoItem]
            }

            return { ...carrito, items: nuevosItems }
          }
          return carrito
        }),
      )
    },
    [activeCartId],
  )

  // Función que se llama cuando se completa un escaneo
  const procesarCodigoDeBarras = useCallback(
    async (codigo: string) => {
      try {
        const productoEncontrado = await buscarProductoPorCodigo(codigo)
        if (productoEncontrado) {
          añadirItemAlCarrito(productoEncontrado, 1)
          setBusquedaItem("")
          toast.info(`Se agregó ${productoEncontrado.nombre} al carrito`)
        } else {
          toast.error(`El código ${codigo} no pertenece a ningún producto.`)
        }
      } catch (error) {
        console.log("Error al buscar el producto.")
      }
    },
    [añadirItemAlCarrito],
  )

  // useEffect que escucha el teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (timerRef.current) clearTimeout(timerRef.current)

      if (e.key === "Enter") {
        if (codigoDeBarras.length > 5) {
          e.preventDefault()
          procesarCodigoDeBarras(codigoDeBarras)
        }
        setCodigoDeBarras("")
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setCodigoDeBarras((prevCodigo) => prevCodigo + e.key)
      }

      timerRef.current = window.setTimeout(() => {
        setCodigoDeBarras("")
      }, 100) // Aumentado a 100ms para más flexibilidad
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [codigoDeBarras, procesarCodigoDeBarras])
  // --- FIN DE LA LÓGICA DEL LECTOR ---

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async (): Promise<void> => {
      try {
        setCargando(true)
        const [catalogoData, metodosData, configData] = await Promise.all([
          obtenerCatalogoVenta(),
          obtenerMetodosDePago(),
          obtenerConfiguracion(),
        ])

        setCatalogo(catalogoData)
        setMetodosDePago(metodosData)
        setConfiguracion(configData)
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : "Error al cargar datos"
        console.error(mensaje)
        toast.error(mensaje)
      } finally {
        setCargando(false)
      }
    }

    cargarDatos()
  }, [idVenta])

  const itemsFiltrados = useMemo(() => {
    if (!busquedaItem) return []
    return catalogo.filter((item) => item.nombre.toLowerCase().includes(busquedaItem.toLowerCase()))
  }, [catalogo, busquedaItem])

  useEffect(() => {
    setActiveIndex(-1)
  }, [itemsFiltrados])

  useEffect(() => {
    // Verificamos si hay un elemento activo y si el contenedor existe
    if (activeIndex >= 0 && dropdownRef.current) {
      // Buscamos el hijo del contenedor que corresponde al índice activo
      const activeItem = dropdownRef.current.children[activeIndex] as HTMLElement

      if (activeItem) {
        // Le pedimos al navegador que mueva el scroll para que este item sea visible
        activeItem.scrollIntoView({
          block: "nearest", // Se desplazará lo mínimo necesario para que sea visible
          behavior: "smooth", // Le da una animación suave al scroll
        })
      }
    }
  }, [activeIndex]) // Se dispara solo cuando cambia el activeIndex

  // Calcular precio unitario aplicado según ofertas
  const calcularPrecioUnitario = (item: ItemCatalogo, _cantidad: number): number => {
    return item.precioFinal
  }

  // --- 2. AÑADIMOS LA NUEVA LÓGICA DE SELECCIÓN ---
  const añadirItem = (itemToAdd: ItemCatalogo | null, cantidadToAdd: number): void => {
    if (!itemToAdd || cantidadToAdd <= 0) return
    añadirItemAlCarrito(itemToAdd, cantidadToAdd)
  }

  // Añadir item al carrito
  const añadirManualmente = (): void => {
    if (!itemSeleccionado || cantidad <= 0) return
    añadirItem(itemSeleccionado, cantidad)

    // Limpiar selección del buscador manual
    setBusquedaItem("")
    setItemSeleccionado(null)
    setCantidad(1)
    setMostrarSugerencias(false)

    if (inputBusquedaRef.current) {
      inputBusquedaRef.current.focus()
    }
  }

  // Modificar cantidad en el carrito
  const modificarCantidadCarrito = (indice: number, nuevaCantidad: number): void => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(indice)
      return
    }

    setCarritos((prev) =>
      prev.map((c) => {
        if (c.id === activeCartId) {
          const nuevosItems = [...c.items]
          const item = nuevosItems[indice]
          nuevosItems[indice] = {
            ...item,
            cantidad: nuevaCantidad,
            precioUnitarioAplicado: calcularPrecioUnitario(item.item, nuevaCantidad),
          }
          return { ...c, items: nuevosItems }
        }
        return c
      }),
    )
  }

  // Eliminar item del carrito
  const eliminarDelCarrito = (indice: number): void => {
    setCarritos((prev) =>
      prev.map((c) => {
        if (c.id === activeCartId) {
          return { ...c, items: c.items.filter((_, i) => i !== indice) }
        }
        return c
      }),
    )
  }

  // Funciones de gestión de carritos
  const crearNuevoCarrito = () => {
    if (carritos.length >= 5) {
      toast.warning("Máximo 5 carritos permitidos")
      return
    }
    const nuevoId = Math.random().toString(36).substr(2, 9)
    const nuevoCarrito: EstadoCarrito = {
      id: nuevoId,
      items: [],
      metodoPago: "",
      descuento: null,
      tipoDescuento: "MONTO",
      montoAdicional: null,
    }
    setCarritos((prev) => [...prev, nuevoCarrito])
    cambiarDeCarrito(nuevoId)
  }

  const cambiarDeCarrito = (id: string) => {
    setActiveCartId(id)
    setBusquedaItem("")
    setItemSeleccionado(null)
    setCantidad(1)
    setMostrarSugerencias(false)
    if (inputBusquedaRef.current) inputBusquedaRef.current.focus()
  }

  // Wrapper para eliminar correctamente y setear ID
  const handleEliminarCarrito = (id: string) => {
    let nuevos = carritos.filter(c => c.id !== id);
    let nuevoActiveId = activeCartId;

    if (nuevos.length === 0) {
      // Create default
      const nuevoId = Math.random().toString(36).substr(2, 9)
      const nuevoCarrito: EstadoCarrito = {
        id: nuevoId,
        items: [],
        metodoPago: "",
        descuento: null,
        tipoDescuento: "MONTO",
        montoAdicional: null,
      }
      nuevos = [nuevoCarrito]
      nuevoActiveId = nuevoId
    } else if (activeCartId === id) {
      // Switch to first available or previous
      // "Mover al siguiente carrito" - lets pick index 0 or whatever matches logic
      nuevoActiveId = nuevos[0].id
    }

    setCarritos(nuevos)
    setActiveCartId(nuevoActiveId)
    if (activeCartId === id) { // Only clear if we switched
      setBusquedaItem("")
      setItemSeleccionado(null)
    }
  }

  const agregarMontoOtros = (): void => {
    if (!inputOtros || inputOtros <= 0) return

    setCarritos(prev => prev.map(c => {
      if (c.id === activeCartId) {
        return { ...c, montoAdicional: (c.montoAdicional || 0) + inputOtros }
      }
      return c
    }))
    setInputOtros(null)
  }

  const eliminarOtros = (): void => {
    setCarritos(prev => prev.map(c => {
      if (c.id === activeCartId) {
        return { ...c, montoAdicional: null }
      }
      return c
    }))
  }

  // Calcular total general
  const totalGeneral =
    activeCart.items.reduce((total, item) => total + item.cantidad * item.precioUnitarioAplicado, 0) + (activeCart.montoAdicional || 0)

  // Efecto para aplicar descuento automático
  useEffect(() => {
    if (configuracion?.descuentoAutomatico && configuracion.montoMinimo) {
      const metodosValidos = configuracion.metodosPagoDescuento || [];
      const metodoValido = activeCart.metodoPago && metodosValidos.includes(activeCart.metodoPago);

      // Calcular total elegible (productos con categoría que tiene descuento habilitado)
      let totalElegible = 0;
      
      activeCart.items.forEach(item => {
        // Verificar si el item tiene la propiedad aplicaDescuentoAutomatico
        if (item.item.aplicaDescuentoAutomatico === true) {
          const subtotal = item.cantidad * item.precioUnitarioAplicado;
          totalElegible += subtotal;
        }
      });

      // IMPORTANTE: Validar monto mínimo contra totalGeneral, no totalElegible
      if (totalGeneral > configuracion.montoMinimo && metodoValido && totalElegible > 0) {
        setCarritos(prev => prev.map(c => {
          if (c.id === activeCartId && c.tipoDescuento !== "AUTOMATICO") {
            return { ...c, tipoDescuento: "AUTOMATICO" }
          }
          return c
        }))
      } else if (activeCart.tipoDescuento === "AUTOMATICO") {
        setCarritos(prev => prev.map(c => {
          if (c.id === activeCartId) {
            return { ...c, tipoDescuento: "MONTO", descuento: null }
          }
          return c
        }))
      }
    } else if (activeCart.tipoDescuento === "AUTOMATICO") {
      // Si el descuento automático está desactivado globalmente, desactivar en el carrito
      setCarritos(prev => prev.map(c => {
        if (c.id === activeCartId) {
          return { ...c, tipoDescuento: "MONTO", descuento: null }
        }
        return c
      }))
    }
  }, [totalGeneral, configuracion, activeCart.metodoPago, activeCartId, activeCart.tipoDescuento, activeCart.items])

  const descuentoMonto = useMemo(() => {
    if (activeCart.tipoDescuento === "AUTOMATICO" && configuracion) {
      let totalElegible = 0;
      
      activeCart.items.forEach(item => {
        if (item.item.aplicaDescuentoAutomatico === true) {
          const subtotal = item.cantidad * item.precioUnitarioAplicado;
          totalElegible += subtotal;
        }
      });
      
      return Math.round((totalElegible * configuracion.porcentajeDescuento) / 100)
    }
    return activeCart.tipoDescuento === "PORCENTAJE" ? Math.round((totalGeneral * (activeCart.descuento || 0)) / 100) : activeCart.descuento || 0
  }, [activeCart.tipoDescuento, totalGeneral, activeCart.descuento, configuracion, activeCart.items])

  const totalConDescuento = Math.max(0, totalGeneral - descuentoMonto)

  // Finalizar venta
  const finalizarVenta = async (): Promise<void> => {
    if (activeCart.items.length === 0 || !activeCart.metodoPago) {
      toast.error("Debe agregar items al carrito y seleccionar un método de pago")
      return
    }

    try {
      setProcesandoVenta(true)

      const ventaDTO: VentaDTO = {
        metodoDePago: activeCart.metodoPago,
        descuento: descuentoMonto,
        montoAdicional: activeCart.montoAdicional,
        tipoDescuento: activeCart.tipoDescuento === "AUTOMATICO" ? "AUTOMATICO" : activeCart.tipoDescuento === "PORCENTAJE" ? "PORCENTAJE" : "MONTO",
        porcentajeAplicado: activeCart.tipoDescuento === "AUTOMATICO" ? configuracion?.porcentajeDescuento : activeCart.tipoDescuento === "PORCENTAJE" ? activeCart.descuento : null,
        detalles: activeCart.items.map((item) => ({
          idProducto: item.item.id,
          cantidad: item.cantidad,
        })),
      }

      await crearVenta(ventaDTO)

      toast.success("¡Venta realizada con éxito!")

      // Eliminar el carrito comprado
      handleEliminarCarrito(activeCartId)

      setProcesandoVenta(false) // This lines up with previous success logic removal if any
    } catch (err: any) {
      handleError(err)
    } finally {
      setProcesandoVenta(false)
    }
  }

  // --- Helper para manejar errores de API ---
  const handleError = (err: any) => {
    if (err.response && err.response.data) {
      const data = err.response.data;
      if (typeof data === 'string') {
        toast.error(data);
      } else if (data.message) {
        const msg = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message;
        toast.error(msg);
      } else {
        toast.error("Error desconocido al procesar la venta");
      }
    } else {
      console.error("Error al procesar la venta", err)
      toast.error("Error al procesar la venta")
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando terminal de venta...</div>
      </div>
    )
  }

  return (
    <div className="p-6 relative">
      {/* BLOCKER FOR ADMIN WITHOUT SESSION */}
      {user?.rol === 'ADMIN' && !sessionActive && !checkingSession && (
        <div className="absolute inset-0 bg-gray-100 z-30 flex flex-col items-center justify-center text-center p-4 rounded-3xl m-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in">
            <div className="w-20 h-20 bg-blue-50 text-azul rounded-full flex items-center justify-center mx-auto mb-6">
              <ListPlus size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Turno de Venta Inactivo</h2>
            <p className="text-gray-500 mb-8">
              Para realizar ventas, necesitas abrir la caja primero.
            </p>
            <button
              onClick={handleIniciarTurno}
              className="w-full py-4 bg-azul text-white font-bold rounded-xl hover:bg-azul-dark shadow-lg hover:shadow-azul/25 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Iniciar Arqueo y Vender</span>
            </button>
          </div>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <ListPlus className="text-azul" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Nueva Venta</h1>
            <p className="text-gray-600">Registra una nueva venta en el sistema</p>
          </div>
        </div>
        <button
          onClick={crearNuevoCarrito}
          className="flex items-center space-x-2 px-4 py-2 bg-azul text-white rounded-md hover:bg-azul-dark"
        >
          <Plus size={20} />
          <span>Nuevo Carrito</span>
        </button>
      </div>

      {/* TABS DE CARRITOS - DISEÑO ACTUALIZADO */}
      <AnimatePresence>
        {carritos.length > 1 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex gap-4 mb-8 overflow-x-auto pb-4 px-1 items-start">
              <AnimatePresence mode="popLayout" initial={false}>
                {carritos.map((carrito, index) => {
                  const total = carrito.items.reduce((acc, item) => acc + (item.precioUnitarioAplicado * item.cantidad), 0) + (carrito.montoAdicional || 0)
                  const isActive = activeCartId === carrito.id

                  return (
                    <motion.div
                      key={carrito.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8, x: -20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      onClick={() => cambiarDeCarrito(carrito.id)}
                      className={`
                    group relative flex items-center justify-between p-4 rounded-2xl cursor-pointer min-w-[200px] transition-colors duration-300
                    ${isActive
                          ? "bg-white shadow-lg border-l-4 border-l-verde z-10"
                          : "bg-gray-50 border border-gray-100 text-gray-400 hover:bg-white hover:shadow-md hover:text-gray-600"
                        }
                  `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                        p-2 rounded-full 
                        ${isActive ? "bg-green-100 text-verde" : "bg-gray-100 text-gray-400 group-hover:bg-gray-100"}
                      `}>
                          <ShoppingBasket size={20} />
                        </div>
                        <div>
                          <div className={`text-xs font-bold uppercase tracking-wider ${isActive ? "text-gray-500" : "text-gray-400"}`}>
                            Carrito {index + 1}
                          </div>
                          <div className={`text-lg font-bold ${isActive ? "text-gray-800" : "text-gray-500"}`}>
                            {formatCurrency(total)}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); handleEliminarCarrito(carrito.id); }}
                        className={`
                        p-1.5 rounded-full transition-colors
                        ${isActive
                            ? "text-gray-300 hover:text-black"
                            : "text-gray-300 hover:text-black opacity-0 group-hover:opacity-100"
                          }
                    `}
                        title="Eliminar carrito"
                      >
                        <X size={16} />
                      </button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {/* Botón + en la lista */}
              {carritos.length < 5 && (
                <motion.button
                  layout
                  onClick={crearNuevoCarrito}
                  className="flex items-center justify-center w-[60px] h-[84px] rounded-2xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-verde hover:text-verde hover:bg-green-50 transition-colors duration-300 flex-shrink-0"
                  title="Abrir nuevo carrito"
                >
                  <Plus size={24} />
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layout principal: dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_2fr] gap-6">
        {/* Columna Izquierda: Constructor de Venta */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Search className="mr-2" size={20} />
            Constructor de Venta
          </h2>

          {/* Buscador con autocompletado */}
          <div className="relative mb-4">
            <input
              ref={inputBusquedaRef}
              type="text"
              placeholder="Buscar producto o promoción..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={busquedaItem}
              onChange={(e) => {
                setBusquedaItem(e.target.value)
                setMostrarSugerencias(true)
                setItemSeleccionado(null)
              }}
              onFocus={() => setMostrarSugerencias(true)}
              onKeyDown={(e) => {
                if (itemsFiltrados.length === 0) return

                switch (e.key) {
                  case "ArrowDown":
                    e.preventDefault()
                    setActiveIndex((prev) => Math.min(prev + 1, itemsFiltrados.length - 1))
                    break

                  case "ArrowUp":
                    e.preventDefault()
                    setActiveIndex((prev) => Math.max(0, prev - 1))
                    break

                  case "Enter":
                    e.preventDefault()
                    const itemASelleccionar = activeIndex >= 0 ? itemsFiltrados[activeIndex] : itemsFiltrados[0]

                    seleccionarItem(itemASelleccionar)
                    break

                  case "Escape":
                    setMostrarSugerencias(false)
                    break
                }
              }}
            />

            {/* Sugerencias */}
            {mostrarSugerencias && busquedaItem && itemsFiltrados.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto"
              >
                {itemsFiltrados.slice(0, 10).map((item, index) => (
                  <div
                    key={`${item.tipo}-${item.id}`}
                    onClick={() => seleccionarItem(item)}
                    // 2. Sincronizamos el mouse con el estado activo
                    onMouseEnter={() => setActiveIndex(index)}
                    // 3. Aplicamos un estilo diferente si el item está activo
                    className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${index === activeIndex ? "bg-gray-100" : "hover:bg-gray-100"
                      }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{item.nombre}</span>
                        <span
                          className={`ml-2 px-2 py-1 text-xs rounded ${item.tipo === "PRODUCTO" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                            }`}
                        >
                          {item.tipo}
                        </span>
                      </div>
                      <span className="font-semibold text-green-600">{formatCurrency(item.precioFinal)}</span>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cantidad y botón añadir */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="grid">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
              <input
                type="number"
                min="1"
                value={cantidad}
                onChange={(e) => setCantidad(Number.parseInt(e.target.value) || 1)}
                className="w-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={añadirManualmente}
                disabled={!itemSeleccionado}
                className="px-6 py-3 bg-verde text-white rounded-lg hover:bg-verde-dark disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                <Plus size={16} className="mr-1" />
                Añadir
              </button>
            </div>
          </div>

          {/* Vista previa del item seleccionado */}
          {itemSeleccionado && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900">{itemSeleccionado.nombre}</h3>
              <div className="text-sm text-gray-600 mt-1">
                Precio unitario: {formatCurrency(calcularPrecioUnitario(itemSeleccionado, cantidad))}

              </div>
              <div className="font-semibold text-green-600 mt-1">
                Subtotal: {formatCurrency(calcularPrecioUnitario(itemSeleccionado, cantidad) * cantidad)}
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end mr-0 lg:mr-32">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Otros</label>
                <InputMoneda
                  value={inputOtros}
                  onValueChange={setInputOtros}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="$ 0"
                />
              </div>
              <button
                onClick={agregarMontoOtros}
                disabled={!inputOtros || inputOtros <= 0}
                className="px-6 py-3 bg-verde text-white rounded-lg hover:bg-verde-dark disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                <Plus size={16} className="mr-1" />
                Añadir
              </button>
            </div>
            <p className="text-sm text-gray-500 italic mt-2">Productos que no se encuentran cargados en el sistema</p>
          </div>
        </div>

        {/* Columna Derecha: Carrito/Ticket */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <ShoppingBasket className="mr-2" size={20} />
            Ticket Actual
          </h2>

          {/* Tabla de items */}
          <div className="mb-6">
            {activeCart.items.length === 0 && !activeCart.montoAdicional ? (
              <div className="text-center text-gray-500 py-8">No hay items en el carrito</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 w-64">Item</th>
                      <th className="text-center py-2">Cant.</th>
                      <th className="text-center py-2">P. Unit.</th>
                      <th className="text-center py-2">Subtotal</th>
                      <th className="text-center py-2 w-[10px]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeCart.items.map((item, indice) => (
                      <tr key={indice} className="border-b border-gray-100">
                        <td className="py-3">
                          <div>
                            <div className="font-medium mb-1 flex items-center gap-2">
                              {item.item.nombre}
                              {configuracion?.descuentoAutomatico && (
                                item.item.aplicaDescuentoAutomatico ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700" title="Incluido en descuento automático">
                                    <Percent size={12} className="mr-1" />
                                    Con descuento
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500" title="No incluido en descuento automático">
                                    Sin descuento
                                  </span>
                                )
                              )}
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded ${item.item.tipo === "PRODUCTO"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                                }`}
                            >
                              {item.item.tipo}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.cantidad}
                            onChange={(e) => modificarCantidadCarrito(indice, Number.parseInt(e.target.value) || 1)}
                            className="w-[60px] p-1 text-center border border-gray-300 rounded"
                          />
                        </td>
                        <td className="py-3 text-center">{formatCurrency(item.precioUnitarioAplicado)}</td>
                        <td className="py-3 text-center font-semibold">
                          {formatCurrency(item.cantidad * item.precioUnitarioAplicado)}
                        </td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => eliminarDelCarrito(indice)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {activeCart.montoAdicional !== null && activeCart.montoAdicional > 0 && (
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <td className="py-3">
                          <div>
                            <div className="font-medium mb-1">Otros</div>
                            <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800">ADICIONAL</span>
                          </div>
                        </td>
                        <td className="py-3 text-center text-gray-400">-</td>
                        <td className="py-3 text-center text-gray-400">-</td>
                        <td className="py-3 text-center font-semibold">{formatCurrency(activeCart.montoAdicional)}</td>
                        <td className="py-3 text-center">
                          <button onClick={eliminarOtros} className="text-red-600 hover:text-red-800">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Total y método de pago */}
          <div className="border-t border-gray-200 pt-4">
            <div className="mb-4 flex flex-col sm:flex-row gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
                <select
                  value={activeCart.metodoPago}
                  onChange={(e) => {
                    const nuevoMetodo = e.target.value
                    setCarritos(prev => prev.map(c => c.id === activeCartId ? { ...c, metodoPago: nuevoMetodo } : c))
                  }}
                  className="w-full sm:w-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar método de pago</option>
                  {metodosDePago.map((metodo) => (
                    <option key={metodo} value={metodo}>
                      {metodo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                {activeCart.tipoDescuento === "AUTOMATICO" && user?.rol === 'ADMIN' ? (
                  <>
                    <label className="block text-sm font-medium text-green-600 mb-2">Descuento Automático Aplicado</label>
                    <div className="flex gap-2">
                      <div className="w-32 p-3 border border-green-300 bg-green-50 text-green-700 rounded-lg font-medium flex items-center justify-center">
                        {configuracion?.porcentajeDescuento}%
                      </div>
                    </div>
                  </>
                ) : user?.rol === 'ADMIN' ? (
                  <>
                    {activeCart.tipoDescuento === "MONTO" ? (
                      <label className="block text-sm font-medium text-gray-700 mb-2">Descuento por monto ($)</label>
                    ) : (
                      <label className="block text-sm font-medium text-gray-700 mb-2">Descuento por porcentaje (%)</label>
                    )}
                    <div className="flex gap-2">
                      {activeCart.tipoDescuento === "MONTO" ? (
                        <InputMoneda
                          value={activeCart.descuento}
                          onValueChange={(nuevoValor) => {
                            const valorValidado = Math.min(nuevoValor || 0, totalGeneral)
                            setCarritos(prev => prev.map(c => c.id === activeCartId ? { ...c, descuento: valorValidado } : c))
                          }}
                          className="w-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="$ 0"
                        />
                      ) : (
                        <InputPorcentaje
                          value={activeCart.descuento ?? 0}
                          onValueChange={(nuevoValor) => {
                            setCarritos(prev => prev.map(c => c.id === activeCartId ? { ...c, descuento: nuevoValor } : c))
                          }}
                          className="w-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                          placeholder="0 %"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setCarritos(prev => prev.map(c => {
                            if (c.id === activeCartId) {
                              const nuevoTipo = c.tipoDescuento === "MONTO" ? "PORCENTAJE" : "MONTO"
                              return { ...c, tipoDescuento: nuevoTipo, descuento: null }
                            }
                            return c
                          }))
                        }}
                        className="px-3 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={activeCart.tipoDescuento === "MONTO" ? "Cambiar a porcentaje" : "Cambiar a monto"}
                      >
                        <RefreshCw size={20} className="text-gray-700" />
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Subtotal:</span>
                <span className="text-lg font-semibold text-gray-700">{formatCurrency(totalGeneral)}</span>
              </div>
              {descuentoMonto > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-red-600">
                    Descuento {activeCart.tipoDescuento === "PORCENTAJE" ? `(${activeCart.descuento}%)` : activeCart.tipoDescuento === "AUTOMATICO" ? `(Automático ${configuracion?.porcentajeDescuento}%)` : ""}:
                  </span>
                  <span className="text-lg font-semibold text-red-600">-{formatCurrency(descuentoMonto)}</span>
                </div>
              )}
              <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                <span className="text-xl font-semibold">Total Final:</span>
                <span className="text-2xl font-bold text-gray-700">{formatCurrency(totalConDescuento)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                onClick={finalizarVenta}
                disabled={activeCart.items.length === 0 || !activeCart.metodoPago || procesandoVenta}
                className="w-full py-3 bg-verde text-white rounded-lg hover:bg-verde-dark disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
              >
                {procesandoVenta ? "Procesando..." : "Finalizar Venta"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Card: Detalles del Descuento Automático */}
      {configuracion?.descuentoAutomatico && (
        <div className="mt-8 bg-gradient-to-br from-verde-light to-verde-darker rounded-lg p-6 relative overflow-hidden shadow-[7px_7px_10px_rgba(0,0,0,0.2)]">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="px-2 rounded-full shadow-sm text-verde-darker">
              <Percent size={58} />
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">Descuento Automático Activo</h3>
              <p className="text-white text-sm">
                El sistema aplicará automáticamente un <span className="font-bold">{configuracion.porcentajeDescuento}% de descuento</span> sobre productos de categorías habilitadas si la venta cumple con las siguientes condiciones:
              </p>
            </div>

            <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
              <div className="bg-verde-light px-4 py-2 rounded-md flex flex-col items-center min-w-[120px]">
                <span className="text-xs font-semibold text-white uppercase tracking-wider">Monto Mínimo</span>
                <span className="text-2xl font-bold text-white">{formatCurrency(configuracion.montoMinimo)}</span>
              </div>

              <div className="bg-verde-light px-4 py-2 rounded-md flex flex-col items-center min-w-[120px] max-w-xs">
                <span className="text-xs pb-1 font-semibold text-white uppercase tracking-wider">Métodos de Pago</span>
                <div className="flex flex-wrap justify-center gap-1 mt-1">
                  {configuracion.metodosPagoDescuento?.map((metodo) => (
                    <span key={metodo} className="text-xs bg-white text-verde-dark px-2 py-0.5 rounded font-medium">
                      {metodo}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default PaginaVentas
