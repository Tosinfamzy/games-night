import React, { useState } from "react";
import { Card } from "@/components/ui";
import { CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui/Badge";

interface JoinCodeDisplayProps {
  joinCode: string;
  className?: string;
}

export function JoinCodeDisplay({
  joinCode,
  className = "",
}: JoinCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-4">
        <div className="flex flex-col items-center space-y-3 sm:flex-row sm:justify-between sm:space-y-0">
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-sm text-gray-500 mb-1">Session Code</span>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-wider">
                {joinCode}
              </span>
              {copied && (
                <Badge variant="success" className="animate-fade-in-out">
                  Copied!
                </Badge>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={copyToClipboard}
              className="whitespace-nowrap"
            >
              {copied ? "Copied!" : "Copy Code"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const shareUrl = `${window.location.origin}/join?code=${joinCode}`;
                if (navigator.share) {
                  navigator
                    .share({
                      title: "Join my game session",
                      text: `Join my game session with code: ${joinCode}`,
                      url: shareUrl,
                    })
                    .catch((err) => {
                      console.error("Share failed:", err);
                    });
                } else {
                  copyToClipboard();
                }
              }}
              className="whitespace-nowrap"
            >
              Share
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
