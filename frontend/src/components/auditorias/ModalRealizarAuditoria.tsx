"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, Save, Cctv, AlertTriangle } from "lucide-react"
import { toast } from "react-toastify"
import { iniciarAuditoria, registrarConteo } from "../../api/auditoriaApi"
import { obtenerConfiguracion } from "../../api/configuracionApi"
import type { ItemAuditoriaDTO, ConteoDTO } from "../../types/dto/Auditoria"

interface Props {
  isOpen: boolean
  onClose: () => void
  idUsuario: number
}

export const ModalRealizarAuditoria: React.FC<Props> = ({ isOpen, onClose, idUsuario }) => {
  const [items, setItems] = useState<ItemAuditoriaDTO[]>([])
  const [conteos, setConteos] = useState<Record<number, number>>({})
  const [idAuditoria, setIdAuditoria] = useState<number | null>(null)
  const [cargando, setCargando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [revisionActiva, setRevisionActiva] = useState(true)
  const [verificandoConfig, setVerificandoConfig] = useState(true)

  useEffect(() => {
    if (isOpen) {
      verificarConfiguracion()
      setItems([])
      setConteos({})
      setIdAuditoria(null)
    }
  }, [isOpen])

  const verificarConfiguracion = async () => {
    try {
      setVerificandoConfig(true)
      const config = await obtenerConfiguracion()
      setRevisionActiva(config.revisionActiva)
      if (config.revisionActiva && idUsuario) {
        cargarAuditoria()
      }
    } catch (error) {
      console.error("Error al verificar configuración:", error)
      toast.error("Error al verificar configuración de auditoría")
    } finally {
      setVerificandoConfig(false)
    }
  }

  const cargarAuditoria = async () => {
    try {
      setCargando(true)
      const nuevaAuditoria = await iniciarAuditoria(idUsuario)
      setIdAuditoria(nuevaAuditoria.idAuditoria)
      setItems(nuevaAuditoria.items)

      // Inicializar conteos en 0
      const inicial: Record<number, number> = {}
      nuevaAuditoria.items.forEach(item => {
        inicial[item.idDetalleAuditoria] = 0
      })
      setConteos(inicial)

    } catch (error) {
      console.error("Error al iniciar auditoría:", error)
      toast.error("Error al iniciar la auditoría")
      onClose()
    } finally {
      setCargando(false)
    }
  }

  const handleConteoChange = (idDetalle: number, valor: string) => {
    const numero = parseInt(valor) || 0
    setConteos(prev => ({
      ...prev,
      [idDetalle]: numero
    }))
  }

  const guardar = async () => {
    if (!idAuditoria) return

    try {
      setEnviando(true)
      const listaConteos: ConteoDTO[] = Object.entries(conteos).map(([id, cantidad]) => ({
        idDetalleAuditoria: Number(id),
        cantidadReal: cantidad
      }))

      await registrarConteo(idAuditoria, listaConteos)
      toast.success("Auditoría registrada correctamente")
      onClose()
    } catch (error) {
      console.error("Error al guardar conteo:", error)
      toast.error("Error al guardar los datos")
    } finally {
      setEnviando(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:p-0">
      <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Cctv className="text-secondary" size={24} />
            <h2 className="text-lg md:text-xl font-bold text-gray-800">Realizar Auditoría de Stock</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {verificandoConfig ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : !revisionActiva ? (
          <div className="text-center py-8">
            <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg inline-block mb-4">
              <AlertTriangle size={48} className="mx-auto mb-2" />
              <p className="font-medium">La auditoría está desactivada</p>
            </div>
            <p className="text-gray-600 mb-6">
              Para realizar una auditoría, debe activar la opción "Revisión Activa" desde la configuración del sistema.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : cargando ? (
          <div className="text-center py-8">Cargando productos...</div>
        ) : (
          <div className="space-y-6">
            <p className="text-gray-600 text-sm md:text-base">
              Por favor, cuente el stock físico de los siguientes productos e ingrese la cantidad real.
            </p>

            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.idDetalleAuditoria} className="bg-gray-50 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <div className="w-full sm:w-auto">
                    <h3 className="font-medium text-gray-900">{item.producto}</h3>
                    <p className="text-sm text-gray-500">{item.categoria}</p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3">
                    <label className="text-sm font-medium text-gray-700">Cantidad Real:</label>
                    <input
                      type="number"
                      min="0"
                      value={conteos[item.idDetalleAuditoria]}
                      onChange={(e) => handleConteoChange(item.idDetalleAuditoria, e.target.value)}
                      className="w-24 p-2 border border-gray-300 rounded-md text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={guardar}
                disabled={enviando}
                className="px-6 py-2 bg-verde text-white rounded-lg hover:bg-verde-dark disabled:bg-gray-400 flex items-center gap-2"
              >
                <Save size={18} />
                {enviando ? "Guardando..." : "Guardar Auditoría"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
