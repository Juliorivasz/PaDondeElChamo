"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Upload, X, Link as LinkIcon } from "lucide-react"
import { toast } from "react-toastify"

interface ImageUploadProps {
  value: string | File | null
  onChange: (value: string | File | null) => void
  className?: string
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ value, onChange, className = "" }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update preview URL when value changes
  useEffect(() => {
    if (value instanceof File) {
      // Create local preview for File objects
      const objectUrl = URL.createObjectURL(value)
      setPreviewUrl(objectUrl)
      
      // Cleanup function to revoke object URL
      return () => URL.revokeObjectURL(objectUrl)
    } else if (typeof value === 'string') {
      // Use the URL directly for string values
      setPreviewUrl(value)
    } else {
      setPreviewUrl(null)
    }
  }, [value])

  // Handle file selection
  const handleFileUpload = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona un archivo de imagen válido")
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("La imagen no debe superar los 10MB")
      return
    }

    // Store the File object - it will be uploaded when the form is submitted
    onChange(file)
  }, [onChange])

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  // Handle URL input
  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      toast.error("Por favor ingresa una URL válida")
      return
    }

    // Basic URL validation
    try {
      new URL(urlInput)
      onChange(urlInput)
      setUrlInput("")
      setShowUrlInput(false)
      toast.success("URL de imagen agregada")
    } catch {
      toast.error("URL inválida")
    }
  }

  // Handle remove image
  const handleRemove = () => {
    onChange(null)
    setUrlInput("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">Imagen del Producto</label>

      {/* Image Preview */}
      {previewUrl && (
        <div className="relative mb-4 group">
          <div className="w-full h-48 bg-gray-50 rounded-lg border-2 border-gray-200 flex items-center justify-center overflow-hidden">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
            title="Eliminar imagen"
          >
            <X size={16} />
          </button>
          {value instanceof File && (
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
              Vista previa local - se subirá al guardar
            </div>
          )}
        </div>
      )}

      {/* Upload Area */}
      {!value && (
        <>
          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
              isDragging
                ? "border-azul bg-blue-50"
                : "border-gray-300 hover:border-azul hover:bg-gray-50"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className={`mx-auto mb-3 ${isDragging ? "text-azul" : "text-gray-400"}`} size={40} />
            <p className="text-sm font-medium text-gray-700 mb-1">
              Arrastra una imagen aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 10MB</p>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* URL Input Toggle */}
          <div className="mt-3">
            {!showUrlInput ? (
              <button
                type="button"
                onClick={() => setShowUrlInput(true)}
                className="flex items-center gap-2 text-sm text-azul hover:text-azul-dark transition-colors"
              >
                <LinkIcon size={16} />
                <span>O pegar URL de imagen</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleUrlSubmit()
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleUrlSubmit}
                  className="px-4 py-2 bg-azul text-white rounded-md hover:bg-azul-dark transition-colors text-sm"
                >
                  Agregar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUrlInput(false)
                    setUrlInput("")
                  }}
                  className="px-3 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
