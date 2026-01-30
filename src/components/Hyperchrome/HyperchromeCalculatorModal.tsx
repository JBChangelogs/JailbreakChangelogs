"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Icon } from "../ui/IconWrapper";
import {
  calculateRobberiesToLevelUp,
  calculateAllLevelPercentages,
  calculateRobberiesToPublicPityGoal,
  HYPERCHROME_PITY_PUBLIC,
  HYPERCHROME_PITY_SMALL,
} from "@/utils/hyperchrome";
import { toast } from "sonner";
import { Button } from "../ui/button";

interface HyperchromeCalculatorModalProps {
  open: boolean;
  onClose: () => void;
}

export default function HyperchromeCalculatorModal({
  open,
  onClose,
}: HyperchromeCalculatorModalProps) {
  const [mounted, setMounted] = useState(false);
  const [level, setLevel] = useState<string>("");
  const [pity, setPity] = useState<string>("");
  const [step, setStep] = useState(1);
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

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClose = useCallback(() => {
    // reset when closing
    setLevel("");
    setPity("");
    setStep(1);
    setHasCalculated(false);
    setResultRobberiesNeeded(0);
    setResultOtherPity(null);
    setResultLevel(0);
    setResultPity(0);
    setResultTipRobberies(0);
    setIsSmallServer(false);
    onClose();
  }, [onClose]);

  const handleNext = () => {
    const parsedLevel = parseInt(level);
    if (isNaN(parsedLevel) || parsedLevel < 0 || parsedLevel > 4) {
      toast.error("Please enter a valid level (0-4)");
      return;
    }
    setHasCalculated(false);
    setStep(2);
  };

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

  if (!mounted) return null;

  return (
    <Dialog open={open} onClose={handleClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="modal-container border-button-info bg-secondary-bg flex max-h-[70vh] w-full max-w-[480px] min-w-[320px] flex-col rounded-lg border shadow-lg">
          <div className="modal-header text-primary-text flex shrink-0 items-center justify-between px-6 py-4 text-xl font-semibold">
            <span>Hyperchrome Pity Calculator</span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close"
              onClick={handleClose}
              className="text-secondary-text hover:text-primary-text"
            >
              <Icon icon="heroicons:x-mark" />
            </Button>
          </div>

          <div className="modal-content flex-1 overflow-y-auto p-6">
            <div className="mb-4">
              <p className="text-secondary-text text-sm">
                Answer a few questions to calculate robberies needed to reach
                the next level.
              </p>
              <div className="text-secondary-text mt-2 flex items-center justify-between text-sm">
                <span>Step {step} of 2</span>
                {hasCalculated && (
                  <Button
                    size="sm"
                    onClick={() => setIsSmallServer(!isSmallServer)}
                  >
                    <Icon icon="heroicons:arrows-right-left" />
                    Switch to {isSmallServer ? "Big Server" : "Small Server"}
                  </Button>
                )}
              </div>
            </div>

            {step === 1 && (
              <div className="mb-4">
                <label
                  htmlFor="level"
                  className="text-secondary-text mb-1 text-xs tracking-wider uppercase"
                >
                  Hyperchrome Level
                </label>
                <div className="text-secondary-text mb-2 text-xs">
                  Level 0 means you have no hyperchrome yet.
                </div>
                <input
                  type="number"
                  id="level"
                  min={0}
                  max={4}
                  className="border-border-primary bg-form-input text-primary-text hover:border-border-focus focus:border-button-info w-full rounded border p-3 text-sm focus:outline-none"
                  placeholder="Enter your hyperchrome level (0-4)"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                />
              </div>
            )}

            {step === 2 && !hasCalculated && (
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label
                    htmlFor="pity"
                    className="text-secondary-text text-xs tracking-wider uppercase"
                  >
                    Current {isSmallServer ? "Small" : "Big"} Server Pity
                  </label>
                  <Button
                    size="sm"
                    onClick={() => setIsSmallServer(!isSmallServer)}
                  >
                    Switch to {isSmallServer ? "Big Server" : "Small Server"}
                  </Button>
                </div>
                <input
                  type="number"
                  id="pity"
                  min={0}
                  max={100}
                  step="any"
                  className="border-border-primary bg-form-input text-primary-text hover:border-border-focus focus:border-button-info w-full rounded border p-3 text-sm focus:outline-none"
                  placeholder={`Enter your current ${isSmallServer ? "small" : "big"} server pity %`}
                  value={pity}
                  onChange={(e) => setPity(e.target.value)}
                />
                {isSmallServer && (
                  <div className="text-secondary-text mt-2 text-xs">
                    Reaching 66.6% in a small server is equivalent to 100% in a
                    big server, guaranteeing an instant level-up!
                  </div>
                )}
              </div>
            )}

            {hasCalculated && step === 2 && resultOtherPity && (
              <div className="mb-4">
                <div className="border-border-primary bg-tertiary-bg hover:border-border-focus rounded-lg border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-secondary-text text-sm font-bold tracking-wider uppercase">
                      Result
                    </div>
                    <div
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                        isSmallServer
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-blue-500/10 text-blue-500"
                      }`}
                    >
                      {isSmallServer
                        ? "Small Server (0-8 Players)"
                        : "Big Server (9+ Players)"}
                    </div>
                  </div>

                  <div className="bg-primary-bg mb-4 rounded-lg p-5">
                    <div className="mb-2 flex items-center justify-center gap-3">
                      <div className="text-primary-text text-4xl font-black">
                        {resultRobberiesNeeded}
                      </div>
                      <div className="text-secondary-text text-lg font-bold">
                        robberies
                      </div>
                    </div>
                    <div className="text-primary-text text-center text-sm font-medium">
                      to reach{" "}
                      <span className="font-black">
                        HyperChrome Level {Math.min(resultLevel + 1, 5)}
                      </span>
                      <br />
                      <span className="text-secondary-text mt-1 inline-block text-[13px] font-normal">
                        (staying in{" "}
                        {isSmallServer ? "Small Servers" : "Big Servers"})
                      </span>
                    </div>
                  </div>

                  <div className="border-warning/30 bg-primary-bg mb-4 rounded-lg border p-4">
                    <div className="flex items-start gap-3">
                      <Icon
                        icon="emojione:light-bulb"
                        className="text-warning shrink-0 text-4xl"
                      />
                      <div className="text-primary-text text-[13px] leading-relaxed">
                        <span className="text-warning font-bold">
                          Helpful tip:
                        </span>{" "}
                        After {resultTipRobberies} robberies, pity reaches{" "}
                        <span className="font-black">66.6%</span> in Small
                        Servers (0-8 Players). Robbing in a Big Server (9+
                        Players) at that point guarantees an instant level-up!
                      </div>
                    </div>
                  </div>

                  <div className="text-primary-text flex flex-col items-center gap-1 text-center text-xs font-medium">
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
            {hasCalculated && step === 2 && resultOtherPity && (
              <div className="mb-4">
                <div className="border-border-primary bg-tertiary-bg hover:border-border-focus rounded-lg border p-4">
                  <div className="text-secondary-text mb-3 text-sm font-bold tracking-wider uppercase">
                    Alternative Level Calculations
                  </div>
                  <div className="text-primary-text mb-4 text-xs font-medium">
                    If you trade to a different level, here&apos;s what your
                    public pity would be:
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((lvlNum) => {
                      // Always show public/big server pity here as it's the standard for trading
                      const currentPityBase = isSmallServer
                        ? HYPERCHROME_PITY_SMALL[resultLevel]
                        : HYPERCHROME_PITY_PUBLIC[resultLevel];
                      const robberiesDone =
                        (resultPity / 100) * currentPityBase;
                      const publicPity =
                        (robberiesDone / HYPERCHROME_PITY_PUBLIC[lvlNum]) * 100;

                      if (publicPity > 100) return null;

                      return (
                        <div
                          key={lvlNum}
                          className="bg-primary-bg rounded-lg p-3 text-center"
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

          <div className="modal-footer flex shrink-0 justify-end gap-2 px-6 py-4">
            {step > 1 && (
              <Button
                variant="ghost"
                onClick={() => {
                  if (hasCalculated) {
                    setHasCalculated(false);
                  } else {
                    setStep((s) => Math.max(1, s - 1));
                  }
                }}
              >
                Back
              </Button>
            )}
            {step < 2 ? (
              <Button type="button" onClick={handleNext}>
                Next
              </Button>
            ) : !hasCalculated ? (
              <Button
                type="button"
                onClick={handleCalculate}
                data-umami-event="Hyper Pity Calculate"
              >
                Calculate
              </Button>
            ) : null}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
