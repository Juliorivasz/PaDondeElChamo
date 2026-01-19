"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, AlertTriangle, Info, Save } from "lucide-react"
import { toast } from "react-toastify"
import { resolverDetalle, agregarObservacion } from "../../api/auditoriaApi"
import type { AuditoriaDTO, DetalleAuditoriaDTO } from "../../types/dto/Auditoria"

interface Props {
  isOpen: boolean
  onClose: () => void
  auditoria: AuditoriaDTO | null
  onUpdate: () => void
}

export const ModalDetallesAuditoria: React.FC<Props> = ({ isOpen, onClose, auditoria, onUpdate }) => {
  const [observacion, setObservacion] = useState("")
  const [guardandoObs, setGuardandoObs] = useState(false)
  const [detalleSeleccionado, setDetalleSeleccionado] = useState<DetalleAuditoriaDTO | null>(null)
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)

  useEffect(() => {
    if (auditoria) {
      setObservacion(auditoria.observacion || "")
    }
  }, [auditoria])

  const handleResolver = async (accion: "AJUSTAR" | "IGNORAR") => {
    if (!detalleSeleccionado) return

    try {
      await resolverDetalle(detalleSeleccionado.idDetalleAuditoria, accion)
      toast.success(accion === "AJUSTAR" ? "Stock ajustado correctamente" : "Marcado como solucionado")
      setMostrarConfirmacion(false)
      setDetalleSeleccionado(null)
      onUpdate()
    } catch (error: any) {
      console.error("Error al resolver detalle:", error)
      const mensaje = error.response?.data?.message || "Error al procesar la acción";
      toast.error(mensaje)
    }
  }

  const handleGuardarObservacion = async () => {
    if (!auditoria) return
    try {
      setGuardandoObs(true)
      await agregarObservacion(auditoria.idAuditoria, observacion)
      toast.success("Observación guardada")
      onUpdate()
    } catch (error) {
      console.error("Error al guardar observación:", error)
      toast.error("Error al guardar observación")
    } finally {
      setGuardandoObs(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "APROBADO":
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Aprobado</span>
      case "FALTANTE":
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Faltante</span>
      case "REVISADO_SIN_AJUSTE":
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Revisado (Sin Ajuste)</span>
      case "REVISADO_CON_AJUSTE":
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Revisado (Con Ajuste)</span>
      default:
        return null
    }
  }

  if (!isOpen || !auditoria) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:p-0">
      <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800">Detalles de Auditoría #{auditoria.idAuditoria}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <span className="text-sm text-gray-500 block">Fecha y Hora</span>
            <span className="font-medium text-gray-900">{new Date(auditoria.fechaHora).toLocaleString()}</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <span className="text-sm text-gray-500 block">Usuario</span>
            <span className="font-medium text-gray-900">{auditoria.usuario}</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <span className="text-sm text-gray-500 block">Estado General</span>
            <span
              className={`font-medium ${auditoria.estado === "FINALIZADA"
                ? "text-green-600"
                : auditoria.estado === "PENDIENTE"
                  ? "text-gray-600"
                  : "text-red-600"
                }`}
            >
              {auditoria.estado === "FINALIZADA"
                ? "Finalizada"
                : auditoria.estado === "PENDIENTE"
                  ? "Pendiente"
                  : "A Revisar"}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Resultados del Conteo</h3>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg min-w-[600px] md:min-w-0">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Producto</th>
                  {auditoria.estado !== "PENDIENTE" && (
                    <>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Stock Sistema</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Conteo Real</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Diferencia</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Estado</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {auditoria.detalles.map((detalle) => (
                  <tr
                    key={detalle.idDetalleAuditoria}
                    className={`transition-colors border-b ${detalle.estadoControl === "FALTANTE" && auditoria.estado !== "PENDIENTE"
                      ? "cursor-pointer hover:bg-red-50"
                      : "hover:bg-gray-50"
                      }`}
                    onClick={() => {
                      if (detalle.estadoControl === "FALTANTE" && auditoria.estado !== "PENDIENTE") {
                        setDetalleSeleccionado(detalle)
                        setMostrarConfirmacion(true)
                      }
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{detalle.producto}</div>
                      <div className="text-xs text-gray-500">{detalle.categoria}</div>
                    </td>
                    {auditoria.estado !== "PENDIENTE" && (
                      <>
                        <td className="px-4 py-3 text-center">{detalle.cantidadSistema}</td>
                        <td className="px-4 py-3 text-center">{detalle.cantidadReal}</td>
                        <td className={`px-4 py-3 text-center font-medium ${detalle.cantidadReal - detalle.cantidadSistema !== 0 ? "text-red-600" : "text-green-600"}`}>
                          {detalle.cantidadReal - detalle.cantidadSistema > 0 ? "+" : ""}
                          {detalle.cantidadReal - detalle.cantidadSistema}
                        </td>
                        <td className="px-4 py-3 text-center">{getEstadoBadge(detalle.estadoControl)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Agregar notas sobre esta auditoría..."
            />
            <button
              onClick={handleGuardarObservacion}
              disabled={guardandoObs}
              className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 flex justify-center items-center"
            >
              <Save size={18} />
              <span className="sm:hidden ml-2">Guardar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación para Resolver */}
      {mostrarConfirmacion && detalleSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Resolver Discrepancia</h3>
            <p className="text-gray-600 mb-4">
              Producto: <span className="text-gray-700 font-medium">{detalleSeleccionado.producto}</span>
              <br />
              Diferencia: <span className="text-gray-700 font-medium">{detalleSeleccionado.cantidadReal - detalleSeleccionado.cantidadSistema}</span> unidades
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleResolver("AJUSTAR")}
                className="w-full p-3 bg-yellow-50 border border-yellow-300 rounded-lg flex items-center gap-3 hover:bg-yellow-100 transition-colors"
              >
                <AlertTriangle className="text-yellow-600" />
                <div className="text-left">
                  <div className="font-medium text-yellow-900">Confirmar diferencia y ajustar stock</div>
                  <div className="text-xs text-yellow-700">Se actualizará el stock del producto</div>
                </div>
              </button>

              <button
                onClick={() => handleResolver("IGNORAR")}
                className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3 hover:bg-blue-100 transition-colors"
              >
                <Info className="text-blue-600" />
                <div className="text-left">
                  <div className="font-medium text-blue-900">Marcar como solucionado (Sin ajuste)</div>
                  <div className="text-xs text-blue-700">No se modificará el stock actual</div>
                </div>
              </button>
            </div>

            <button
              onClick={() => {
                setMostrarConfirmacion(false)
                setDetalleSeleccionado(null)
              }}
              className="mt-4 w-full py-2 text-gray-500 hover:text-gray-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
