"use client";

import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import { ImageLightbox } from "@/components/ui/ImageLightbox";

export function RejectionInfo({
  reason,
  proof,
  className = "",
}: {
  reason?: string | null;
  proof?: string[] | null;
  className?: string;
}) {
  if (!reason?.trim() && !proof?.length) return null;

  const proofButton = !!proof?.length && (
    <ImageLightbox
      images={proof.map((src, index) => ({
        src,
        alt: `Rejection proof ${index + 1}`,
      }))}
      triggerAsChild
      noReferrer
    >
      <Button type="button" variant="outline" size="sm" className="w-fit">
        <Icon
          icon="material-symbols:visibility-outline-rounded"
          className="h-4 w-4"
          inline
        />
        View Proof ({proof.length})
      </Button>
    </ImageLightbox>
  );

  return (
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
  );
}
