"use client";

import { useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";

function isAbpRecoveryElement(el: Element): boolean {
  try {
    const text = el.textContent || "";
    if (!text) return false;
    const needles = [
      "Support JBCL",
      "Become A Supporter",
      "Please consider turning off your ad blocker",
      "ad blocker",
    ];
    const hit = needles.every((n) => text.includes(n));
    if (!hit) return false;

    // Heuristic: typical container width ~720px and inline styles
    const style = (el as HTMLElement).getAttribute("style") || "";
    if (style.includes("width: 720px") || style.includes("box-shadow"))
      return true;

    return true;
  } catch {
    return false;
  }
}

function findAbpContainers(root: ParentNode): Element[] {
  const candidates: Element[] = [];
  // Broad scan: any divs containing our signature text
  const divs = root.querySelectorAll("div");
  divs.forEach((div) => {
    if (isAbpRecoveryElement(div)) {
      // Try to promote to the outermost container for removal
      let container: Element = div;
      while (
        container.parentElement &&
        container.parentElement !== document.body
      ) {
        const parent = container.parentElement;
        if (parent && parent.querySelectorAll("span, img, svg").length >= 2) {
          container = parent;
        } else {
          break;
        }
      }
      candidates.push(container);
    }
  });
  return Array.from(new Set(candidates));
}

export default function AbpRecoverySuppressor() {
  const { user } = useAuthContext();
  const isSupporter = !!(user?.premiumtype && user.premiumtype > 0);

  useEffect(() => {
    if (!isSupporter) return;

    const removeAbp = (root: ParentNode) => {
      const containers = findAbpContainers(root);
      containers.forEach((el) => {
        try {
          // Remove a potential backdrop if it's a sibling full-screen overlay
          const parent = el.parentElement;
          if (parent && parent !== document.body) {
            // If parent only wraps the modal and backdrop, remove parent
            const siblings = Array.from(parent.children);
            const maybeBackdrop = siblings.find((c) => {
              const attr = (c as HTMLElement).getAttribute("style") || "";
              return (
                c !== el &&
                (attr.includes("position: fixed") ||
                  attr.includes("inset: 0") ||
                  attr.includes("z-index"))
              );
            });
            if (maybeBackdrop) {
              parent.remove();
              return;
            }
          }
          el.remove();
        } catch {}
      });
    };

    // Initial sweep
    removeAbp(document);

    // Observe for future insertions
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.addedNodes && m.addedNodes.length) {
          m.addedNodes.forEach((n) => {
            if (n instanceof Element) {
              if (isAbpRecoveryElement(n)) {
                removeAbp(n);
              } else {
                // Scan within the subtree
                removeAbp(n);
              }
            }
          });
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => mo.disconnect();
  }, [isSupporter]);

  return null;
}
