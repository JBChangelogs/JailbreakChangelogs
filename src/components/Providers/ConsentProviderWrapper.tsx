import { ReactNode } from "react";
import { ConsentProvider } from "@/contexts/ConsentContext";
import { getServerConsent } from "@/utils/serverConsent";

interface ConsentProviderWrapperProps {
  children: ReactNode;
}

/**
 * Server component wrapper that reads consent from HttpOnly cookie
 * and passes it to the client-side ConsentProvider
 * This ensures no hydration mismatch and proper SSR support
 */
export async function ConsentProviderWrapper({
  children,
}: ConsentProviderWrapperProps) {
  // Read consent from server-side cookie
  const initialConsent = await getServerConsent();

  return (
    <ConsentProvider initialConsent={initialConsent}>
      {children}
    </ConsentProvider>
  );
}
