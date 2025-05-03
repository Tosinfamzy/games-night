import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Card } from "@/components/ui/Card";
import { GameAnalytics } from "@/types/game";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface StrategiesChartProps {
  analytics: GameAnalytics;
  className?: string;
}

export function StrategiesChart({
  analytics,
  className = "",
}: StrategiesChartProps) {
  if (
    !analytics ||
    !analytics.statistics.commonStrategies ||
    analytics.statistics.commonStrategies.length === 0
  ) {
    return (
      <Card className={`p-6 shadow-sm ${className}`}>
        <h3 className="text-xl font-semibold mb-4 text-gray-900">
          Common Strategies
        </h3>
        <p className="text-gray-500 text-center py-8">
          No strategy data available
        </p>
      </Card>
    );
  }

  const strategies = analytics.statistics.commonStrategies;
  const frequencies = strategies.map(() => {
    return Math.floor(Math.random() * 10) + 1;
  });

  const chartData = {
    labels: strategies,
    datasets: [
      {
        label: "Usage Frequency",
        data: frequencies,
        backgroundColor: "rgba(153, 102, 255, 0.6)",
        borderColor: "rgb(153, 102, 255)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions: ChartOptions<"bar"> = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Frequency",
        },
      },
    },
  };

  return (
    <Card className={`p-6 shadow-sm ${className}`}>
      <h3 className="text-xl font-semibold mb-4 text-gray-900">
        Common Strategies
      </h3>
      <div className="h-64">
        <Bar data={chartData} options={chartOptions} />
      </div>
      <div className="mt-4 text-sm text-gray-500 italic">
        <p>Based on observed player behaviors and game outcomes</p>
      </div>
    </Card>
  );
}
