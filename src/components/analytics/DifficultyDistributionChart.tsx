import React from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  TooltipItem,
  ChartOptions,
} from "chart.js";
import { Card } from "@/components/ui/Card";
import { GameAnalytics } from "@/types/game";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface DifficultyDistributionChartProps {
  analytics: GameAnalytics;
  className?: string;
}

export function DifficultyDistributionChart({
  analytics,
  className = "",
}: DifficultyDistributionChartProps) {
  if (
    !analytics ||
    !analytics.statistics.difficultyLevels ||
    Object.keys(analytics.statistics.difficultyLevels).length === 0
  ) {
    return (
      <Card className={`p-6 shadow-sm ${className}`}>
        <h3 className="text-xl font-semibold mb-4 text-gray-900">
          Difficulty Distribution
        </h3>
        <p className="text-gray-500 text-center py-8">
          No difficulty data available
        </p>
      </Card>
    );
  }

  const difficultyLevels = analytics.statistics.difficultyLevels;
  const labels = Object.keys(difficultyLevels);
  const data = Object.values(difficultyLevels);
  const totalGames = data.reduce((acc, val) => acc + val, 0);

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: [
          "rgba(75, 192, 192, 0.6)", // easy - green
          "rgba(255, 205, 86, 0.6)", // medium - yellow
          "rgba(255, 99, 132, 0.6)", // hard - red
        ],
        borderColor: [
          "rgb(75, 192, 192)",
          "rgb(255, 205, 86)",
          "rgb(255, 99, 132)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
      },
      tooltip: {
        callbacks: {
          label: function (context: TooltipItem<"pie">) {
            const label = context.label || "";
            const value = (context.raw as number) || 0;
            const percentage = ((value / totalGames) * 100).toFixed(1);
            return `${label}: ${value} games (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <Card className={`p-6 shadow-sm ${className}`}>
      <h3 className="text-xl font-semibold mb-4 text-gray-900">
        Difficulty Distribution
      </h3>
      <div className="h-64 flex items-center justify-center">
        <div className="w-full max-w-xs h-full">
          <Pie data={chartData} options={chartOptions} />
        </div>
      </div>
      <div className="mt-2 text-center text-sm text-gray-600">
        Total games played: {totalGames}
      </div>
    </Card>
  );
}
