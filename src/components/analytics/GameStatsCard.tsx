import React from "react";
import { Card } from "@/components/ui/Card";
import { GameAnalytics } from "@/types/game";

interface GameStatsCardProps {
  analytics: GameAnalytics;
  className?: string;
}

export function GameStatsCard({
  analytics,
  className = "",
}: GameStatsCardProps) {
  if (!analytics) {
    return (
      <Card className={`p-6 shadow-sm ${className}`}>
        <p className="text-gray-500 text-center">No analytics data available</p>
      </Card>
    );
  }

  return (
    <Card className={`p-6 shadow-sm ${className}`}>
      <h3 className="text-xl font-semibold mb-4 text-gray-900">
        Game Statistics
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 mb-1">Total Plays</p>
          <p className="text-2xl font-bold text-gray-900">
            {analytics.totalPlays}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 mb-1">Avg. Duration</p>
          <p className="text-2xl font-bold text-gray-900">
            {analytics.averageDuration} min
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 mb-1">Avg. Players</p>
          <p className="text-2xl font-bold text-gray-900">
            {analytics.averagePlayers}
          </p>
        </div>
      </div>
    </Card>
  );
}
