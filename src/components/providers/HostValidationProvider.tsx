"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/store/sessionStore";

export function HostValidationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { validateHostId, clearHostId, hostId, setError } = useSessionStore();

  useEffect(() => {
    async function validateStoredHostId() {
      // Only run validation if there's a hostId stored
      if (hostId) {
        const isValid = await validateHostId();

        if (!isValid) {
          console.log("Invalid hostId detected, clearing from localStorage");
          clearHostId();
          setError(
            "Your host player session has expired. Please create a new host player."
          );

          // Clear the error message after 10 seconds
          setTimeout(() => {
            setError(null);
          }, 10000);
        }
      }
    }

    validateStoredHostId();
  }, [validateHostId, clearHostId, hostId, setError]);

  return <>{children}</>;
}
