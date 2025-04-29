import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent } from "@/components/ui/Card";

interface SessionQRCodeProps {
  joinCode: string;
  sessionId?: string;
  className?: string;
}

export function SessionQRCode({
  joinCode,
  sessionId,
  className = "",
}: SessionQRCodeProps) {
  // Ensure the join code and session ID are properly encoded for URLs
  const encodedJoinCode = encodeURIComponent(joinCode.trim());

  // Build the URL based on available information
  const joinUrl = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/join?code=${encodedJoinCode}${
    sessionId ? `&session=${encodeURIComponent(sessionId)}` : ""
  }&source=qr`;

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-4">
        <div className="flex flex-col items-center space-y-3">
          <div className="flex flex-col items-center">
            <span className="text-sm text-gray-500 mb-1">Scan to Join</span>
            <div className="bg-white p-3 rounded-lg border">
              <QRCodeSVG value={joinUrl} size={180} />
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 max-w-[200px] mb-2">
              Scan this QR code with your phone camera to quickly join the
              session
            </p>
            <p className="text-xs font-medium">
              Join code: <span className="font-bold">{joinCode}</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
