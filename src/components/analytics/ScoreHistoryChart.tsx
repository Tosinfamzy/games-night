import React, { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  TooltipItem,
  ChartOptions,
} from "chart.js";
import { Card } from "@/components/ui/Card";
import { GameAnalytics } from "@/types/game";
import "chartjs-adapter-date-fns";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Title,
  Tooltip,
  Legend
);

interface ScoreHistoryChartProps {
  analytics: GameAnalytics;
  className?: string;
}

interface ScoreDataPoint {
  x: Date;
  y: number;
}

export function ScoreHistoryChart({
  analytics,
  className = "",
}: ScoreHistoryChartProps) {
  const scoreHistory = analytics?.statistics?.scoreHistory || [];

  const chartData = useMemo(() => {
    if (!scoreHistory || scoreHistory.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    const playerScores: Record<string, ScoreDataPoint[]> = {};

    scoreHistory.forEach((entry) => {
      const playerId = entry.playerId.toString();
      const playerName = entry.playerName || `Player ${playerId}`;

      if (!playerScores[playerName]) {
        playerScores[playerName] = [];
      }

      playerScores[playerName].push({
        x: new Date(entry.timestamp),
        y: entry.points,
      });
    });

    Object.keys(playerScores).forEach((player) => {
      playerScores[player].sort((a, b) => a.x.getTime() - b.x.getTime());
    });

    const datasets = Object.keys(playerScores).map((player, index) => {
      const colorIndex = index % colors.length;
      let cumulativeScore = 0;

      const data = playerScores[player].map((entry) => {
        cumulativeScore += entry.y;
        return {
          x: entry.x,
          y: cumulativeScore,
        };
      });

      return {
        label: player,
        data: data,
        borderColor: colors[colorIndex],
        backgroundColor: backgroundColors[colorIndex],
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6,
      };
    });

    return {
      datasets,
    };
  }, [scoreHistory]);

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          title: function (tooltipItems: TooltipItem<"line">[]) {
            if (tooltipItems.length > 0) {
              const date = new Date(tooltipItems[0].parsed.x);
              return date.toLocaleString();
            }
            return "";
          },
        },
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: "minute",
          tooltipFormat: "PPpp",
          displayFormats: {
            minute: "h:mm a",
          },
        },
        title: {
          display: true,
          text: "Time",
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Cumulative Points",
        },
      },
    },
  };

  if (!analytics || !scoreHistory || scoreHistory.length === 0) {
    return (
      <Card className={`p-6 shadow-sm ${className}`}>
        <h3 className="text-xl font-semibold mb-4 text-gray-900">
          Score History
        </h3>
        <p className="text-gray-500 text-center py-8">
          No score history data available
        </p>
      </Card>
    );
  }

  return (
    <Card className={`p-6 shadow-sm ${className}`}>
      <h3 className="text-xl font-semibold mb-4 text-gray-900">
        Score History
      </h3>
      <div className="relative h-80">
        <Line data={chartData} options={chartOptions} />
      </div>
    </Card>
  );
}

const colors = [
  "rgb(53, 162, 235)",
  "rgb(255, 99, 132)",
  "rgb(75, 192, 192)",
  "rgb(255, 205, 86)",
  "rgb(201, 203, 207)",
  "rgb(153, 102, 255)",
];

const backgroundColors = [
  "rgba(53, 162, 235, 0.5)",
  "rgba(255, 99, 132, 0.5)",
  "rgba(75, 192, 192, 0.5)",
  "rgba(255, 205, 86, 0.5)",
  "rgba(201, 203, 207, 0.5)",
  "rgba(153, 102, 255, 0.5)",
];
