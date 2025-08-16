import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ReportLineChartProps {
  data: { labels: string[]; values: number[] };
}

const ReportLineChart: React.FC<ReportLineChartProps> = ({ data }) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Monthly Growth',
        data: data.values,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Report Growth',
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export default ReportLineChart;
