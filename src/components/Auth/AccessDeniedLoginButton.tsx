"use client";

import type { MouseEvent } from "react";
import { Button } from "@/components/ui/button";

export default function AccessDeniedLoginButton() {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const redirectTarget = "https://testing.jailbreakchangelogs.xyz/";
    const loginUrl = `/api/auth/discord?redirect=${encodeURIComponent(redirectTarget)}`;
    window.location.assign(loginUrl);
  };

  return (
    <Button asChild className="w-full sm:w-auto">
      <a href="/api/auth/discord" onClick={handleClick}>
        Login
      </a>
    </Button>
  );
}
