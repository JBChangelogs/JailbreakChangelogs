"use client";

import { useEffect } from "react";
import { useRouter } from "nextjs-toploader/app";

const LATEST_SEASON = Number(process.env.NEXT_PUBLIC_LATEST_SEASON);

export default function SeasonsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/seasons/${LATEST_SEASON}`);
    // router from nextjs-toploader/app returns a new object reference on every
    // render, so including it here would re-trigger the redirect in a loop
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
