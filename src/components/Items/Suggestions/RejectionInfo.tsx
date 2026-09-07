"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";

export function RejectionInfo({
  reason,
  proof,
  className = "",
}: {
  reason?: string | null;
  proof?: string[] | null;
  className?: string;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  const showPrev = useCallback(
    () =>
      setLightboxIndex((i) =>
        i === null || !proof ? i : (i - 1 + proof.length) % proof.length,
      ),
    [proof],
  );
  const showNext = useCallback(
    () =>
      setLightboxIndex((i) =>
        i === null || !proof ? i : (i + 1) % proof.length,
      ),
    [proof],
  );

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      else if (e.key === "ArrowRight") showNext();
      else if (e.key === "ArrowLeft") showPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, showNext, showPrev]);

  if (!reason?.trim() && !proof?.length) return null;

  const proofButton = !!proof?.length && (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setLightboxIndex(0)}
      className="w-fit"
    >
      <Icon
        icon="material-symbols:visibility-outline-rounded"
        className="h-4 w-4"
        inline
      />
      View Proof ({proof.length})
    </Button>
  );

  return (
    <>
      <div
        className={`border-border-card bg-button-danger/5 border-l-button-danger rounded-r-lg border-t border-l-2 py-2.5 pr-3 pl-3 ${className}`}
      >
        <div className="text-button-danger mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
          <Icon
            icon="material-symbols:cancel-outline-rounded"
            className="h-3.5 w-3.5"
            inline
          />
          Rejected
        </div>
        <div className="space-y-2">
          {reason?.trim() && (
            <p className="text-secondary-text text-sm leading-relaxed break-words whitespace-pre-wrap">
              {reason}
            </p>
          )}
          {proofButton}
        </div>
      </div>

      {mounted &&
        lightboxIndex !== null &&
        proof?.[lightboxIndex] &&
        createPortal(
          <div
            className="fixed inset-0 z-[10000] flex cursor-default flex-col items-center justify-center gap-3 bg-black/90 p-4"
            onClick={() => setLightboxIndex(null)}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(null);
              }}
              className="absolute top-4 right-4 cursor-pointer rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <Icon icon="mdi:close" className="h-5 w-5" inline />
            </button>

            <Image
              src={proof[lightboxIndex]}
              alt={`Rejection proof ${lightboxIndex + 1}`}
              width={0}
              height={0}
              sizes="100vw"
              style={{
                width: "min(95vw, 1400px)",
                height: "auto",
                maxHeight: "80vh",
                objectFit: "contain",
              }}
              className="rounded-lg"
              unoptimized
              referrerPolicy="no-referrer"
              onClick={(e) => e.stopPropagation()}
            />

            {proof.length > 1 && (
              <div
                className="flex items-center gap-4"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  aria-label="Previous proof"
                  onClick={showPrev}
                  className="cursor-pointer rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                >
                  <Icon
                    icon="material-symbols:chevron-left-rounded"
                    className="h-5 w-5"
                    inline
                  />
                </button>
                <span className="text-sm text-white/70">
                  {lightboxIndex + 1} / {proof.length}
                </span>
                <button
                  type="button"
                  aria-label="Next proof"
                  onClick={showNext}
                  className="cursor-pointer rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                >
                  <Icon
                    icon="material-symbols:chevron-right-rounded"
                    className="h-5 w-5"
                    inline
                  />
                </button>
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
