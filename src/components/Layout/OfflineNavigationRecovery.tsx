"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTopLoader } from "nextjs-toploader";
import { probeSiteConnectivity } from "@/components/OfflineDetector";

type PendingNavigation = {
  target: string;
  source: string;
  startedAt: number;
  queued: boolean;
};

export default function OfflineNavigationRecovery() {
  const pathname = usePathname();
  const { done } = useTopLoader();
  const navigationRef = useRef<PendingNavigation | null>(null);
  const offlineRef = useRef(false);
  const retryingRef = useRef(false);

  useEffect(() => {
    const navigation = navigationRef.current;
    if (!navigation) return;

    const current = window.location.pathname + window.location.search;
    const target = new URL(navigation.target);
    const source = new URL(navigation.source);
    if (
      current === target.pathname + target.search ||
      current !== source.pathname + source.search
    ) {
      navigationRef.current = null;
    }
  }, [pathname]);

  useEffect(() => {
    offlineRef.current = !navigator.onLine;

    const handleClick = (event: MouseEvent) => {
      if (
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;

      const anchor =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (!anchor || anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "_self") return;

      const target = new URL(anchor.href, window.location.href);
      const source = new URL(window.location.href);
      if (target.origin !== source.origin) return;
      if (target.pathname + target.search === source.pathname + source.search)
        return;

      navigationRef.current = {
        target: target.href,
        source: source.href,
        startedAt: Date.now(),
        queued: false,
      };

      if (offlineRef.current || !navigator.onLine) {
        navigationRef.current.queued = true;
        event.preventDefault();
        event.stopPropagation();
        done(true);
      }
    };

    const handleOffline = () => {
      offlineRef.current = true;
      const navigation = navigationRef.current;
      if (navigation && Date.now() - navigation.startedAt < 30_000) {
        navigation.queued = true;
      }
      done(true);
    };

    const retryNavigation = async (siteConfirmed = false) => {
      const navigation = navigationRef.current;
      if (!navigation?.queued || retryingRef.current) return;
      retryingRef.current = true;
      try {
        if (!siteConfirmed) await probeSiteConnectivity();
        if (navigationRef.current !== navigation) return;
        const current = window.location.pathname + window.location.search;
        const target = new URL(navigation.target);
        if (current === target.pathname + target.search) {
          navigationRef.current = null;
          return;
        }
        offlineRef.current = false;
        // A failed App Router transition does not resume on reconnect. Reload
        // the requested URL so it cannot remain stuck behind that transition.
        window.location.assign(navigation.target);
      } catch {
        // OfflineDetector retries the site check and emits site-online later.
      } finally {
        retryingRef.current = false;
      }
    };

    const handleOnline = () => {
      offlineRef.current = false;
      void retryNavigation();
    };
    const handleSiteOnline = () => {
      offlineRef.current = false;
      void retryNavigation(true);
    };

    document.addEventListener("click", handleClick, true);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("jbcl:site-offline", handleOffline);
    window.addEventListener("jbcl:site-online", handleSiteOnline);
    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("jbcl:site-offline", handleOffline);
      window.removeEventListener("jbcl:site-online", handleSiteOnline);
    };
  }, [done]);

  return null;
}
