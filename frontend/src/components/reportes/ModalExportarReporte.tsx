"use client"

import type React from "react"
import { useState } from "react"
import { X, Loader2, Download } from "lucide-react"
import DatePicker from "react-datepicker"
import { descargarReporteDiario, descargarReporteMensual } from "../../api/reporteApi"
import { format } from "date-fns"
import { useEscapeKey } from "../../hooks/useEscapeKey"

interface ModalExportarReporteProps {
  isOpen: boolean
  onClose: () => void
}

const ModalExportarReporte: React.FC<ModalExportarReporteProps> = ({ isOpen, onClose }) => {
  const [tipoReporte, setTipoReporte] = useState<"diario" | "mensual">("diario")
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date>(new Date())
  const [cargando, setCargando] = useState(false)

  const handleExportar = async () => {
    setCargando(true)
    try {
      // Formato de fecha para enviar a la API (siempre YYYY-MM-DD)
      const fechaParaApi = format(fechaSeleccionada, "yyyy-MM-dd")
      
      // --- INICIO DE LA CORRECCIÓN ---
      let nombreArchivo = ""

      if (tipoReporte === "diario") {
        // Formato para el nombre del archivo diario: "dd-MM-yyyy"
        const fechaFormateada = format(fechaSeleccionada, "dd-MM-yyyy")
        nombreArchivo = `VentasDiarias ${fechaFormateada}.xlsx`
        await descargarReporteDiario(fechaParaApi, nombreArchivo)

      } else { // tipoReporte === "mensual"
        // Formato para el nombre del archivo mensual: "Mes-Año"
        const anio = fechaSeleccionada.getFullYear()
        let nombreMes = fechaSeleccionada.toLocaleDateString('es-ES', { month: 'long' })
        nombreMes = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)
        
        nombreArchivo = `Resumen ${nombreMes} ${anio}.xlsx`
        await descargarReporteMensual(fechaParaApi, nombreArchivo)
      }
      // --- FIN DE LA CORRECCIÓN ---

      onClose()
    } catch (error) {
      console.error("Error al exportar reporte:", error)
    } finally {
      setCargando(false)
    }
  }

  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Exportar Reporte</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors" 
            disabled={cargando}
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Radio buttons para tipo de reporte */}
          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tipo de Reporte</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                tipoReporte === "diario" 
                ? "border-verde bg-verde/5 text-verde font-bold" 
                : "border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}>
                <input
                  type="radio"
                  name="tipoReporte"
                  value="diario"
                  checked={tipoReporte === "diario"}
                  onChange={(e) => setTipoReporte(e.target.value as "diario")}
                  className="hidden"
                  disabled={cargando}
                />
                Diario
              </label>
              <label className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                tipoReporte === "mensual" 
                ? "border-verde bg-verde/5 text-verde font-bold" 
                : "border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}>
                <input
                  type="radio"
                  name="tipoReporte"
                  value="mensual"
                  checked={tipoReporte === "mensual"}
                  onChange={(e) => setTipoReporte(e.target.value as "mensual")}
                  className="hidden"
                  disabled={cargando}
                />
                Mensual
              </label>
            </div>
          </div>

          {/* DatePicker condicional */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {tipoReporte === "diario" ? "Seleccionar Fecha" : "Seleccionar Mes y Año"}
            </label>
            <DatePicker
              selected={fechaSeleccionada}
              onChange={(date: Date | null) => date && setFechaSeleccionada(date)}
              showMonthYearPicker={tipoReporte === "mensual"}
              locale="es"
              dateFormat={tipoReporte === "diario" ? "dd/MM/yyyy" : "MM/yyyy"}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde/20 focus:border-verde transition-all font-medium text-gray-700"
              disabled={cargando}
            />
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={onClose}
              className="order-2 sm:order-1 flex-1 px-4 py-2.5 bg-white text-gray-600 rounded-lg font-semibold border border-gray-200 hover:bg-gray-50 transition-all active:scale-95 text-sm shadow-sm"
              disabled={cargando}
            >
              Cancelar
            </button>
            <button
              onClick={handleExportar}
              className="order-1 sm:order-2 flex-[2] px-4 py-2.5 bg-verde text-white rounded-lg font-semibold hover:bg-verde-dark flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50 text-sm"
              disabled={cargando}
            >
              {cargando ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Descargar Excel
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalExportarReporte
