"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Icon } from "../ui/IconWrapper";
import {
  calculateRobberiesToLevelUp,
  calculateAllLevelPercentages,
} from "@/utils/hyperchrome";
import { toast } from "react-hot-toast";

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    onClose();
  }, [onClose]);

  if (!mounted) return null;

  const handleNext = () => {
    const parsedLevel = parseInt(level);
    if (isNaN(parsedLevel) || parsedLevel < 0 || parsedLevel > 4) {
      toast.error("Please enter a valid level (0-4)");
      return;
    }
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

    const robberies = calculateRobberiesToLevelUp(lvl, pityPercent);
    const others = calculateAllLevelPercentages(lvl, pityPercent);

    setResultRobberiesNeeded(robberies);
    setResultOtherPity(others);
    setResultLevel(lvl);
    setResultPity(pityPercent);
    setHasCalculated(true);
  };

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
            <button
              aria-label="Close"
              onClick={handleClose}
              className="text-secondary-text hover:text-primary-text cursor-pointer rounded-md p-1 hover:bg-white/10"
            >
              <Icon icon="heroicons:x-mark" className="h-5 w-5" />
            </button>
          </div>

          <div className="modal-content flex-1 overflow-y-auto p-6">
            <div className="mb-4">
              <p className="text-secondary-text text-sm">
                Answer a few questions to calculate robberies needed to reach
                the next level.
              </p>
              <div className="text-secondary-text mt-2 text-sm">
                Step {step} of 2
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

            {step === 2 && (
              <div className="mb-4">
                <label
                  htmlFor="pity"
                  className="text-secondary-text mb-1 text-xs tracking-wider uppercase"
                >
                  Current Pity
                </label>
                <input
                  type="number"
                  id="pity"
                  min={0}
                  max={100}
                  className="border-border-primary bg-form-input text-primary-text hover:border-border-focus focus:border-button-info w-full rounded border p-3 text-sm focus:outline-none"
                  placeholder="Enter your current pity percentage (0-100)"
                  value={pity}
                  onChange={(e) => setPity(e.target.value)}
                />
              </div>
            )}

            {hasCalculated && step === 2 && resultOtherPity && (
              <div className="mb-4">
                <div className="border-border-primary bg-primary-bg hover:border-border-focus rounded-lg border p-4">
                  <div className="text-secondary-text mb-3 text-sm font-medium tracking-wider uppercase">
                    Result
                  </div>

                  <div className="bg-secondary-bg mb-4 rounded-lg p-4">
                    <div className="mb-2 flex items-center justify-center gap-3">
                      <div className="text-primary-text text-4xl font-black">
                        {resultRobberiesNeeded}
                      </div>
                      <div className="text-secondary-text text-lg font-medium">
                        robberies
                      </div>
                    </div>
                    <div className="text-secondary-text text-center text-sm">
                      to reach{" "}
                      <span className="text-primary-text font-semibold">
                        HyperChrome Level {Math.min(resultLevel + 1, 5)}
                      </span>
                    </div>
                  </div>

                  <div className="border-warning/20 bg-secondary-bg mb-3 rounded-lg border p-3">
                    <div className="flex items-start gap-2">
                      <Icon
                        icon="emojione:light-bulb"
                        className="text-warning text-3xl"
                      />
                      <div className="text-secondary-text text-xs leading-relaxed">
                        <span className="font-semibold">Helpful tip:</span>{" "}
                        After {resultRobberiesNeeded} robberies, pity reaches{" "}
                        <span className="text-primary-text font-bold">
                          66.6%
                        </span>{" "}
                        in private servers. Robbing in a public server at that
                        point guarantees an instant level-up!
                      </div>
                    </div>
                  </div>

                  <div className="text-secondary-text text-center text-xs">
                    Based on Level {resultLevel}, {resultPity}% pity
                  </div>
                </div>
              </div>
            )}
            {hasCalculated && step === 2 && resultOtherPity && (
              <div className="mb-4">
                <div className="border-border-primary bg-primary-bg hover:border-border-focus rounded-lg border p-4">
                  <div className="text-secondary-text mb-3 text-sm font-medium tracking-wider uppercase">
                    Alternative Level Calculations
                  </div>
                  <div className="text-secondary-text mb-4 text-xs">
                    If you trade to a different level, here&apos;s what your
                    pity would be for each level-up:
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {parseFloat(resultOtherPity[1]) <= 100 && (
                      <div className="bg-secondary-bg rounded-lg p-3 text-center">
                        <div className="text-primary-text text-lg font-bold">
                          Level 1
                        </div>
                        <div className="text-secondary-text text-sm">
                          {resultOtherPity[1]}% pity
                        </div>
                      </div>
                    )}
                    {parseFloat(resultOtherPity[2]) <= 100 && (
                      <div className="bg-secondary-bg rounded-lg p-3 text-center">
                        <div className="text-primary-text text-lg font-bold">
                          Level 2
                        </div>
                        <div className="text-secondary-text text-sm">
                          {resultOtherPity[2]}% pity
                        </div>
                      </div>
                    )}
                    {parseFloat(resultOtherPity[3]) <= 100 && (
                      <div className="bg-secondary-bg rounded-lg p-3 text-center">
                        <div className="text-primary-text text-lg font-bold">
                          Level 3
                        </div>
                        <div className="text-secondary-text text-sm">
                          {resultOtherPity[3]}% pity
                        </div>
                      </div>
                    )}
                    {parseFloat(resultOtherPity[4]) <= 100 && (
                      <div className="bg-secondary-bg rounded-lg p-3 text-center">
                        <div className="text-primary-text text-lg font-bold">
                          Level 4
                        </div>
                        <div className="text-secondary-text text-sm">
                          {resultOtherPity[4]}% pity
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer flex shrink-0 justify-end gap-2 px-6 py-4">
            {step > 1 && (
              <button
                type="button"
                onClick={() => {
                  setStep((s) => Math.max(1, s - 1));
                }}
                className="text-secondary-text hover:text-primary-text cursor-pointer rounded border-none bg-transparent px-4 py-2 text-sm"
              >
                Back
              </button>
            )}
            {step < 2 ? (
              <button
                type="button"
                onClick={handleNext}
                className="bg-button-info text-form-button-text hover:bg-button-info-hover min-w-[100px] cursor-pointer rounded border-none px-4 py-2 text-sm"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCalculate}
                data-umami-event="Hyper Pity Calculate"
                className="bg-button-info text-form-button-text hover:bg-button-info-hover min-w-[100px] cursor-pointer rounded border-none px-4 py-2 text-sm"
              >
                Calculate
              </button>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
