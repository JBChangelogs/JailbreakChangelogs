import toast from "react-hot-toast";

// Track active scan loading toast to prevent duplicates
let activeScanLoadingToast: string | null = null;
// Track active scan error toast to prevent duplicates
let activeScanErrorToast: string | null = null;

/**
 * Shows a scan loading toast with deduplication to prevent multiple loading messages
 */
export function showScanLoadingToast(
  message: string = "Starting scan...",
): string {
  // If there's already an active scan loading toast, dismiss it first
  if (activeScanLoadingToast) {
    toast.dismiss(activeScanLoadingToast);
  }

  // Show new scan loading toast and track its ID
  activeScanLoadingToast = toast.loading(message, {
    duration: Infinity,
    position: "bottom-right",
  });

  return activeScanLoadingToast;
}

/**
 * Updates the existing scan loading toast with new message
 */
export function updateScanLoadingToast(message: string): void {
  if (activeScanLoadingToast) {
    toast.loading(message, {
      id: activeScanLoadingToast,
      duration: Infinity,
      position: "bottom-right",
    });
  }
}

/**
 * Dismisses a scan loading toast and clears tracking
 */
export function dismissScanLoadingToast(toastId?: string): void {
  if (toastId) {
    toast.dismiss(toastId);
  } else if (activeScanLoadingToast) {
    toast.dismiss(activeScanLoadingToast);
  }
  activeScanLoadingToast = null;
}

/**
 * Replaces scan loading toast with success message
 */
export function showScanSuccessToast(message: string, toastId?: string): void {
  const id = toastId || activeScanLoadingToast;
  if (id) {
    toast.success(message, {
      id,
      duration: 4000,
      position: "bottom-right",
    });
  }
  activeScanLoadingToast = null;
}

/**
 * Shows scan error message - either replaces loading toast or shows independent toast
 */
export function showScanErrorToast(message: string, toastId?: string): void {
  // If there's already an active scan error toast, dismiss it first
  if (activeScanErrorToast) {
    toast.dismiss(activeScanErrorToast);
  }

  const id = toastId || activeScanLoadingToast;
  if (id) {
    // Replace if toast ID is valid
    activeScanErrorToast = toast.error(message, {
      id,
      duration: 5000,
      position: "bottom-right",
    });
  } else {
    // Create independent error toast if no valid ID
    activeScanErrorToast = toast.error(message, {
      duration: 5000,
      position: "bottom-right",
    });
  }
  activeScanLoadingToast = null;
}

/**
 * Clears error toast tracking (useful for cleanup)
 */
export function clearScanErrorToast(): void {
  if (activeScanErrorToast) {
    toast.dismiss(activeScanErrorToast);
    activeScanErrorToast = null;
  }
}
