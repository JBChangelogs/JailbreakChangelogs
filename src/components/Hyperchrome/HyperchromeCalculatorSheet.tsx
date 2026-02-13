"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Switch } from "@headlessui/react";
import { Icon } from "../ui/IconWrapper";
import { Sheet, SheetContent } from "../ui/sheet";
import {
  calculateRobberiesToLevelUp,
  calculateAllLevelPercentages,
  calculateRobberiesToPublicPityGoal,
  HYPERCHROME_PITY_PUBLIC,
  HYPERCHROME_PITY_SMALL,
} from "@/utils/hyperchrome";
import { toast } from "sonner";
import { Button } from "../ui/button";

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
  const setMobileSheetOpen = (isOpen: boolean) => {
    if (typeof window === "undefined") return;
    const w = window as Window & { __jbMobileSheetOpenCount?: number };
    const current = w.__jbMobileSheetOpenCount ?? 0;
    const next = isOpen ? current + 1 : Math.max(0, current - 1);
    w.__jbMobileSheetOpenCount = next;
    if (next > 0) {
      document.body.dataset.mobileSheetOpen = "true";
    } else {
      delete document.body.dataset.mobileSheetOpen;
    }
    window.dispatchEvent(new Event("jb-sheet-toggle"));
  };

  const hyperchromeRobberyImages = [
    { name: "HyperRed", robbery: "Tomb" },
    { name: "HyperOrange", robbery: "Museum" },
    { name: "HyperYellow", robbery: "Cargo Train / Passenger Train" },
    { name: "HyperGreen", robbery: "Crater Bank / Rising City Bank" },
    { name: "HyperDiamond", robbery: "Jewelry Store" },
    { name: "HyperBlue", robbery: "Cargo Plane" },
    { name: "HyperPurple", robbery: "Power Plant" },
    { name: "HyperPink", robbery: "Crown Jewel" },
  ];
  const hyperchromeBorderColors: Record<string, string> = {
    HyperRed: "#ef4444",
    HyperOrange: "#f97316",
    HyperYellow: "#f59e0b",
    HyperGreen: "#22c55e",
    HyperDiamond: "#60a5fa",
    HyperBlue: "#3b82f6",
    HyperPurple: "#a855f7",
    HyperPink: "#ec4899",
  };
  const referenceRows = [
    {
      level: 1,
      probability: "0.446%",
      pity: 225,
      smallProbability: "0.297%",
      smallPity: 337,
    },
    {
      level: 2,
      probability: "0.2116%",
      pity: 470,
      smallProbability: "0.14%",
      smallPity: 709,
    },
    {
      level: 3,
      probability: "0.135%",
      pity: 740,
      smallProbability: "0.09%",
      smallPity: 1009,
    },
    {
      level: 4,
      probability: "0.115%",
      pity: 870,
      smallProbability: "0.077%",
      smallPity: 1305,
    },
    {
      level: 5,
      probability: "0.07499%",
      pity: 1334,
      smallProbability: "0.04999%",
      smallPity: 2001,
    },
  ];
  const [mounted, setMounted] = useState(false);
  const [level, setLevel] = useState<string>("");
  const [pity, setPity] = useState<string>("");
  const [hasCalculated, setHasCalculated] = useState(false);
  const [resultRobberiesNeeded, setResultRobberiesNeeded] = useState<number>(0);
  const [resultOtherPity, setResultOtherPity] = useState<Record<
    number,
    string
  > | null>(null);
  const [resultLevel, setResultLevel] = useState<number>(0);
  const [resultPity, setResultPity] = useState<number>(0);
  const [resultTipRobberies, setResultTipRobberies] = useState<number>(0);
  const [isSmallServer, setIsSmallServer] = useState(false);
  const [isColorsOpen, setIsColorsOpen] = useState(false);
  const colorsSectionRef = useRef<HTMLDetailsElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClose = useCallback(() => {
    // reset when closing
    setLevel("");
    setPity("");
    setHasCalculated(false);
    setResultRobberiesNeeded(0);
    setResultOtherPity(null);
    setResultLevel(0);
    setResultPity(0);
    setResultTipRobberies(0);
    setIsSmallServer(false);
    onClose?.();
  }, [onClose]);

  const handleCalculate = () => {
    const parsedLevel = parseInt(level);
    const parsedPity = parseFloat(pity);

    if (isNaN(parsedLevel) || parsedLevel < 0 || parsedLevel > 4) {
      toast.error("Please enter a valid level (0-4)");
      return;
    }

    if (isNaN(parsedPity) || parsedPity < 0 || parsedPity > 100) {
      toast.error("Please enter a valid pity percentage (0-100)");
      return;
    }

    const lvl = parsedLevel as 0 | 1 | 2 | 3 | 4;
    const pityPercent = parsedPity;

    const limit = 100;

    if (pityPercent > limit) {
      toast.error("Pity percentage cannot exceed 100%");
      return;
    }

    const robberies = calculateRobberiesToLevelUp(
      lvl,
      pityPercent,
      isSmallServer,
    );
    const tipRobberies = calculateRobberiesToPublicPityGoal(
      lvl,
      pityPercent,
      isSmallServer,
    );
    const others = calculateAllLevelPercentages(
      lvl,
      pityPercent,
      isSmallServer,
    );

    setResultRobberiesNeeded(robberies);
    setResultTipRobberies(tipRobberies);
    setResultOtherPity(others);
    setResultLevel(lvl);
    setResultPity(pityPercent);
    setHasCalculated(true);
  };

  // Keep results in sync if server type is toggled at result stage
  useEffect(() => {
    if (hasCalculated) {
      handleCalculate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSmallServer]);

  useEffect(() => {
    if (asPage) return;

    setMobileSheetOpen(open);

    return () => {
      if (open) {
        setMobileSheetOpen(false);
      }
    };
  }, [asPage, open]);

  if (!mounted) {
    if (asPage) {
      return (
        <div className="border-border-card bg-secondary-bg flex w-full flex-col rounded-lg border p-6 shadow-lg">
          <div className="bg-button-secondary mb-4 h-5 w-48 animate-pulse rounded" />

          <div className="mb-4 space-y-2">
            <div className="bg-button-secondary h-4 w-full animate-pulse rounded" />
            <div className="bg-button-secondary h-4 w-5/6 animate-pulse rounded" />
            <div className="bg-button-secondary h-4 w-2/3 animate-pulse rounded" />
          </div>

          <div className="mb-4 space-y-3">
            <div className="bg-button-secondary border-border-card h-12 w-full animate-pulse rounded border" />
            <div className="bg-button-secondary border-border-card h-12 w-full animate-pulse rounded border" />
          </div>

          <div className="space-y-3">
            <div className="bg-button-secondary border-border-card h-24 w-full animate-pulse rounded border" />
            <div className="bg-button-secondary border-border-card h-24 w-full animate-pulse rounded border" />
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
    ? "text-secondary-text text-base font-bold tracking-wider uppercase"
    : "text-secondary-text text-sm font-bold tracking-wider uppercase";

  const calculatorContent = (
    <>
      {!asPage && (
        <div className="modal-header text-primary-text flex shrink-0 items-center justify-between px-6 py-4 text-xl font-semibold">
          <span>Hyperchrome Pity Calculator</span>
        </div>
      )}

      <div className="modal-content flex-1 overflow-y-auto p-6">
        <div className="mb-4">
          <div className={sectionTitleClass}>Pities and Chances</div>
          <div
            className={`text-primary-text/80 mt-3 space-y-2 ${bodyTextClass}`}
          >
            <p>
              <span className="font-semibold">HyperChromes</span> are the rarest
              rewards from the bonus roulette. They come in{" "}
              <button
                type="button"
                onClick={() => {
                  setIsColorsOpen((prev) => {
                    const next = !prev;
                    if (next) {
                      setTimeout(() => {
                        const el = colorsSectionRef.current;
                        if (!el || typeof window === "undefined") return;

                        const headerOffset = 96;
                        const elementTop =
                          el.getBoundingClientRect().top + window.scrollY;
                        const targetTop = Math.max(
                          0,
                          elementTop - headerOffset,
                        );

                        window.scrollTo({
                          top: targetTop,
                          behavior: "smooth",
                        });
                      }, 0);
                    }
                    return next;
                  });
                }}
                className="text-link hover:text-link-hover cursor-pointer underline-offset-2 hover:underline"
              >
                8 different colors
              </button>
              , with most major robberies yielding a different color.
            </p>
            <p>
              Players start with a Level 1 HyperChrome after their first
              successful roll, which can level up to a maximum of Level 5 as
              they roll more of that color. The chance of getting one is below
              1% at base rates and depends on its current level. Level 5
              HyperChromes cannot be leveled further.
            </p>
            <p>
              Upon failing to obtain or evolve a HyperChrome, their pity to that
              color is increased by a small percentage (the higher the level,
              the smaller the percentage). The pity to a HyperColor can be
              viewed as a percentage underneath the bonus roll, provided it is
              above 10%, otherwise, no number is shown. If their pity reaches
              100% or above, the player is guaranteed to obtain or evolve their
              HyperChrome.
            </p>
            <p>
              Upon successfully obtaining or evolving a HyperChrome from a bonus
              roll (either through chance or through pity), the player&apos;s
              pity for that color is reset to 0. Trading for a HyperChrome does
              not reset the pity.
            </p>
            <p className="text-primary-text/70">
              Below is a table containing the approximate probabilities and
              pities for each level. The odds are lesser and pities require more
              in small (0-8 players) and private servers.
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
                    Probability
                  </th>
                  <th className="px-2 py-2 text-left font-semibold">
                    Pity Amount
                  </th>
                  <th className="px-2 py-2 text-left font-semibold">
                    Small Probability
                  </th>
                  <th className="px-2 py-2 text-left font-semibold">
                    Small Pity
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
                    <td className="px-2 py-2">{row.probability}</td>
                    <td className="px-2 py-2">{row.pity}</td>
                    <td className="px-2 py-2">{row.smallProbability}</td>
                    <td className="px-2 py-2">{row.smallPity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-4">
          <details
            ref={colorsSectionRef}
            open={isColorsOpen}
            onToggle={(e) => setIsColorsOpen(e.currentTarget.open)}
            className="border-border-card bg-tertiary-bg rounded-lg border p-4"
          >
            <summary className="text-secondary-text cursor-pointer text-sm font-bold tracking-wider uppercase">
              Hyperchrome Colors by Robbery
            </summary>
            <div className="text-primary-text/70 mt-2 text-xs">
              Each robbery drops a specific HyperChrome color.
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {hyperchromeRobberyImages.map((item) => {
                const imageSrc = `https://assets.jailbreakchangelogs.xyz/assets/images/items/hyperchromes/jars/${item.name}.webp`;
                return (
                  <div
                    key={item.name}
                    className="bg-secondary-bg flex items-center gap-3 rounded-lg border p-3 text-left"
                    style={{
                      borderColor:
                        hyperchromeBorderColors[item.name] ?? "#ffffff1a",
                    }}
                  >
                    <div className="relative h-14 w-14 shrink-0">
                      <Image
                        src={imageSrc}
                        alt={item.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-primary-text text-sm font-semibold">
                        {item.name}
                      </div>
                      <div className="text-secondary-text text-xs leading-snug">
                        {item.robbery}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        </div>

        <div className="mb-4">
          <label htmlFor="level" className={inputLabelClass}>
            Hyperchrome Level
          </label>
          <div
            className={
              asPage
                ? "text-primary-text mb-2 text-sm"
                : "text-primary-text mb-2 text-xs"
            }
          >
            Level 0 means you have no hyperchrome yet.
          </div>
          <input
            type="number"
            id="level"
            min={0}
            max={4}
            className="border-border-card bg-form-input text-primary-text focus:border-button-info w-full rounded border p-3 text-sm focus:outline-none"
            placeholder="Enter your hyperchrome level (0-4)"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          />
        </div>

        <div className="mb-4">
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
          <input
            type="number"
            id="pity"
            min={0}
            max={100}
            step="any"
            className="border-border-card bg-form-input text-primary-text focus:border-button-info w-full rounded border p-3 text-sm focus:outline-none"
            placeholder={`Enter your current ${isSmallServer ? "small" : "big"} server pity %`}
            value={pity}
            onChange={(e) => setPity(e.target.value)}
          />
          <div className={helperTextClass}>
            {isSmallServer
              ? "Reaching 66.6% in a small server is equivalent to 100% in a big server, guaranteeing an instant level-up!"
              : "Big server pity is the baseline; reaching 100% guarantees an instant level-up."}
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between gap-2 sm:justify-start">
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
                onChange={setIsSmallServer}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none ${
                  isSmallServer ? "bg-button-info" : "bg-button-secondary"
                }`}
                aria-label="Toggle small server mode"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isSmallServer ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </Switch>
            </div>
            <Button
              size="md"
              type="button"
              onClick={handleCalculate}
              data-umami-event="Hyper Pity Calculate"
              className="w-full sm:w-auto"
            >
              Calculate
            </Button>
          </div>
        </div>

        {hasCalculated && resultOtherPity && (
          <div className="mb-4">
            <div className="border-border-card bg-tertiary-bg rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div
                  className={
                    asPage
                      ? "text-secondary-text text-base font-bold tracking-wider uppercase"
                      : "text-secondary-text text-sm font-bold tracking-wider uppercase"
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
                    to reach{" "}
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
                      (staying in{" "}
                      {isSmallServer ? "Small Servers" : "Big Servers"})
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
                    After{" "}
                    <span className="font-black">{resultTipRobberies}</span>{" "}
                    robberies, your pity reaches{" "}
                    <span className="font-black">66.6%</span> in Small Servers.
                  </div>
                  <div
                    className={
                      asPage
                        ? "text-primary-text/90 mt-2 text-sm leading-relaxed"
                        : "text-primary-text/90 mt-2 text-[13px] leading-relaxed"
                    }
                  >
                    Switch to a Big Server (9+ Players) at that point to
                    guarantee an instant level-up.
                  </div>
                  <div className="text-secondary-text mt-2 text-xs">
                    (This optimization is most useful near the end of a level.)
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
                  Based on Level {resultLevel} with {resultPity}%{" "}
                  {isSmallServer ? "Small Server" : "Big Server"} Pity
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
                      % Big Server Pity
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
                      % Small Server Pity
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {hasCalculated && resultOtherPity && (
          <div className="mb-4">
            <div className="border-border-card bg-tertiary-bg rounded-lg border p-4">
              <div className="text-secondary-text mb-3 text-sm font-bold tracking-wider uppercase">
                Alternative Level Calculations
              </div>
              <div className="text-primary-text mb-4 text-xs font-medium">
                If you trade to a different level, here&apos;s what your public
                pity would be:
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

                  if (publicPity > 100) return null;

                  return (
                    <div
                      key={lvlNum}
                      className="border-border-card bg-secondary-bg rounded-lg border p-3 text-center"
                    >
                      <div className="text-primary-text text-lg font-bold">
                        Level {lvlNum}
                      </div>
                      <div className="text-secondary-text text-sm">
                        {publicPity.toFixed(2)}% pity
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );

  if (asPage) {
    return (
      <div className="border-border-card bg-secondary-bg flex w-full flex-col rounded-lg border shadow-lg">
        {calculatorContent}
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
        className="bg-secondary-bg flex h-full w-full max-w-[720px] flex-col p-0 shadow-lg"
      >
        {calculatorContent}
      </SheetContent>
    </Sheet>
  );
}
