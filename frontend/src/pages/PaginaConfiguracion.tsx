"use client"

import { useState, useEffect } from "react"
import { obtenerConfiguracion, actualizarConfiguracion } from "../api/configuracionApi"
import { toast } from "react-toastify"
import type { ConfiguracionDTO } from "../types/dto/Configuracion"
import { InputMoneda } from "../components/InputMoneda"
import { InputPorcentaje } from "../components/InputPorcentaje"
import { Settings } from "lucide-react"

const PaginaConfiguracion = () => {
  const [config, setConfig] = useState<ConfiguracionDTO>({
    descuentoAutomatico: false,
    montoMinimo: 0,
    porcentajeDescuento: 0,
    cantProductosRevision: 3,
    revisionActiva: false,
  })
  const [modoEdicion, setModoEdicion] = useState(false)
  const [configOriginal, setConfigOriginal] = useState<ConfiguracionDTO | null>(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  // Cargar configuración al montar el componente
  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        const data = await obtenerConfiguracion()
        // Ensure numeric fields are actually numbers (TypeORM decimal returns string)
        setConfig({
          ...data,
          montoMinimo: Number(data.montoMinimo),
          porcentajeDescuento: Number(data.porcentajeDescuento),
          cantProductosRevision: Number(data.cantProductosRevision)
        })
      } catch (error) {
        toast.error("Error al cargar la configuración")
        console.error(error)
      } finally {
        setCargando(false)
      }
    }

    cargarConfiguracion()
  }, [])

  const handleEditar = () => {
    setConfigOriginal({ ...config })
    setModoEdicion(true)
  }

  const handleCancelar = () => {
    if (configOriginal) {
      setConfig(configOriginal)
    }
    setModoEdicion(false)
    setConfigOriginal(null)
  }

  const handleGuardar = async () => {
    setGuardando(true)
    try {
      await actualizarConfiguracion(config)
      toast.success("Configuración guardada exitosamente")
      setModoEdicion(false)
      setConfigOriginal(null)
    } catch (error) {
      toast.error("Error al guardar la configuración")
      console.error(error)
    } finally {
      setGuardando(false)
    }
  }

  const handleToggleDescuento = async (checked: boolean) => {
    setConfig({ ...config, descuentoAutomatico: checked })

    // Si no estamos en modo edición, guardar inmediatamente
    if (!modoEdicion) {
      try {
        await actualizarConfiguracion({ ...config, descuentoAutomatico: checked })
        toast.success("Configuración actualizada")
      } catch (error) {
        toast.error("Error al actualizar la configuración")
        console.error(error)
        // Revertir el cambio en caso de error
        setConfig({ ...config, descuentoAutomatico: !checked })
      }
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="text-azul" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Configuración</h1>
            <p className="text-gray-600">Ajustes de la aplicación</p>
          </div>
        </div>
      </div>

      {/* Tarjeta de Descuentos Automáticos */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-8 max-w-2xl border border-gray-100">

        {/* Encabezado con Título y Toggle Estilizado */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0 mb-8 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Descuento Automático</h2>
            <p className="text-sm text-gray-500 mt-1">Configura las reglas para aplicar descuentos en ventas grandes.</p>
          </div>

          {/* Switch/Toggle (Estilo Página Productos) */}
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${config.descuentoAutomatico ? "text-green-600" : "text-red-500"}`}>
              {config.descuentoAutomatico ? "ACTIVO" : "INACTIVO"}
            </span>

            <button
              onClick={() => handleToggleDescuento(!config.descuentoAutomatico)}
              disabled={!modoEdicion} // Bloqueamos si no se está editando
              type="button"
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${config.descuentoAutomatico
                ? "bg-toggleOn focus:ring-toggleOn"
                : "bg-toggleOff focus:ring-toggleOff"
                } ${!modoEdicion ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${config.descuentoAutomatico ? "translate-x-7" : "translate-x-1"
                  }`}
              />
            </button>
          </div>
        </div>

        {/* Cuerpo con los Inputs (Diseño Grid) */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-6 transition-opacity duration-300`}>

          {/* Input Monto Mínimo */}
          <div className="relative">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Monto Mínimo
            </label>
            <InputMoneda
              value={config.montoMinimo || 0}
              onValueChange={(value) => setConfig({ ...config, montoMinimo: value || 0 })}
              placeholder="$ 0"
              disabled={!modoEdicion}
              className="w-full pl-4 pr-4 py-3 text-xl font-semibold text-gray-800 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:text-gray-500 disabled:bg-white"
            />
            <p className="text-xs text-gray-400 mt-2">A partir de este monto se aplica el descuento.</p>
          </div>

          {/* Input Porcentaje */}
          <div className="relative">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Porcentaje
            </label>
            <InputPorcentaje
              value={config.porcentajeDescuento}
              onValueChange={(value) => setConfig({ ...config, porcentajeDescuento: value })}
              placeholder="0%"
              disabled={!modoEdicion}
              className="w-full px-4 py-3 text-xl font-semibold text-gray-800 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:text-gray-500 disabled:bg-white"
            />
            <p className="text-xs text-gray-400 mt-2">Porcentaje que se descontará del total.</p>
          </div>
        </div>

        {/* Payment Methods Selection */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
            Métodos de pago válidos para descuento
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 w-full md:w-[30rem] gap-2">
            {['EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO'].map((method) => (
              <label key={method} className={`flex items-center space-x-3 rounded-lg transition-all 
              ${!modoEdicion ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  className="h-4 w-4 text-verde rounded focus:ring-verde"
                  disabled={!modoEdicion}
                  checked={config.metodosPagoDescuento?.includes(method) || false}
                  onChange={(e) => {
                    const currentMethods = config.metodosPagoDescuento || [];
                    let newMethods;
                    if (e.target.checked) {
                      newMethods = [...currentMethods, method];
                    } else {
                      newMethods = currentMethods.filter(m => m !== method);
                    }
                    setConfig({ ...config, metodosPagoDescuento: newMethods });
                  }}
                />
                <span className="text-sm font-medium text-gray-700">{method}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-wrap justify-end gap-4 mt-8">
          {!modoEdicion ? (
            <button
              onClick={handleEditar}
              className="px-6 py-2.5 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
            >
              Editar
            </button>
          ) : (
            <>
              <button
                onClick={handleCancelar}
                className="px-6 py-2.5 text-gray-600 font-medium hover:text-gray-900 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={guardando}
                className="px-8 py-2.5 bg-verde text-white font-medium rounded-lg hover:bg-verde-dark disabled:bg-blue-300 disabled:cursor-not-allowed shadow-md transition-all transform active:scale-95"
              >
                {guardando ? "Guardando..." : "Guardar Cambios"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PaginaConfiguracion
