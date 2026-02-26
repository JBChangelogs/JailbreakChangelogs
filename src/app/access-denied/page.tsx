import type { Metadata } from "next";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import AccessDeniedLoginButton from "@/components/Auth/AccessDeniedLoginButton";

export const metadata: Metadata = {
  title: "Access Restricted",
  description:
    "This testing environment is restricted to testers and website owners.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccessDeniedPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[url('/backgrounds/v2/background31.webp')] bg-cover bg-center bg-no-repeat px-6">
      <div className="absolute inset-0 bg-[url('/backgrounds/vignette.png')] bg-cover bg-center bg-no-repeat opacity-70" />
      <div className="absolute inset-0 bg-black/70" />

      <div className="border-border-card bg-secondary-bg/85 relative z-10 w-full max-w-2xl rounded-2xl border p-8 shadow-xl backdrop-blur">
        <p className="text-link mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-[0.18em] uppercase">
          <Icon icon="grommet-icons:test" className="h-3.5 w-3.5" />
          <span>Testing Environment</span>
        </p>
        <h1 className="text-primary-text mb-4 text-3xl font-semibold">
          Access is restricted
        </h1>
        <p className="text-secondary-text mb-6 text-base leading-relaxed">
          This deployment is only available to verified testers and website
          owners. If you should have access, sign in with the account that has
          tester permissions.
        </p>

        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <AccessDeniedLoginButton />
          <Button
            asChild
            variant="outline"
            className="border-border-primary! text-primary-text! hover:bg-quaternary-bg! active:bg-quaternary-bg! w-full sm:w-auto"
          >
            <a href="https://jailbreakchangelogs.xyz/">Back to Home</a>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-border-primary! text-primary-text! hover:bg-quaternary-bg! active:bg-quaternary-bg! w-full sm:w-auto"
          >
            <a
              href="https://discord.jailbreakchangelogs.xyz"
              target="_blank"
              rel="noopener noreferrer"
            >
              Request Access
            </a>
          </Button>
        </div>
      </div>
    </main>
  );
}
