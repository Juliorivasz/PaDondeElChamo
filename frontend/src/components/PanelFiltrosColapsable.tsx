import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface PanelFiltrosColapsableProps {
  titulo?: string
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

export const PanelFiltrosColapsable: React.FC<PanelFiltrosColapsableProps> = ({
  titulo = "Filtros",
  children,
  defaultOpen = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={`bg-white rounded-lg shadow-sm mb-6 ${className}`}>
      {/* Header colapsable */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-gray-800">{titulo}</span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {isOpen ? 'Ocultar' : 'Mostrar'}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="text-gray-600" size={20} />
        ) : (
          <ChevronDown className="text-gray-600" size={20} />
        )}
      </button>

      {/* Contenido colapsable */}
      {isOpen && (
        <div className="p-4 border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  )
}
