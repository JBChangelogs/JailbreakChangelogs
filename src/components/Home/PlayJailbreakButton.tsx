"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function PlayJailbreakButton() {
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!isJoining) return;
    const toastId = toast.loading("Joining Jailbreak...");
    const timeout = window.setTimeout(() => setIsJoining(false), 5000);
    return () => {
      window.clearTimeout(timeout);
      toast.dismiss(toastId);
    };
  }, [isJoining]);

  return (
    <Button
      size="lg"
      disabled={isJoining}
      onClick={() => {
        setIsJoining(true);
        window.location.assign("roblox://experiences/start?placeId=606849621");
      }}
    >
      {isJoining ? "Joining..." : "Play Jailbreak Now"}
    </Button>
  );
}
