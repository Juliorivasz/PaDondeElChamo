"use client"

import type React from "react"
import { useState, useRef } from "react"
import { X, ZoomIn } from "lucide-react"
import { useEscapeKey } from "../hooks/useEscapeKey"

interface Props {
  isOpen: boolean
  imageUrl: string
  imageName: string
  onClose: () => void
}

export const ModalImagenPreview: React.FC<Props> = ({ isOpen, imageUrl, imageName, onClose }) => {
  const [showMagnifier, setShowMagnifier] = useState(false)
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 })
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const imageRef = useRef<HTMLImageElement>(null)

  useEscapeKey(onClose, isOpen)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return

    const rect = imageRef.current.getBoundingClientRect()
    const containerRect = e.currentTarget.getBoundingClientRect()
    
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if mouse is over the image
    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      setShowMagnifier(true)
      
      // Position relative to container
      let containerX = e.clientX - containerRect.left
      let containerY = e.clientY - containerRect.top
      
      // Magnifier dimensions
      const magnifierSize = 200
      const magnifierRadius = magnifierSize / 2
      const padding = 10 // Extra padding from edges
      
      // Keep magnifier within container bounds
      const minX = magnifierRadius + padding
      const maxX = containerRect.width - magnifierRadius - padding
      const minY = magnifierRadius + padding
      const maxY = containerRect.height - magnifierRadius - padding
      
      // Clamp position to keep magnifier fully visible
      containerX = Math.max(minX, Math.min(maxX, containerX))
      containerY = Math.max(minY, Math.min(maxY, containerY))
      
      setMagnifierPosition({ x: containerX, y: containerY })
      
      // Calculate the position in the original image for background
      const xPercent = (x / rect.width) * 100
      const yPercent = (y / rect.height) * 100
      setImagePosition({ x: xPercent, y: yPercent })
    } else {
      setShowMagnifier(false)
    }
  }

  const handleMouseLeave = () => {
    setShowMagnifier(false)
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="relative max-w-5xl max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-800 truncate">{imageName}</h3>
            <div className="flex items-center gap-1 text-sm text-gray-500 bg-blue-50 px-2 py-1 rounded">
              <ZoomIn size={14} />
              <span>Pasa el mouse para ampliar</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            title="Cerrar"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Image Container */}
        <div 
          className="p-4 flex items-center justify-center bg-gray-100 relative overflow-hidden"
          style={{ height: 'calc(90vh - 10rem)' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt={imageName}
            className="max-w-full max-h-full object-contain rounded select-none"
            draggable={false}
          />

          {/* Magnifying Glass */}
          {showMagnifier && (
            <div
              className="absolute pointer-events-none border-4 border-white shadow-2xl rounded-full overflow-hidden bg-white"
              style={{
                width: '200px',
                height: '200px',
                left: `${magnifierPosition.x}px`,
                top: `${magnifierPosition.y}px`,
                transform: 'translate(-50%, -50%)',
                backgroundImage: `url(${imageUrl})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: '300%',
                backgroundPosition: `${imagePosition.x}% ${imagePosition.y}%`,
                zIndex: 1000,
              }}
            >
              {/* Inner border for better visibility */}
              <div className="absolute inset-0 border-2 border-gray-400 rounded-full" />
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            Mueve el cursor sobre la imagen para ver los detalles • ESC para cerrar
          </p>
        </div>
      </div>
    </div>
  )
}
