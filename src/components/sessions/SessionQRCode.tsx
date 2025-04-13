import React from "react";
import { QRCodeSVG } from "qrcode.react"; // Using named export instead of default export
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
  // The QR code encodes a URL that directs to the join page with pre-filled join code
  const joinUrl = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/join?code=${joinCode}${sessionId ? `&session=${sessionId}` : ""}`;

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
          <p className="text-xs text-center text-gray-500 max-w-[200px]">
            Scan this QR code with your phone camera to quickly join the session
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
