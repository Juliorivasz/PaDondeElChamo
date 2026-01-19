"use client"

import { Power } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { apagarServidor } from "../api/appApi"
import type React from "react"
import { type FC, useEffect } from "react"
import ReactDOM from "react-dom"

interface ModalConfirmacionApagadoProps {
  isOpen: boolean
  onClose: () => void
}

const ModalConfirmacionApagado: FC<ModalConfirmacionApagadoProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()

  const confirmarApagado = async () => {
    onClose()
    navigate("/apagado")
    apagarServidor()
  }

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center mb-4">
          <Power size={24} className="text-rojo mr-3" />
          <h3 id="modal-title" className="text-lg font-semibold text-gray-800">
            Confirmar Apagado
          </h3>
        </div>
        <p className="text-gray-600 mb-6">
          ¿Estás seguro de que deseas apagar la aplicación? Esto cerrará el servidor para todos los usuarios.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white text-gray-700 hover:text-gray-900 rounded transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={confirmarApagado}
            className="px-4 py-2 bg-rojo text-white rounded hover:bg-rojo-dark transition-colors"
          >
            Apagar
          </button>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root')!
  )
}

export default ModalConfirmacionApagado
