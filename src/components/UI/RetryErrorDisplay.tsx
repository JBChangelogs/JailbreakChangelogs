"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "./IconWrapper";

interface RetryErrorDisplayProps {
  error: string;
  retryCount: number;
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: () => void;
}

export default function RetryErrorDisplay({
  error,
  retryCount,
  maxRetries = 3,
  retryDelay = 5,
  onRetry,
}: RetryErrorDisplayProps) {
  const [countdown, setCountdown] = useState(retryDelay);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (retryCount < maxRetries && !isRetrying) {
      const timer = setInterval(() => {
        setCountdown((prev: number) => {
          if (prev <= 1) {
            setIsRetrying(true);
            if (onRetry) {
              onRetry();
            }
            return retryDelay;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [retryCount, maxRetries, retryDelay, onRetry, isRetrying]);

  useEffect(() => {
    if (isRetrying) {
      const timer = setTimeout(() => {
        setIsRetrying(false);
        setCountdown(retryDelay);
      }, 2000); // Show retrying state for 2 seconds

      return () => clearTimeout(timer);
    }
  }, [isRetrying, retryDelay]);

  const isFailed = retryCount >= maxRetries;

  return (
    <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-6 text-center">
      {/* Spinning icon or offline status */}
      <div className="mb-4 flex justify-center">
        <div className="relative">
          {isRetrying ? (
            // Spinner when retrying
            <div className="border-button-info h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"></div>
          ) : (
            // Offline status icon when not retrying
            <div className="bg-status-error/10 flex h-8 w-8 items-center justify-center rounded-full">
              <Icon
                icon="heroicons-solid:status-offline"
                className="text-status-error h-5 w-5"
                inline={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      <div className="text-primary-text mb-2 text-sm font-medium">
        {isRetrying
          ? "Retrying..."
          : isFailed
            ? "Update failed — will retry on next scheduled update"
            : `Update failed — retrying in ${countdown} sec...`}
      </div>

      {/* Subtle error details */}
      <div className="text-secondary-text text-xs">{error}</div>
    </div>
  );
}
