import React, { useState } from 'react';
import { crearRetiro } from '../../api/cajaApi';
import { Banknote, X, ArrowRight } from 'lucide-react';

interface ModalRetiroEfectivoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  idUsuario: number;
}

import { InputMoneda } from '../InputMoneda';
import { toast } from 'react-toastify';

interface ModalRetiroEfectivoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  idUsuario: number;
}

const ModalRetiroEfectivo: React.FC<ModalRetiroEfectivoProps> = ({ isOpen, onClose, onSuccess, idUsuario }) => {
  const [cantidad, setCantidad] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cantidad || cantidad <= 0) return;

    try {
      setLoading(true);
      await crearRetiro({ cantidad: cantidad, idUsuario });

      toast.success('Retiro registrado');
      setCantidad(null);
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('No se pudo registrar el retiro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-verde/5">
          <h2 className="text-lg font-bold text-verde-dark flex items-center gap-2">
            <Banknote className="text-verde" size={20} />
            Retirar Efectivo
          </h2>
          <button
            onClick={onClose}
            className="text-verde/60 hover:text-verde hover:bg-verde/10 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad a retirar</label>
            <div className="relative">
              <InputMoneda
                className="w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-verde focus:border-transparent outline-none transition-all font-mono text-lg text-gray-800 placeholder-gray-400"
                value={cantidad}
                onValueChange={(val) => setCantidad(val)}
                placeholder="$ 0.00"
                required
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 px-1">
              Este monto se descontará del efectivo teórico actual de la caja.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 font-medium rounded-xl transition-colors w-1/3"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-verde text-white font-semibold rounded-xl hover:bg-verde-dark active:scale-95 transition-all shadow-lg hover:shadow-verde/25 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <span className="animate-pulse">Procesando...</span>
              ) : (
                <>
                  Confirmar Retiro
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalRetiroEfectivo;
