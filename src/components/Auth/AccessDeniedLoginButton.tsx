"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AccessDeniedLoginButton() {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const redirectTarget = "https://testing.jailbreakchangelogs.com/";
    const loginUrl = `/api/auth/discord?redirect=${encodeURIComponent(redirectTarget)}`;
    window.location.assign(loginUrl);
  };

  return (
    <Button asChild className="w-full sm:w-auto">
      <Link href="/api/auth/discord" onClick={handleClick}>
        Login
      </Link>
    </Button>
  );
}
