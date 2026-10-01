"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { damion } from "@/app/fonts";

const signatureRotation: Record<string, string> = {
  epic_tank: "-rotate-12",
  asimo3089: "-rotate-12",
  badcc: "rotate-12",
};

interface ItemSignaturesProps {
  signs?: string[] | null;
}

export default function ItemSignatures({ signs }: ItemSignaturesProps) {
  const signers = signs?.filter(Boolean) ?? [];
  if (signers.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-x-2 top-1/5 bottom-[8%] z-10 flex flex-col items-center justify-around">
      {signers.map((signer, index) => (
        <Tooltip key={`${signer}-${index}`}>
          <TooltipTrigger asChild>
            <span
              className={`${damion.className} pointer-events-auto max-w-full cursor-help px-2 text-center leading-none font-bold whitespace-nowrap text-black italic ${signatureRotation[signer.toLowerCase()] ?? "-rotate-12"} ${signers.length > 2 ? "text-3xl" : "text-4xl"}`}
              aria-label={`Signed by ${signer}`}
              style={{
                WebkitTextStroke: "3px rgba(255, 255, 255, 0.95)",
                paintOrder: "stroke fill",
                filter: "drop-shadow(0 2px 2px rgba(0, 0, 0, 0.8))",
              }}
            >
              {signer}
            </span>
          </TooltipTrigger>
          <TooltipContent>Signed by {signer}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
