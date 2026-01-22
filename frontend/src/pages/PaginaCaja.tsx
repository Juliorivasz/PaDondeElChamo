import React, { useEffect, useState } from 'react';
import GraficoIngresos from '../components/caja/GraficoIngresos';
import { TrendingUp, Wallet, DollarSignIcon } from 'lucide-react';
import { useUsuarioStore } from '../store/usuarioStore';
import { getDashboardData } from '../api/cajaApi';
import { formatCurrency } from '../utils/numberFormatUtils';

const PaginaCaja: React.FC = () => {
  const user = useUsuarioStore((state) => state.usuario);

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch Data
  const fetchData = async () => {
    try {
      const dashData = await getDashboardData();
      setDashboardData(dashData);
    } catch (error) {
      console.error("Error fetching caja data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
            <h1 className="text-3xl font-bold text-gray-800">Caja</h1>
            <p className="text-gray-600">Panel de movimientos</p>
          </div>
        </div>
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

          {/* KPI 2: Efectivo en Caja (Simplificado) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between flex-1">
             <div className="flex items-center gap-3 mb-2">
                <Wallet size={32} className="text-gray-500" />
                <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">Flujo de Caja</h3>
             </div>
             <p className="text-gray-600 text-sm">El sistema de arqueos ha sido desactivado.</p>
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


    </div>
  );
};

export default PaginaCaja;
