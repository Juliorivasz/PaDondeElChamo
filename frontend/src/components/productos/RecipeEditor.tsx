import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Search, Trash2, Calculator } from "lucide-react"
import type { DetalleReceta } from "../../types/dto/Producto"
import type { Insumo } from "../../types/dto/Insumo"
import { obtenerInsumos, obtenerInsumoPorId } from "../../api/insumoApi"
import { formatCurrency } from "../../utils/numberFormatUtils"
import { useAutocompleteNav } from "../../hooks/useAutocompleteNav"

interface Props {
  receta: DetalleReceta[]
  onChange: (nuevaReceta: DetalleReceta[]) => void
  costoTotal?: number
}

export const RecipeEditor: React.FC<Props> = ({ receta, onChange, costoTotal }) => {
  const [busqueda, setBusqueda] = useState("")
  const [resultados, setResultados] = useState<Insumo[]>([])
  const [cargando, setCargando] = useState(false)
  const [mostrarResultados, setMostrarResultados] = useState(false)
  
  const searchRef = useRef<HTMLDivElement>(null)

  // Sincronizar costos de insumos desde Firestore
  useEffect(() => {
    const sincronizarCostos = async () => {
      if (receta.length === 0) return;
      
      try {
        const recetaActualizada = await Promise.all(
          receta.map(async (detalle) => {
            try {
              const insumo = await obtenerInsumoPorId(detalle.idInsumo);
              const costoActualizado = insumo.costo;
              
              // Solo actualizar si el costo cambió
              if (costoActualizado !== detalle.costoUnitario) {
                return {
                  ...detalle,
                  costoUnitario: costoActualizado,
                  subtotal: costoActualizado * detalle.cantidad
                };
              }
              return detalle;
            } catch (error) {
              console.error(`Error al obtener costo de ${detalle.nombreInsumo}:`, error);
              return detalle; // Mantener el costo anterior si hay error
            }
          })
        );
        
        // Solo actualizar si hubo cambios
        const huboCambios = recetaActualizada.some((item, index) => 
          item.costoUnitario !== receta[index].costoUnitario
        );
        
        if (huboCambios) {
          onChange(recetaActualizada);
        }
      } catch (error) {
        console.error("Error al sincronizar costos:", error);
      }
    };

    sincronizarCostos();
  }, []); // Solo al montar el componente

  // Búsqueda de insumos
  useEffect(() => {
    const buscar = async () => {
      if (!busqueda.trim()) {
        setResultados([])
        return
      }
      
      setCargando(true)
      try {
        // Obtenemos todos los insumos que coincidan
        const insumos = await obtenerInsumos({ busqueda })
        // Filtramos solo los que sean para PRODUCCION o MIXTO
        // y que NO estén ya en la receta
        const filtrados = insumos.filter(i => 
          (!i.tipoInsumo || i.tipoInsumo === 'PRODUCCION' || i.tipoInsumo === 'MIXTO') &&
          !receta.some(r => r.idInsumo === i.idInsumo)
        )
        setResultados(filtrados)
        setMostrarResultados(true)
      } catch (error) {
        console.error("Error buscando insumos:", error)
      } finally {
        setCargando(false)
      }
    }

    const timeoutId = setTimeout(buscar, 300)
    return () => clearTimeout(timeoutId)
  }, [busqueda, receta])

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setMostrarResultados(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const agregarIngrediente = (insumo: Insumo) => {
    const nuevoIngrediente: DetalleReceta = {
      idInsumo: insumo.idInsumo,
      nombreInsumo: insumo.nombre,
      cantidad: 1, // Default quantity
      unidadMedida: insumo.unidadMedida,
      costoUnitario: insumo.costo,
      subtotal: insumo.costo * 1
    }
    onChange([...receta, nuevoIngrediente])
    setBusqueda("")
    setResultados([])
    setMostrarResultados(false)
  }

  const eliminarIngrediente = (idInsumo: string) => {
    onChange(receta.filter(item => item.idInsumo !== idInsumo))
  }

  const actualizarCantidad = (idInsumo: string, cantidad: number) => {
    if (cantidad < 0) return
    onChange(receta.map(item => 
      item.idInsumo === idInsumo ? { 
        ...item, 
        cantidad,
        subtotal: (item.costoUnitario || 0) * cantidad 
      } : item
    ))
  }

  // Navegación con teclado
  const { activeIndex, setActiveIndex, onKeyDown } = useAutocompleteNav(resultados.length, (index) =>
    agregarIngrediente(resultados[index])
  )

  return (
    <div className="space-y-4">
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-purple-800 uppercase flex items-center gap-2">
            <Calculator size={16} />
            Editor de Receta
          </h3>
          <div className="text-sm text-purple-700 bg-white px-3 py-1 rounded-full border border-purple-200 shadow-sm">
            Costo Estimado: <span className="font-bold ml-1">{formatCurrency(costoTotal || 0)}</span>
          </div>
        </div>

        {/* Buscador */}
        <div className="relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" size={18} />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                setMostrarResultados(true)
              }}
              onKeyDown={onKeyDown}
              placeholder="Buscar insumo (ej: Harina, Huevos...)"
              className="w-full pl-10 pr-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            />
          </div>

          {/* Resultados Autocomplete */}
          {mostrarResultados && busqueda && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
              {cargando ? (
                <div className="p-3 text-center text-gray-500 text-sm">Buscando...</div>
              ) : resultados.length > 0 ? (
                resultados.map((insumo, index) => (
                  <div
                    key={insumo.idInsumo}
                    onClick={() => agregarIngrediente(insumo)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`px-4 py-3 cursor-pointer flex justify-between items-center transition-colors border-b border-gray-50 last:border-0
                      ${index === activeIndex ? "bg-purple-50" : "hover:bg-gray-50"}`}
                  >
                    <div>
                      <span className="font-medium text-gray-800">{insumo.nombre}</span>
                      <span className="text-xs text-gray-400 ml-2">({insumo.unidadMedida})</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      Costo: {formatCurrency(insumo.costo)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-gray-500 text-sm">No se encontraron insumos</div>
              )}
            </div>
          )}
        </div>

        {/* Lista de Ingredientes */}
        <div className="mt-4 space-y-2">
          {receta.length === 0 ? (
            <div className="text-center py-6 text-gray-400 bg-white/50 rounded-lg border border-dashed border-purple-200">
              Agrega insumos para armar tu receta
            </div>
          ) : (
            receta.map((detalle, index) => (
              <div key={detalle.idInsumo} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-purple-100 shadow-sm animate-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="flex-1">
                  <span className="font-medium text-gray-800 block">{detalle.nombreInsumo}</span>
                  <span className="text-xs text-purple-400 font-medium">{detalle.unidadMedida}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={detalle.cantidad || ''}
                    onChange={(e) => {
                      const valor = e.target.value;
                      // Permitir campo vacío o valor numérico
                      if (valor === '' || valor === '0') {
                        actualizarCantidad(detalle.idInsumo, 0);
                      } else {
                        actualizarCantidad(detalle.idInsumo, parseFloat(valor) || 0);
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
                      // Si está vacío al perder foco, establecer en 0
                      if (e.target.value === '') {
                        actualizarCantidad(detalle.idInsumo, 0);
                      }
                    }}
                    className="w-20 px-2 py-1 text-right text-sm border border-gray-200 rounded focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none hover:border-purple-300 transition-colors bg-gray-50 focus:bg-white"
                  />
                  <span className="text-xs text-gray-500 w-8 truncate">{detalle.unidadMedida}</span>
                </div>

                <button
                  onClick={() => eliminarIngrediente(detalle.idInsumo)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  title="Eliminar ingrediente"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
