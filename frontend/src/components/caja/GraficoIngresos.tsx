import React from 'react';
import { Chart } from 'react-google-charts';

interface GraficoIngresosProps {
  data: any[]; // Expect format [['Fecha', 'Ingresos'], ['2023-01', 100], ...]
}

const GraficoIngresos: React.FC<GraficoIngresosProps> = ({ data }) => {
  const options = {
    pointSize: 7,
    lineWidth: 4,
    hAxis: {
      slantedText: true,
      slantedTextAngle: 50,
    },
    vAxis: {
      format: "$ #,##0",
    },
    colors: ['#85AD85'],
    legend: {
      position: "top",
      alignment: "center",
      textStyle: {
        fontSize: 16,
      },
    },
    backgroundColor: 'transparent',
    chartArea: { left: 65, top: 30, right: 10, width: "80%", height: "70%" },
  };

  return (
    <div className="w-full h-full">
      {data && data.length > 1 ? (
        <Chart
          chartType="LineChart"
          width="100%"
          height="100%"
          data={data}
          options={options}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-400">
          No hay datos suficientes para mostrar el gráfico
        </div>
      )}
    </div>
  );
};

export default GraficoIngresos;
