import React, { useEffect, useState } from "react";
import { GameAnalytics } from "@/types/game";
import { api } from "@/services/api";
import { GameStatsCard } from "./GameStatsCard";
import { PlayerPerformanceChart } from "./PlayerPerformanceChart";
import { ScoreHistoryChart } from "./ScoreHistoryChart";
import { DifficultyDistributionChart } from "./DifficultyDistributionChart";
import { StrategiesChart } from "./StrategiesChart";

interface AnalyticsDashboardProps {
  gameId: string;
  className?: string;
}

export function AnalyticsDashboard({
  gameId,
  className = "",
}: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<GameAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!gameId) return;

      try {
        setIsLoading(true);
        setError(null);

        const response = await api.get<GameAnalytics>(
          `/analytics/games/${gameId}`
        );
        setAnalytics(response.data);
      } catch (err) {
        console.error("Failed to fetch game analytics:", err);
        setError("Failed to load analytics data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, [gameId]);

  async function refreshAnalytics() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.get<GameAnalytics>(
        `/analytics/games/${gameId}/update`
      );
      setAnalytics(response.data);
    } catch (err) {
      console.error("Failed to refresh analytics data:", err);
      setError("Failed to refresh analytics data");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className="h-16 bg-gray-200 rounded mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`${className} bg-red-50 border border-red-200 rounded-lg p-6 text-center`}
      >
        <p className="text-red-500 font-medium">{error}</p>
        <button
          className="mt-4 px-4 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
          onClick={refreshAnalytics}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`${className} text-center py-12`}>
        <p className="text-gray-500">
          No analytics data available for this game
        </p>
        <button
          className="mt-4 px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
          onClick={refreshAnalytics}
        >
          Generate Analytics
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Game Analytics</h2>
        <button
          className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
          onClick={refreshAnalytics}
        >
          Refresh Data
        </button>
      </div>

      <GameStatsCard analytics={analytics} className="mb-6" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ScoreHistoryChart analytics={analytics} />
        <PlayerPerformanceChart analytics={analytics} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DifficultyDistributionChart analytics={analytics} />
        <StrategiesChart analytics={analytics} />
      </div>
    </div>
  );
}
