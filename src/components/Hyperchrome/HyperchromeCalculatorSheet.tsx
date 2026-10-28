"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { IMAGE_PLACEHOLDER } from "@/utils/ui/imagePlaceholder";
import { Icon } from "../ui/IconWrapper";
import { Sheet, SheetContent } from "../ui/sheet";
import { Slider } from "../ui/slider";
import { cn } from "@/lib/utils";
import {
  calculateRobberiesToLevelUp,
  calculateRobberiesToPublicPityGoal,
  HYPERCHROME_PITY_PUBLIC,
  HYPERCHROME_PITY_SMALL,
  type HyperchromeLevel,
} from "@/utils/items/hyperchrome";
import { Switch } from "@/components/ui/switch";

function sanitizeDecimalInput(raw: string): string {
  const digitsAndDots = raw.replace(/[^0-9.]/g, "").replace(/^0+(?=\d)/, "");
  const firstDot = digitsAndDots.indexOf(".");
  if (firstDot === -1) return digitsAndDots;
  return (
    digitsAndDots.slice(0, firstDot + 1) +
    digitsAndDots
      .slice(firstDot + 1)
      .replace(/\./g, "")
      .slice(0, 1)
  );
}

interface HyperchromeCalculatorProps {
  open?: boolean;
  onClose?: () => void;
  asPage?: boolean;
}

export default function HyperchromeCalculatorModal({
  open = false,
  onClose,
  asPage = false,
}: HyperchromeCalculatorProps) {
  const hyperchromeRobberyImages = [
    { name: "HyperRed", robbery: "Tomb" },
    { name: "HyperOrange", robbery: "Museum" },
    { name: "HyperYellow", robbery: "Cargo Train / Passenger Train" },
    { name: "HyperGreen", robbery: "Rising City Bank" },
    { name: "HyperDiamond", robbery: "Jewelry Store" },
    { name: "HyperBlue", robbery: "Cargo Plane" },
    { name: "HyperPurple", robbery: "Power Plant" },
    { name: "HyperPink", robbery: "Crown Jewel" },
  ];
  const hyperchromeBgColors: Record<string, string> = {
    HyperRed: "hsla(358, 99%, 53%, 0.1)",
    HyperOrange: "hsla(45, 87%, 66%, 0.1)",
    HyperYellow: "hsla(57, 99%, 59%, 0.1)",
    HyperGreen: "hsla(119, 100%, 60%, 0.1)",
    HyperDiamond: "hsla(180, 99%, 51%, 0.1)",
    HyperBlue: "hsla(275, 99%, 52%, 0.1)",
    HyperPurple: "hsla(296, 88%, 78%, 0.1)",
    HyperPink: "hsla(327, 93%, 54%, 0.1)",
  };
  const hyperchromeBorderColors: Record<string, string> = {
    HyperRed: "hsl(358, 99%, 53%)",
    HyperOrange: "hsl(45, 87%, 66%)",
    HyperYellow: "hsl(57, 99%, 59%)",
    HyperGreen: "hsl(119, 100%, 60%)",
    HyperDiamond: "hsl(180, 99%, 51%)",
    HyperBlue: "hsl(275, 99%, 52%)",
    HyperPurple: "hsl(296, 88%, 78%)",
    HyperPink: "hsl(327, 93%, 54%)",
  };
  const referenceRows = [
    {
      level: 1,
      chancePerRoll: "1/179",
      approxPercent: "~0.558%",
      pity: HYPERCHROME_PITY_PUBLIC[0],
      smallPity: HYPERCHROME_PITY_SMALL[0],
    },
    {
      level: 2,
      chancePerRoll: "1/378",
      approxPercent: "~0.265%",
      pity: HYPERCHROME_PITY_PUBLIC[1],
      smallPity: HYPERCHROME_PITY_SMALL[1],
    },
    {
      level: 3,
      chancePerRoll: "1/608",
      approxPercent: "~0.165%",
      pity: HYPERCHROME_PITY_PUBLIC[2],
      smallPity: HYPERCHROME_PITY_SMALL[2],
    },
    {
      level: 4,
      chancePerRoll: "1/696",
      approxPercent: "~0.144%",
      pity: HYPERCHROME_PITY_PUBLIC[3],
      smallPity: HYPERCHROME_PITY_SMALL[3],
    },
    {
      level: 5,
      chancePerRoll: "1/1068",
      approxPercent: "~0.094%",
      pity: HYPERCHROME_PITY_PUBLIC[4],
      smallPity: HYPERCHROME_PITY_SMALL[4],
    },
  ];
  const [mounted, setMounted] = useState(false);
  const [level, setLevel] = useState<string>("");
  const [pity, setPity] = useState<string>("");
  const [isSmallServer, setIsSmallServer] = useState(false);
  // Last pity <= 100, kept so results stay visible while the input is over 100
  const [validPity, setValidPity] = useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClose = useCallback(() => {
    // reset when closing
    setLevel("");
    setPity("");
    setValidPity("");
    setIsSmallServer(false);
    onClose?.();
  }, [onClose]);

  const resultLevel = parseInt(level) as HyperchromeLevel;
  const resultPity = Number(validPity);
  const levelSelected = resultLevel >= 0 && resultLevel <= 4;
  const pityTooHigh = Number(pity) > 100;
  const showResults = levelSelected;

  const updatePity = (value: string) => {
    setPity(value);
    if (Number(value) <= 100) setValidPity(value);
  };
  const resultRobberiesNeeded = showResults
    ? calculateRobberiesToLevelUp(resultLevel, resultPity, isSmallServer)
    : 0;
  const resultTipRobberies = showResults
    ? calculateRobberiesToPublicPityGoal(resultLevel, resultPity, isSmallServer)
    : 0;

  if (!mounted) {
    if (asPage) {
      return (
        <div className="space-y-6">
          <div className="border-border-card bg-secondary-bg rounded-lg border p-6 shadow-lg">
            <div className="bg-quaternary-bg/70 mb-4 h-5 w-48 animate-pulse rounded" />

            <div className="mb-4 space-y-2">
              <div className="bg-quaternary-bg/70 h-4 w-full animate-pulse rounded" />
              <div className="bg-quaternary-bg/70 h-4 w-5/6 animate-pulse rounded" />
              <div className="bg-quaternary-bg/70 h-4 w-2/3 animate-pulse rounded" />
            </div>

            <div className="mb-4 space-y-3">
              <div className="bg-quaternary-bg/70 border-border-card h-12 w-full animate-pulse rounded border" />
              <div className="bg-quaternary-bg/70 border-border-card h-12 w-full animate-pulse rounded border" />
            </div>

            <div className="space-y-3">
              <div className="bg-quaternary-bg/70 border-border-card h-24 w-full animate-pulse rounded border" />
              <div className="bg-quaternary-bg/70 border-border-card h-24 w-full animate-pulse rounded border" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-quaternary-bg/70 h-6 w-48 animate-pulse rounded" />
            <div className="bg-quaternary-bg/70 h-4 w-full animate-pulse rounded" />
            <div className="bg-quaternary-bg/70 h-4 w-5/6 animate-pulse rounded" />
          </div>
        </div>
      );
    }
    return null;
  }

  const bodyTextClass = asPage
    ? "text-base leading-relaxed"
    : "text-sm leading-relaxed";
  const inputLabelClass = asPage
    ? "text-primary-text mb-1 text-sm tracking-wider uppercase"
    : "text-primary-text mb-1 text-xs tracking-wider uppercase";
  const helperTextClass = asPage
    ? "text-primary-text mt-2 text-sm"
    : "text-primary-text mt-2 text-xs";
  const sectionTitleClass = asPage
    ? "text-primary-text text-base font-bold tracking-wider uppercase"
    : "text-primary-text text-sm font-bold tracking-wider uppercase";

  const calculatorControls = (
    <div className="space-y-4">
      <div>
        <span id="level-label" className={inputLabelClass}>
          Current HyperChrome Level
        </span>
        <div
          className={
            asPage
              ? "text-secondary-text mb-2 text-sm"
              : "text-secondary-text mb-2 text-xs"
          }
        >
          Pick 0 if you don&apos;t own this color yet.
        </div>
        <div
          role="radiogroup"
          aria-labelledby="level-label"
          className="grid grid-cols-5 gap-2"
        >
          {[0, 1, 2, 3, 4].map((lvl) => (
            <button
              key={lvl}
              type="button"
              role="radio"
              aria-checked={level === String(lvl)}
              onClick={() => setLevel(String(lvl))}
              className={cn(
                "cursor-pointer rounded-lg border py-2.5 text-sm font-bold transition-all duration-150 focus-visible:ring-border-focus focus-visible:ring-2 focus-visible:outline-none",
                level === String(lvl)
                  ? "border-button-info bg-button-info text-form-button-text shadow-sm"
                  : "border-border-card bg-tertiary-bg text-primary-text hover:border-button-info/50",
              )}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="pity"
          className={
            asPage
              ? "text-primary-text mb-2 block text-sm tracking-wider uppercase"
              : "text-primary-text mb-2 block text-xs tracking-wider uppercase"
          }
        >
          Current {isSmallServer ? "Small" : "Big"} Server Pity
        </label>
        <div className="flex items-center gap-3">
          <input
            type="text"
            id="pity"
            inputMode="decimal"
            autoComplete="off"
            className="border-border-card bg-tertiary-bg text-primary-text focus:border-button-info focus-visible:ring-border-focus aria-invalid:border-form-error aria-invalid:focus:border-form-error aria-invalid:focus-visible:ring-form-error w-24 shrink-0 rounded-lg border p-3 text-sm font-medium shadow-sm transition-all duration-150 focus-visible:ring-2 focus-visible:outline-none"
            placeholder="0"
            value={pity}
            aria-invalid={pityTooHigh}
            maxLength={5}
            onChange={(e) => updatePity(sanitizeDecimalInput(e.target.value))}
          />
          <Slider
            value={[Math.min(100, Math.max(0, Number(pity) || 0))]}
            min={0}
            max={100}
            step={0.1}
            onValueChange={([v]) => updatePity(String(v))}
            aria-label={`Current ${isSmallServer ? "small" : "big"} server pity percent`}
            className="flex-1"
          />
          <span className="text-secondary-text shrink-0 text-sm font-semibold">
            %
          </span>
        </div>
        <div className={cn(helperTextClass, pityTooHigh && "text-form-error")}>
          {pityTooHigh
            ? "Pity can't go above 100%."
            : isSmallServer
              ? "Enter the % shown in a small server. 66% here equals 100% in a big server."
              : "Enter the % shown in a big server. At 100%, your next roll is a guaranteed level-up."}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span
            className={
              asPage
                ? "text-primary-text text-sm tracking-wider whitespace-nowrap uppercase"
                : "text-primary-text text-xs tracking-wider whitespace-nowrap uppercase"
            }
          >
            Small Server
          </span>
          <Switch
            checked={isSmallServer}
            onCheckedChange={setIsSmallServer}
            aria-label="Toggle small server mode"
          ></Switch>
        </div>
      </div>

      {!levelSelected && (
        <div
          className={cn(
            "border-border-card bg-tertiary-bg text-primary-text flex items-center justify-center gap-2 rounded-lg border p-4 font-medium",
            asPage ? "text-sm" : "text-xs",
          )}
        >
          <Icon icon="heroicons:arrow-up" className="shrink-0 text-base" />
          Select your current level above to see results.
        </div>
      )}

      {showResults && (
        <div
          aria-hidden={pityTooHigh}
          className={cn(
            "space-y-4 transition-opacity",
            pityTooHigh && "pointer-events-none opacity-40",
          )}
        >
          <div>
            <div className="border-border-card bg-tertiary-bg rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div
                  className={
                    asPage
                      ? "text-primary-text text-base font-bold tracking-wider uppercase"
                      : "text-primary-text text-sm font-bold tracking-wider uppercase"
                  }
                >
                  Result
                </div>
                <div
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                    isSmallServer
                      ? "text-primary-text bg-amber-500/10"
                      : "text-primary-text bg-blue-500/10"
                  }`}
                >
                  {isSmallServer
                    ? "Small Server (0-8 Players)"
                    : "Big Server (9+ Players)"}
                </div>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="border-border-card bg-secondary-bg rounded-lg border p-5">
                  <div className="mb-2 flex items-center justify-center gap-3">
                    <div
                      className={
                        asPage
                          ? "text-primary-text text-5xl font-black"
                          : "text-primary-text text-4xl font-black"
                      }
                    >
                      {resultRobberiesNeeded}
                    </div>
                    <div
                      className={
                        asPage
                          ? "text-secondary-text text-xl font-bold"
                          : "text-secondary-text text-lg font-bold"
                      }
                    >
                      robberies
                    </div>
                  </div>
                  <div
                    className={
                      asPage
                        ? "text-primary-text text-center text-base font-medium"
                        : "text-primary-text text-center text-sm font-medium"
                    }
                  >
                    remaining to reach{" "}
                    <span className="font-black">
                      HyperChrome Level {Math.min(resultLevel + 1, 5)}
                    </span>
                    <br />
                    <span
                      className={
                        asPage
                          ? "text-secondary-text mt-1 inline-block text-sm font-normal"
                          : "text-secondary-text mt-1 inline-block text-[13px] font-normal"
                      }
                    >
                      from your current pity in{" "}
                      {isSmallServer ? "small servers" : "big servers"}
                    </span>
                  </div>
                </div>

                <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Icon
                      icon="emojione:light-bulb"
                      className="text-warning shrink-0 text-2xl"
                    />
                    <span
                      className={
                        asPage
                          ? "text-warning text-base font-bold tracking-wide"
                          : "text-warning text-sm font-bold tracking-wide"
                      }
                    >
                      Helpful Tip
                    </span>
                  </div>
                  <div
                    className={
                      asPage
                        ? "text-primary-text text-sm leading-relaxed"
                        : "text-primary-text text-[13px] leading-relaxed"
                    }
                  >
                    {isSmallServer ? (
                      <>
                        After{" "}
                        <span className="font-black">{resultTipRobberies}</span>{" "}
                        robberies you&apos;ll hit{" "}
                        <span className="font-black">66%</span>. Join a big
                        server then and your next roll is guaranteed.
                      </>
                    ) : (
                      "Big servers don't fill pity faster, they just use a different scale than small servers."
                    )}
                  </div>
                  <div
                    className={
                      asPage
                        ? "text-primary-text/90 mt-2 text-sm leading-relaxed"
                        : "text-primary-text/90 mt-2 text-[13px] leading-relaxed"
                    }
                  >
                    {isSmallServer
                      ? "Small servers also have 0.66x the natural HyperChrome odds."
                      : "They do give 1.5x the natural HyperChrome odds."}
                  </div>
                </div>
              </div>

              <div className="border-border-card bg-secondary-bg mb-4 rounded-lg border p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0">
                    <Image
                      placeholder={IMAGE_PLACEHOLDER}
                      src="https://assets.jailbreakchangelogs.com/assets/images/items/hyperchromes/jars/HyperChrome_Wildcard.webp"
                      alt="HyperChrome Wildcard"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <div
                      className={
                        asPage
                          ? "text-primary-text text-lg font-bold"
                          : "text-primary-text text-base font-bold"
                      }
                    >
                      Wildcard from VP / Mansion (random color)
                    </div>
                  </div>
                </div>

                <div className="border-border-card bg-tertiary-bg mb-3 rounded-lg border p-5">
                  <div className="mb-2 flex items-center justify-center gap-3">
                    <div
                      className={
                        asPage
                          ? "text-primary-text text-5xl font-black"
                          : "text-primary-text text-4xl font-black"
                      }
                    >
                      {resultRobberiesNeeded}
                    </div>
                    <div
                      className={
                        asPage
                          ? "text-secondary-text text-xl font-bold"
                          : "text-secondary-text text-lg font-bold"
                      }
                    >
                      VP defeats
                    </div>
                  </div>
                  <div
                    className={
                      asPage
                        ? "text-primary-text text-center text-base font-medium"
                        : "text-primary-text text-center text-sm font-medium"
                    }
                  >
                    remaining to guarantee a{" "}
                    <span className="font-black">HyperChrome Wildcard</span>
                    <br />
                    <span
                      className={
                        asPage
                          ? "text-secondary-text mt-1 inline-block text-sm font-normal"
                          : "text-secondary-text mt-1 inline-block text-[13px] font-normal"
                      }
                    >
                      from your current pity in{" "}
                      {isSmallServer ? "small servers" : "big servers"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="border-border-card bg-tertiary-bg rounded-lg border p-3 text-center">
                    <div className="text-secondary-text mb-1 text-[11px] uppercase">
                      Big server
                    </div>
                    <div className="text-primary-text text-2xl font-black">
                      {HYPERCHROME_PITY_PUBLIC[resultLevel]}
                    </div>
                    <div className="text-secondary-text text-xs">
                      robberies from 0%
                    </div>
                  </div>
                  <div className="border-border-card bg-tertiary-bg rounded-lg border p-3 text-center">
                    <div className="text-secondary-text mb-1 text-[11px] uppercase">
                      Small server
                    </div>
                    <div className="text-primary-text text-2xl font-black">
                      {HYPERCHROME_PITY_SMALL[resultLevel]}
                    </div>
                    <div className="text-secondary-text text-xs">
                      robberies from 0%
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={
                  asPage
                    ? "text-primary-text flex flex-col items-center gap-1 text-center text-sm font-medium"
                    : "text-primary-text flex flex-col items-center gap-1 text-center text-xs font-medium"
                }
              >
                <div>
                  Level {resultLevel} at {resultPity}%{" "}
                  {isSmallServer ? "small server" : "big server"} pity
                </div>
                <div className="text-primary-text/70 mt-1">
                  {isSmallServer ? (
                    <>
                      Equivalent to{" "}
                      {(
                        (((resultPity / 100) *
                          HYPERCHROME_PITY_SMALL[resultLevel]) /
                          HYPERCHROME_PITY_PUBLIC[resultLevel]) *
                        100
                      ).toFixed(2)}
                      % big server pity
                    </>
                  ) : (
                    <>
                      Equivalent to{" "}
                      {(
                        (((resultPity / 100) *
                          HYPERCHROME_PITY_PUBLIC[resultLevel]) /
                          HYPERCHROME_PITY_SMALL[resultLevel]) *
                        100
                      ).toFixed(2)}
                      % small server pity
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="border-border-card bg-tertiary-bg rounded-lg border p-4">
              <div className={cn(sectionTitleClass, "mb-3")}>
                If You Trade Levels
              </div>
              <div
                className={
                  asPage
                    ? "text-primary-text mb-4 text-sm font-medium"
                    : "text-primary-text mb-4 text-xs font-medium"
                }
              >
                Trading doesn&apos;t reset pity. Here&apos;s your big server
                pity if you owned this color at another level:
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((lvlNum) => {
                  // Always show public/big server pity here as it's the standard for trading
                  const currentPityBase = isSmallServer
                    ? HYPERCHROME_PITY_SMALL[resultLevel]
                    : HYPERCHROME_PITY_PUBLIC[resultLevel];
                  const robberiesDone = (resultPity / 100) * currentPityBase;
                  const publicPity =
                    (robberiesDone / HYPERCHROME_PITY_PUBLIC[lvlNum]) * 100;
                  const isGuaranteed = publicPity >= 100;
                  const cappedPct = Math.min(publicPity, 100);
                  const barColor =
                    cappedPct >= 66
                      ? "var(--color-form-success)"
                      : cappedPct >= 33
                        ? "var(--color-warning)"
                        : "var(--color-button-danger)";

                  return (
                    <div
                      key={lvlNum}
                      className="border-border-card bg-secondary-bg flex flex-col gap-2 rounded-lg border p-3"
                    >
                      <div className="text-secondary-text text-[11px] font-semibold tracking-wider uppercase">
                        Level {lvlNum}
                      </div>
                      <div
                        className="text-2xl font-black"
                        style={{ color: barColor }}
                      >
                        {isGuaranteed ? "100%" : `${publicPity.toFixed(2)}%`}
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="bg-button-secondary h-1.5 w-full overflow-hidden rounded-full">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${cappedPct}%`,
                              backgroundColor: barColor,
                            }}
                          />
                        </div>
                        <div className="text-secondary-text text-xs">
                          {isGuaranteed
                            ? "Guaranteed next roll"
                            : "Big server pity"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const calculatorInformation = (
    <div className="space-y-6">
      <div>
        <h2 className={sectionTitleClass}>Pities and Chances</h2>
        <div className={`text-primary-text mt-3 space-y-2 ${bodyTextClass}`}>
          <p>
            <span className="font-semibold">HyperChromes</span> are the rarest
            bonus roulette reward. There are 8 colors, each tied to a robbery
            (listed below).
          </p>
          <p>
            Your first roll of a color gives you Level 1, and each roll after
            that levels it up, to a max of Level 5. The base chance is under 1%
            and drops at each level.
          </p>
          <p>
            Every miss adds pity to that color, less per roll at higher levels.
            The game shows it under the bonus roll once it passes 10%. At 100%,
            your next roll is guaranteed.
          </p>
          <p>
            Pity needed is the{" "}
            <span className="font-semibold">chance denominator × 1.25</span>.
            Small servers (0-8 players) and private servers run at{" "}
            <span className="font-semibold">66% odds</span>, so they need more
            rolls.
          </p>
          <p>
            Rolling a HyperChrome, by luck or by pity, resets that color&apos;s
            pity to 0. Trading for one doesn&apos;t.
          </p>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table
            className={`text-primary-text min-w-full ${asPage ? "text-sm" : "text-xs"}`}
          >
            <thead className="text-secondary-text">
              <tr className="border-border-card border-b">
                <th className="px-2 py-2 text-left font-semibold">Level</th>
                <th className="px-2 py-2 text-left font-semibold">
                  Chance per Roll
                </th>
                <th className="px-2 py-2 text-left font-semibold">Approx. %</th>
                <th className="px-2 py-2 text-left font-semibold">
                  Pity (Big)
                </th>
                <th className="px-2 py-2 text-left font-semibold">
                  Pity (Small)
                </th>
              </tr>
            </thead>
            <tbody>
              {referenceRows.map((row) => (
                <tr
                  key={row.level}
                  className="border-border-card/60 border-b last:border-b-0"
                >
                  <td className="px-2 py-2 font-semibold">{row.level}</td>
                  <td className="px-2 py-2">{row.chancePerRoll}</td>
                  <td className="px-2 py-2">{row.approxPercent}</td>
                  <td className="px-2 py-2">{row.pity}</td>
                  <td className="px-2 py-2">{row.smallPity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className={sectionTitleClass}>HyperChrome Colors by Robbery</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {hyperchromeRobberyImages.map((item) => {
            const imageSrc = `https://assets.jailbreakchangelogs.com/assets/images/items/hyperchromes/jars/${item.name}.webp`;
            return (
              <div
                key={item.name}
                className="flex items-center gap-3 rounded-lg border-2 p-3 text-left sm:p-4"
                style={{
                  borderColor:
                    hyperchromeBorderColors[item.name] ?? "#ffffff1a",
                  backgroundColor:
                    hyperchromeBgColors[item.name] ?? "transparent",
                }}
              >
                <div className="relative h-12 w-12 shrink-0 sm:h-14 sm:w-14">
                  <Image
                    placeholder={IMAGE_PLACEHOLDER}
                    src={imageSrc}
                    alt={item.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-primary-text text-sm font-semibold sm:text-base">
                    {item.name}
                  </div>
                  <div className="text-secondary-text text-xs leading-snug sm:text-sm">
                    {item.robbery}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (asPage) {
    return (
      <div className="space-y-6">
        <div className="border-border-card bg-secondary-bg rounded-lg border p-6 shadow-lg">
          {calculatorControls}
        </div>
        <section>{calculatorInformation}</section>
      </div>
    );
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleClose();
        }
      }}
    >
      <SheetContent
        side="right"
        className="bg-secondary-bg flex h-full w-full max-w-180 flex-col p-0 shadow-lg"
      >
        <div className="modal-header text-primary-text flex shrink-0 items-center justify-between px-6 py-4 text-xl font-semibold">
          <span>Hyperchrome Pity Calculator</span>
        </div>
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
          {calculatorControls}
          {calculatorInformation}
        </div>
      </SheetContent>
    </Sheet>
  );
}
