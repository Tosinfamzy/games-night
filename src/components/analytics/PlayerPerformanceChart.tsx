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
  TooltipItem,
  ChartOptions,
} from "chart.js";
import { Card } from "@/components/ui/Card";
import { GameAnalytics } from "@/types/game";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface PlayerPerformanceChartProps {
  analytics: GameAnalytics;
  className?: string;
}

export function PlayerPerformanceChart({
  analytics,
  className = "",
}: PlayerPerformanceChartProps) {
  if (
    !analytics ||
    !analytics.statistics.winRates ||
    Object.keys(analytics.statistics.winRates).length === 0
  ) {
    return (
      <Card className={`p-6 shadow-sm ${className}`}>
        <h3 className="text-xl font-semibold mb-4 text-gray-900">
          Player Win Rates
        </h3>
        <p className="text-gray-500 text-center py-8">
          No win rate data available
        </p>
      </Card>
    );
  }

  const winRates = analytics.statistics.winRates;
  const players = Object.keys(winRates);
  const rates = Object.values(winRates);

  const chartData = {
    labels: players,
    datasets: [
      {
        label: "Win Rate",
        data: rates.map((rate) => rate * 100), // Convert to percentage
        backgroundColor: "rgba(53, 162, 235, 0.5)",
        borderColor: "rgba(53, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions: ChartOptions<"bar"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: TooltipItem<"bar">) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(1) + "%";
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: "Win Rate (%)",
        },
        ticks: {
          callback: function (tickValue: number | string) {
            // We can safely convert to number since we know we're working with numeric values
            const value =
              typeof tickValue === "string" ? parseFloat(tickValue) : tickValue;
            return value + "%";
          },
        },
      },
    },
  };

  return (
    <Card className={`p-6 shadow-sm ${className}`}>
      <h3 className="text-xl font-semibold mb-4 text-gray-900">
        Player Win Rates
      </h3>
      <div className="relative h-64">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </Card>
  );
}
