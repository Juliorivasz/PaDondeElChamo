import React, { useEffect, useState } from 'react';
import GraficoIngresos from '../components/caja/GraficoIngresos';
import { TrendingUp, Wallet, ArrowRight, DollarSignIcon, LogOut, AlertTriangle, CirclePlay } from 'lucide-react';
import ModalRetiroEfectivo from '../components/caja/ModalRetiroEfectivo';
import { useUsuarioStore } from '../store/usuarioStore';
import { getDashboardData, getHistorialArqueos, checkSessionStatus, abrirCajaManual, cerrarTurno } from '../api/cajaApi';
import { formatCurrency } from '../utils/numberFormatUtils';
import { toast } from 'react-toastify';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { obtenerUsuariosActivos } from "../api/usuarioApi";
import type { Usuario } from "../types/dto/Usuario";
import { BrushCleaning } from 'lucide-react';

const PaginaCaja: React.FC = () => {
  const user = useUsuarioStore((state) => state.usuario);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [arqueos, setArqueos] = useState<any[]>([]);
  const [showRetiroModal, setShowRetiroModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Arqueo Control State
  const [sessionActive, setSessionActive] = useState<boolean>(false);
  const [checkingSession, setCheckingSession] = useState<boolean>(true);
  const [mostrarModalCierre, setMostrarModalCierre] = useState(false);

  // Filter State
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filtros, setFiltros] = useState({
    fechaInicio: null as Date | null,
    fechaFin: null as Date | null,
    idUsuario: null as number | null,
    diferencia: false,
    stockCheck: "" as string, // "" | "true" | "false"
  });

  const handleFiltroChange = (campo: string, valor: any) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      fechaInicio: null,
      fechaFin: null,
      idUsuario: null,
      diferencia: false,
      stockCheck: ""
    });
  };
  // Fetch Data
  const fetchData = async () => {
    try {
      const [dashData, arqueoData, sessionStatus, usersData] = await Promise.all([
        getDashboardData(),
        getHistorialArqueos({
          fechaInicio: filtros.fechaInicio ? filtros.fechaInicio.toISOString() : undefined,
          fechaFin: filtros.fechaFin ? filtros.fechaFin.toISOString() : undefined,
          idUsuario: filtros.idUsuario,
          diferencia: filtros.diferencia,
          stockCheck: filtros.stockCheck
        }),
        checkSessionStatus(user?.idUsuario || 0),
        obtenerUsuariosActivos()
      ]);
      setDashboardData(dashData);
      setArqueos(arqueoData);
      setSessionActive(sessionStatus.active);
      setUsuarios(usersData);
      setCheckingSession(false);
    } catch (error) {
      console.error("Error fetching caja data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filtros]); // Refetch when filters change

  if (!user || user.rol !== 'ADMIN') {
    return <div className="p-8 text-center text-red-600">Acceso restringido a Administradores.</div>;
  }

  if (loading) return <div className="p-8">Cargando datos de caja...</div>;

  // Prepare Chart Data
  // dashboardData.chartData is [{ date: '2023-01-01', total: 100 }, ...]
  // convert to [['Fecha', 'Ingresos'], ...]
  const chartData: (string | number)[][] = [['Fecha', 'Ingresos']];
  if (dashboardData?.chartData) {
    dashboardData.chartData.forEach((item: any) => {
      // Date might be string "2023-01-01"
      const dateObj = new Date(item.date);
      // Get day name (e.g., "viernes")
      const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
      // Get day/month (e.g., "2/1")
      const dayMonth = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'numeric' });
      // Combine: "Viernes 2/1"
      const formattedDate = `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayMonth}`;

      chartData.push([formattedDate, Number(item.total)]);
    });
  }

  return (
    <div className="p-6 min-h-screen">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <DollarSignIcon className="text-azul" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Caja y Arqueos</h1>
            <p className="text-gray-600">Panel de control de caja</p>
          </div>
        </div>

        {/* Botón dinámico de Control de Arqueo */}
        {!checkingSession && (
          sessionActive ? (
            <button
              onClick={() => setMostrarModalCierre(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-rojo text-white rounded-md hover:bg-rojo-darker hover:shadow-md transition-all font-semibold"
            >
              <LogOut size={18} />
              <span>Finalizar Arqueo Actual</span>
            </button>
          ) : (
            <button
              onClick={async () => {
                if (!user) return;
                try {
                  await abrirCajaManual(user.idUsuario);
                  setSessionActive(true);
                  toast.success("Turno iniciado correctamente");
                  fetchData(); // Reload data
                } catch (e: any) {
                  if (e.response && e.response.status === 409) {
                    // Conflict: Arqueo already exists
                    toast.warning(e.response.data.message || "Ya existe un turno en curso");
                  } else {
                    toast.error("Error al iniciar turno");
                  }
                }
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-azul text-white font-semibold rounded-md hover:bg-azul-dark"
            >
              <CirclePlay size={20} />
              <span>Iniciar Arqueo</span>
            </button>
          )
        )}
      </div>

      {/* Top Section: KPIs & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Left Column: KPIs stacked */}
        <div className="flex flex-col gap-6 lg:col-span-1">

          {/* KPI 1: Recaudado Hoy */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-100">
              <TrendingUp size={80} className="text-verde" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">Recaudado Hoy</h3>
              </div>

              <p className="text-4xl font-bold text-gray-800 mt-2 tracking-tight">
                {formatCurrency(dashboardData?.totalRecaudado)}
              </p>

              <div className="mt-6 space-y-2">
                {Object.entries(dashboardData?.porMetodo || {}).map(([metodo, monto]: any) => (
                  <div key={metodo} className="flex justify-between items-center text-sm border-b border-gray-50 pb-1 last:border-0 last:pb-0">
                    <span className="text-gray-500 font-medium">{metodo}</span>
                    <span className="font-semibold text-gray-700">${Number(monto).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* KPI 2: Efectivo en Caja */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col justify-between flex-1">
            <div className="absolute top-0 right-0 p-4 opacity-100">
              <Wallet size={80} className="text-gray-500" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">Efectivo en Caja</h3>
              </div>
              <p className="text-xs text-gray-400 font-semibold mb-1">Teórico Calculado</p>
              <p className="text-4xl font-bold text-gray-800 tracking-tight">
                {formatCurrency(dashboardData?.efectivoEnCaja)}
              </p>
              <p className="text-xs text-gray-400 mt-2 italic">
                (Inicial + Ventas Efectivo - Retiros)
              </p>
            </div>

            <button
              onClick={() => setShowRetiroModal(true)}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-verde text-white py-3 px-4 rounded-xl hover:bg-verde-dark transition-colors shadow-lg active:scale-95 group/btn relative z-20"
            >
              <span>Registrar Retiro</span>
              <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right Column: Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6 h-full min-h-[400px]">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Ingresos Últimos 7 Días</h3>
          <div className="h-[350px] w-full">
            <GraficoIngresos data={chartData} />
          </div>
        </div>
      </div>

      <h2 className="px-6 py-4 text-xl font-semibold border-b bg-gray-50">Historial de Cierres de Caja</h2>

      {/* Filter Panel */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          {/* Date Filters */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Fecha Inicio</label>
            <DatePicker
              selected={filtros.fechaInicio}
              onChange={(date) => handleFiltroChange("fechaInicio", date)}
              locale="es"
              dateFormat="dd/MM/yyyy"
              placeholderText="Seleccionar fecha"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Fecha Fin</label>
            <DatePicker
              selected={filtros.fechaFin}
              onChange={(date) => handleFiltroChange("fechaFin", date)}
              locale="es"
              dateFormat="dd/MM/yyyy"
              placeholderText="Seleccionar fecha"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all"
            />
          </div>

          {/* User Filter */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Usuario</label>
            <select
              value={filtros.idUsuario || ""}
              onChange={(e) => handleFiltroChange("idUsuario", e.target.value ? Number(e.target.value) : null)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all appearance-none"
            >
              <option value="">Todos los usuarios</option>
              {usuarios.map((u) => (
                <option key={u.idUsuario} value={u.idUsuario}>
                  {u.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Check Filter */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Stock Check</label>
            <select
              value={filtros.stockCheck}
              onChange={(e) => handleFiltroChange("stockCheck", e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul transition-all appearance-none"
            >
              <option value="">Todos</option>
              <option value="true">Realizado</option>
              <option value="false">No Realizado</option>
            </select>
          </div>

          {/* Actions: Diferencia Toggle & Clear */}
          <div className="flex gap-2">
            <button
              onClick={() => handleFiltroChange("diferencia", !filtros.diferencia)}
              className={`w-full mt-5 h-[45px] flex items-center justify-center border px-4 py-2 rounded-lg text-sm font-semibold tracking-wider transition-all shadow-sm ${filtros.diferencia
                ? "bg-amber-100 border-amber-400 text-amber-700 shadow-sm"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              title="Mostrar solo con diferencias"
            >
              <AlertTriangle size={16} className="mr-2" />
              <span className="hidden xl:inline">Diferencia</span>
            </button>

            <button
              onClick={limpiarFiltros}
              className="p-2.5 mt-5 h-[45px] bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center justify-center group w-full lg:w-fit shadow-sm"
              title="Limpiar filtros"
            >
              <BrushCleaning size={20} className="group-hover:rotate-12 transition-transform mr-2 lg:mr-0" />
              <span className="lg:hidden font-semibold">Limpiar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table: Arqueo History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inicio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cierre</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ef. Inicial</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Teórico Final</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Real</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Diferencia</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Realizó Control</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {arqueos.map((arq: any) => (
                <tr key={arq.idArqueo} className="hover:bg-gray-50 border-b last:border-0">
                  <td className="px-6 py-3">{new Date(arq.inicioSesion).toLocaleDateString()}</td>
                  <td className="px-6 py-3 font-medium">{arq.usuario?.nombre || 'N/A'}</td>
                  <td className="px-6 py-3">{new Date(arq.inicioSesion).toLocaleTimeString()}</td>
                  <td className="px-6 py-3">
                    {arq.cierreSesion ? new Date(arq.cierreSesion).toLocaleTimeString() : <span className="text-green-600 italic">En curso</span>}
                  </td>
                  <td className="px-6 py-3 text-right text-gray-500">${Number(arq.efectivoInicial || 0).toLocaleString()}</td>
                  <td className="px-6 py-3 text-right">
                    {arq.efectivoTeorico === null || arq.efectivoTeorico === undefined
                      ? <span className="text-gray-400">-</span>
                      : `$${Number(arq.efectivoTeorico).toLocaleString()}`
                    }
                  </td>
                  <td className="px-6 py-3 text-right font-semibold">
                    {arq.cierreSesion ? `$${Number(arq.efectivoReal || 0).toLocaleString()}` : <span className="text-gray-400">-</span>}
                  </td>
                  <td className={`px-6 py-3 text-right font-bold ${!arq.cierreSesion ? 'text-gray-400' : arq.diferencia < 0 ? 'text-red-500' : arq.diferencia > 0 ? 'text-green-500' : 'text-gray-500'}`}>
                    {arq.cierreSesion ? `$${Number(arq.diferencia || 0).toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {arq.realizoControlStock ?
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Sí</span> :
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">No</span>
                    }
                  </td>
                </tr>
              ))}
              {arqueos.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">No hay registros de arqueo.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ModalRetiroEfectivo
        isOpen={showRetiroModal}
        onClose={() => setShowRetiroModal(false)}
        onSuccess={fetchData}
        idUsuario={user?.idUsuario || 0}
      />

      {/* Premium Confirmation Modal for Closing Shift */}
      {mostrarModalCierre && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 ring-1 ring-gray-200">
            <div className="p-6">
              <div className="flex flex-col items-center text-center mb-2">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-rojo">
                  <AlertTriangle size={32} />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">¿Cerrar el turno actual?</h4>
                <p className="text-gray-500 leading-relaxed">
                  Al confirmar, se cerrará tu sesión de caja y se calculará el efectivo esperado.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-4 flex gap-3">
              <button
                onClick={() => setMostrarModalCierre(false)}
                className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!user) return;
                  try {
                    await cerrarTurno({ idUsuario: user.idUsuario, efectivoReal: null as any });
                    setSessionActive(false);
                    setMostrarModalCierre(false);
                    toast.success("Turno finalizado correctamente");
                    fetchData(); // Reload data
                  } catch (error) {
                    toast.error("Error al finalizar el turno");
                  }
                }}
                className="flex-1 py-2.5 bg-rojo text-white font-semibold rounded-xl hover:bg-rojo-darker transition-all flex items-center justify-center gap-2"
              >
                <LogOut size={18} />
                Finalizar Turno
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaginaCaja;
