import React from 'react'
import { X, AlertTriangle, AlertCircle, Info, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { AlertaInventario } from '../../types/dto/Alertas'

interface ModalAlertasInventarioProps {
  isOpen: boolean
  onClose: () => void
  alertas: AlertaInventario[]
}

const ModalAlertasInventario: React.FC<ModalAlertasInventarioProps> = ({ isOpen, onClose, alertas }) => {
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleIrAProducto = (idProducto: string, origen: 'PRODUCTO' | 'INSUMO') => {
    if (origen === 'INSUMO') {
      navigate('/insumos')
    } else {
      navigate('/productos')
    }
    onClose()
  }

  const getSeveridadColor = (severidad: string) => {
    switch (severidad) {
      case 'CRITICA':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'ALTA':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'MEDIA':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  const getSeveridadIcon = (severidad: string) => {
    switch (severidad) {
      case 'CRITICA':
        return <AlertTriangle className="text-red-600" size={20} />
      case 'ALTA':
        return <AlertCircle className="text-orange-600" size={20} />
      default:
        return <Info className="text-yellow-600" size={20} />
    }
  }

  // Agrupar por severidad
  const alertasCriticas = alertas.filter(a => a.severidad === 'CRITICA')
  const alertasAltas = alertas.filter(a => a.severidad === 'ALTA')
  const alertasMedias = alertas.filter(a => a.severidad === 'MEDIA')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-orange-500" size={28} />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Alertas de Inventario</h2>
              <p className="text-sm text-gray-600">
                {alertas.length} {alertas.length === 1 ? 'problema detectado' : 'problemas detectados'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {alertas.length === 0 ? (
            <div className="text-center py-12">
              <Info className="mx-auto text-green-500 mb-4" size={48} />
              <p className="text-lg font-medium text-gray-700">¡Todo en orden!</p>
              <p className="text-sm text-gray-500 mt-2">No hay inconsistencias en el inventario</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Críticas */}
              {alertasCriticas.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-red-700 mb-3 flex items-center gap-2">
                    <AlertTriangle size={20} />
                    Críticas ({alertasCriticas.length})
                  </h3>
                  <div className="space-y-2">
                    {alertasCriticas.map(alerta => (
                      <div
                        key={alerta.id}
                        className={`${getSeveridadColor(alerta.severidad)} border rounded-lg p-4 flex items-start justify-between gap-3 hover:shadow-md transition-shadow`}
                      >
                        <div className="flex items-start gap-3 flex-1">
                          {getSeveridadIcon(alerta.severidad)}
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{alerta.nombreProducto}</p>
                            <p className="text-sm mt-1">{alerta.mensaje}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleIrAProducto(alerta.idProducto, alerta.origen)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                        >
                          Ir al producto
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Altas */}
              {alertasAltas.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-orange-700 mb-3 flex items-center gap-2">
                    <AlertCircle size={20} />
                    Altas ({alertasAltas.length})
                  </h3>
                  <div className="space-y-2">
                    {alertasAltas.map(alerta => (
                      <div
                        key={alerta.id}
                        className={`${getSeveridadColor(alerta.severidad)} border rounded-lg p-4 flex items-start justify-between gap-3 hover:shadow-md transition-shadow`}
                      >
                        <div className="flex items-start gap-3 flex-1">
                          {getSeveridadIcon(alerta.severidad)}
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{alerta.nombreProducto}</p>
                            <p className="text-sm mt-1">{alerta.mensaje}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleIrAProducto(alerta.idProducto, alerta.origen)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                        >
                          Ir al producto
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Medias */}
              {alertasMedias.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-yellow-700 mb-3 flex items-center gap-2">
                    <Info size={20} />
                    Medias ({alertasMedias.length})
                  </h3>
                  <div className="space-y-2">
                    {alertasMedias.map(alerta => (
                      <div
                        key={alerta.id}
                        className={`${getSeveridadColor(alerta.severidad)} border rounded-lg p-4 flex items-start justify-between gap-3 hover:shadow-md transition-shadow`}
                      >
                        <div className="flex items-start gap-3 flex-1">
                          {getSeveridadIcon(alerta.severidad)}
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{alerta.nombreProducto}</p>
                            <p className="text-sm mt-1">{alerta.mensaje}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleIrAProducto(alerta.idProducto, alerta.origen)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                        >
                          Ir al producto
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalAlertasInventario
