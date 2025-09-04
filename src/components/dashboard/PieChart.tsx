'use client';
import React, { useMemo } from 'react';
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

import { useTheme } from 'next-themes';

const PieChart: React.FC<PieChartProps> = ({ labels, values }) => {
  const { theme, systemTheme } = useTheme();
  const current = theme === 'system' ? systemTheme : theme;
  const isDark = current === 'dark';

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: [
          isDark ? 'rgba(59, 130, 246, 0.7)' : 'rgba(54, 162, 235, 0.6)',
          isDark ? 'rgba(248, 113, 113, 0.7)' : 'rgba(255, 99, 132, 0.6)',
          isDark ? 'rgba(250, 204, 21, 0.7)' : 'rgba(255, 206, 86, 0.6)',
          isDark ? 'rgba(34, 197, 94, 0.7)' : 'rgba(75, 192, 192, 0.6)',
          isDark ? 'rgba(167, 139, 250, 0.7)' : 'rgba(153, 102, 255, 0.6)',
          isDark ? 'rgba(251, 146, 60, 0.7)' : 'rgba(255, 159, 64, 0.6)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: isDark ? '#e5e7eb' : '#111827',
        },
      },
      tooltip: {
        titleColor: isDark ? '#f3f4f6' : '#111827',
        bodyColor: isDark ? '#e5e7eb' : '#111827',
        backgroundColor: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255,255,255,0.95)',
        borderColor: isDark ? '#374151' : '#e5e7eb',
        borderWidth: 1,
      },
    },
  };

  return <div style={{ height: 260 }}><Pie data={data} options={options} /></div>;
};

export default PieChart;


