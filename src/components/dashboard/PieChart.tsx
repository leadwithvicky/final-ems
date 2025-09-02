import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartProps {
  labels: string[];
  values: number[];
}

const PieChart: React.FC<PieChartProps> = ({ labels, values }) => {
  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)'
        ],
        borderWidth: 1,
      },
    ],
  };

  return <div style={{ height: 260 }}><Pie data={data} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} /></div>;
};

export default PieChart;


