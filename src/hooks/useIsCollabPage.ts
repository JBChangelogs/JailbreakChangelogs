"use client";
import { usePathname } from "next/navigation";

export function useIsCollabPage() {
  const pathname = usePathname();
  return (
    pathname === "/values" ||
    pathname.startsWith("/item") ||
    pathname.startsWith("/trading") ||
    pathname.startsWith("/items/changelogs") ||
    pathname.startsWith("/items/suggestions")
  );
}
