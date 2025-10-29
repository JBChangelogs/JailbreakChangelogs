import { ReactNode } from "react";
import { ConsentProvider } from "@/contexts/ConsentContext";
import { getServerConsent } from "@/utils/serverConsent";

interface ConsentProviderWrapperProps {
  children: ReactNode;
}

/**
 * Server component wrapper that reads consent from HttpOnly cookie
 * and passes it to the client-side ConsentProvider
 * Only passes initialConsent if user has already made a choice (stored consent exists)
 * If no stored consent, banner will show with default consent values
 * This ensures no hydration mismatch and proper SSR support
 */
export async function ConsentProviderWrapper({
  children,
}: ConsentProviderWrapperProps) {
  // Read consent from server-side cookie
  // Only pass this if user has already made a choice
  const storedConsent = await getServerConsent();

  return (
    <ConsentProvider initialConsent={storedConsent}>{children}</ConsentProvider>
  );
}
