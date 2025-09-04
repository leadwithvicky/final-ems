"use client";
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
import { useTheme } from 'next-themes';

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
  const { theme, systemTheme } = useTheme();
  const current = theme === 'system' ? systemTheme : theme;
  const isDark = current === 'dark';
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Monthly Growth',
        data: data.values,
        borderColor: isDark ? 'rgba(59, 130, 246, 1)' : 'rgba(255, 99, 132, 1)',
        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 99, 132, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: { color: isDark ? '#e5e7eb' : '#111827' },
      },
      title: {
        display: true,
        text: 'Monthly Report Growth',
        color: isDark ? '#e5e7eb' : '#111827',
      },
    },
    scales: {
      x: {
        ticks: { color: isDark ? '#cbd5e1' : '#374151' },
        grid: { color: isDark ? 'rgba(75,85,99,0.3)' : 'rgba(229,231,235,1)' },
      },
      y: {
        ticks: { color: isDark ? '#cbd5e1' : '#374151' },
        grid: { color: isDark ? 'rgba(75,85,99,0.3)' : 'rgba(229,231,235,1)' },
      },
    },
  } as const;

  return <Line data={chartData} options={options} />;
};

export default ReportLineChart;
