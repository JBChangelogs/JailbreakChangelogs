"use client";

import { useRef } from "react";
import { Icon } from "@/components/ui/IconWrapper";
import { ColorSwatch } from "@/components/ui/color-picker";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hexToHsv, hsvToHex } from "@/utils/ui/accentColor";

// Container queries, not screen ones: the theme sheet is narrow on wide screens.
const CARD =
  "border-border-card bg-tertiary-bg flex flex-wrap items-center gap-2 rounded-xl border p-2 @md:flex-nowrap";
const BAR =
  "order-first h-11 min-w-0 flex-1 basis-full rounded-lg border @md:order-none @md:basis-0";

interface Fill {
  color: string;
  gradient: string | null;
}

export function AccentFillPicker({
  value,
  onChange,
  canEdit,
}: {
  value: Fill;
  onChange: (fill: Fill) => void;
  canEdit: () => boolean;
}) {
  const { color, gradient } = value;
  const lastGradient = useRef<string | null>(null);
  const setGradient = (on: boolean) => {
    if (!canEdit()) return;
    if (!on) {
      if (gradient) lastGradient.current = gradient;
      onChange({ color, gradient: null });
      return;
    }
    // Start the gradient a little further round the color wheel.
    const hsv = hexToHsv(color);
    onChange({
      color,
      gradient:
        lastGradient.current ?? hsvToHex({ ...hsv, h: (hsv.h + 60) % 360 }),
    });
  };

  return (
    <div role="group" aria-label="Color" className="@container space-y-2">
      <Tabs
        radio
        value={gradient ? "gradient" : "single"}
        onValueChange={(tab) => setGradient(tab === "gradient")}
      >
        <TabsList aria-label="Fill" fullWidth>
          <TabsTrigger value="single" fullWidth className="py-2.5">
            Single color
          </TabsTrigger>
          <TabsTrigger value="gradient" fullWidth className="py-2.5">
            Gradient
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className={CARD}>
        <ColorSwatch
          label={gradient ? "Start" : "Color"}
          value={color}
          onChange={(next) => onChange({ color: next, gradient })}
          canOpen={canEdit}
        />
        {/* Runs left to right so its ends line up with the swatches. When
            narrow it sits above them, full width. */}
        <div
          className={`${BAR} relative grid place-items-center border-black/10 shadow-inner`}
          style={{
            background: gradient
              ? `linear-gradient(90deg, ${color}, ${gradient}) border-box`
              : color,
          }}
        >
          {gradient && (
            <button
              type="button"
              aria-label="Swap start and end colors"
              onClick={() =>
                canEdit() && onChange({ color: gradient, gradient: color })
              }
              className="border-border-card bg-secondary-bg text-secondary-text hover:text-primary-text focus-visible:ring-border-focus cursor-pointer rounded-full border p-1.5 shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <Icon
                icon="lucide:arrow-left-right"
                aria-hidden="true"
                className="size-3.5"
              />
            </button>
          )}
        </div>
        {gradient && (
          <div className="ml-auto @md:ml-0">
            <ColorSwatch
              label="End"
              value={gradient}
              onChange={(next) => onChange({ color, gradient: next })}
              canOpen={canEdit}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function UnderglowPicker({
  value,
  onChange,
  canEdit,
}: {
  value: string;
  onChange: (color: string) => void;
  canEdit: () => boolean;
}) {
  return (
    <div className="@container">
      <div className={CARD}>
        <ColorSwatch
          label="Color"
          value={value}
          onChange={onChange}
          canOpen={canEdit}
        />
        <div
          aria-hidden="true"
          className={`${BAR} border-border-card bg-secondary-bg`}
          style={{
            backgroundImage: `radial-gradient(ellipse 60% 120% at 50% 130%, ${value}, transparent)`,
          }}
        />
      </div>
    </div>
  );
}
