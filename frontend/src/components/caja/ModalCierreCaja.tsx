import React, { useState } from 'react';
import { cerrarTurno } from '../../api/cajaApi';
import { Lock, LogOut, X } from 'lucide-react';
import { InputMoneda } from '../InputMoneda';
import { useUsuarioStore } from '../../store/usuarioStore';
import { toast } from 'react-toastify';

interface ModalCierreCajaProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSkip?: () => void; // Optional: Allow logout without closing cash
  idUsuario: number;
}

const ModalCierreCaja: React.FC<ModalCierreCajaProps> = ({ isOpen, onClose, onSuccess, onSkip, idUsuario }) => {
  const user = useUsuarioStore(state => state.usuario);
  const isAdmin = user?.rol === 'ADMIN';

  const [efectivoReal, setEfectivoReal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin && efectivoReal === null) return; 
    
    try {
      setLoading(true);
      // Send null if Admin (Quick Close), backend will auto-calc
      await cerrarTurno({ idUsuario, efectivoReal: isAdmin ? null as any : efectivoReal });
      
      onSuccess();
    } catch (error: any) {
      // If Admin and 404 (Not Found), it means no session was open. Just logout.
      if (isAdmin && error.response?.status === 404) {
          onSuccess();
          return;
      }
      console.error(error);
      const msg = error.response?.data?.message || 'No se pudo cerrar la caja';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-100">
        
        {/* Header Updated */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-rojo/5">
            <h2 className="text-lg font-bold text-rojo-dark flex items-center gap-2">
                <Lock className="text-rojo" size={20} />
                {isAdmin ? 'Cerrar Turno' : 'Cierre de Caja'}
            </h2>
            <button 
                onClick={onClose}
                className="text-rojo/60 hover:text-rojo hover:bg-rojo/10 p-2 rounded-full transition-colors"
            >
                <X size={20} />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {!isAdmin ? (
              // EMPLOYEE FLOW (Count Cash)
              <div className="mb-8">
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide text-center">
                    Confirmar Efectivo en Caja
                </label>
                <p className="text-xs text-gray-500 text-center mb-4 px-4">
                    Por favor, cuenta el dinero físico y escribe el total exacto.
                </p>

                <div className="relative">
                    <InputMoneda
                        className="w-full py-4 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-rojo/10 focus:border-rojo outline-none transition-all font-mono text-3xl font-bold text-gray-800 placeholder-gray-300 text-center"
                        value={efectivoReal}
                        onValueChange={(val) => setEfectivoReal(val)}
                        placeholder="$ 0.00"
                        required
                        autoFocus
                    />
                </div>
              </div>
          ) : (
              // ADMIN FLOW (Quick Close)
              <div className="mb-8 text-center">
                  <div className="bg-rojo/5 p-4 rounded-xl mb-4">
                      <p className="text-rojo-dark font-medium">Cierre Rápido Administrativo</p>
                  </div>
                  <p className="text-gray-600">
                      Se cerrará tu turno actual asumiendo que el efectivo real coincide con el teórico del sistema.
                  </p>
              </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              className="w-full py-3.5 bg-rojo text-white font-bold rounded-xl hover:bg-rojo-dark active:scale-95 transition-all shadow-lg hover:shadow-rojo/25 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                  'Cerrando...'
              ) : (
                <>
                    <LogOut size={20} />
                    Confirmar y Salir
                </>
              )}
            </button>
            
            {/* Skip button for employees */}
            {!isAdmin && onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="w-full py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium rounded-xl transition-colors"
                disabled={loading}
              >
                Salir sin cerrar caja
              </button>
            )}
            
            <button
              type="button"
              onClick={onClose} 
              className="w-full py-3 bg-transparent text-gray-400 hover:text-gray-600 font-medium text-sm transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalCierreCaja;
