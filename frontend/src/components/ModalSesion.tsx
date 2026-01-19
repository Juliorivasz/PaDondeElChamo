import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface ModalSesionProps {
  isOpen: boolean;
  timeRemaining: number; // en segundos
  onRenovar: () => void;
  onCerrar: () => void;
}

export const ModalSesion: React.FC<ModalSesionProps> = ({
  isOpen,
  timeRemaining,
  onRenovar,
  onCerrar,
}) => {
  if (!isOpen) return null;

  // Formatear tiempo restante en MM:SS
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 to-rose-700 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Sesión por Expirar</h2>
              <p className="text-rose-100 text-sm">Tu sesión está a punto de finalizar</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="bg-rose-50 p-4 rounded-full">
              <Clock className="w-12 h-12 text-rose-600" />
            </div>
            <div className="text-center">
              <p className="text-gray-700 mb-2">
                Tu sesión expirará en:
              </p>
              <div className="text-5xl font-bold text-rose-600 font-mono">
                {timeString}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 text-center">
              ¿Deseas continuar trabajando? Haz clic en <span className="font-semibold">"Mantener Sesión"</span> para renovar tu sesión automáticamente.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCerrar}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Cerrar Sesión
            </button>
            <button
              onClick={onRenovar}
              className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Mantener Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
