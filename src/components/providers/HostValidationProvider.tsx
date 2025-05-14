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
    // Create a reference to track if component is still mounted
    let isMounted = true;
    let validationTimeout: NodeJS.Timeout | null = null;
    let validationInProgress = false;

    async function validateStoredHostId() {
      // Don't run multiple validations at the same time
      if (validationInProgress) return;

      // Only run validation if there's a hostId stored
      if (hostId) {
        validationInProgress = true;

        // Add a small delay before validation to ensure localStorage is fully loaded
        // and to debounce rapid validation requests
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Check if component is still mounted before proceeding
        if (!isMounted) {
          validationInProgress = false;
          return;
        }

        try {
          const isValid = await validateHostId();

          if (!isValid && isMounted) {
            console.log("Invalid hostId detected, clearing from localStorage");
            clearHostId();
            setError(
              "Your host player session has expired. Please create a new host player."
            );

            // Clear the error message after 10 seconds
            setTimeout(() => {
              if (isMounted) {
                setError(null);
              }
            }, 10000);
          }
        } catch (error) {
          console.error("Host validation error:", error);
        } finally {
          validationInProgress = false;
        }
      }
    }

    validateStoredHostId();

    // Setup validation interval (less frequent checks)
    const intervalId = setInterval(() => {
      if (validationTimeout) clearTimeout(validationTimeout);

      validationTimeout = setTimeout(() => {
        validateStoredHostId();
      }, 30000); // Revalidate every 30 seconds
    }, 60000);

    // Cleanup function to handle component unmounting
    return () => {
      isMounted = false;
      if (validationTimeout) clearTimeout(validationTimeout);
      clearInterval(intervalId);
    };
  }, [validateHostId, clearHostId, hostId, setError]);

  return <>{children}</>;
}
