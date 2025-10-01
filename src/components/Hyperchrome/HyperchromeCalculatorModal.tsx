"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Dialog } from "@headlessui/react";
import { FaArrowRight } from "react-icons/fa";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  calculateRobberiesToLevelUp,
  calculateAllLevelPercentages,
} from "@/utils/hyperchrome";

const Select = dynamic(() => import("react-select"), { ssr: false });

interface HyperchromeCalculatorModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Render a modal that calculates how many robberies are needed to reach the next HyperChrome level based on the current level and pity percentage.
 *
 * @param open - Whether the modal is visible.
 * @param onClose - Callback invoked to close the modal.
 * @returns A Dialog-based modal element containing a two-step wizard to select HyperChrome level, enter current pity, and display calculated robberies and related pity mappings.
 */
export default function HyperchromeCalculatorModal({
  open,
  onClose,
}: HyperchromeCalculatorModalProps) {
  const [level, setLevel] = useState(0);
  const [pity, setPity] = useState(0);
  const [selectLoaded, setSelectLoaded] = useState(false);
  const [step, setStep] = useState(1);
  const [hasCalculated, setHasCalculated] = useState(false);

  useEffect(() => setSelectLoaded(true), []);
  useEffect(() => {
    if (!open) {
      // reset when closing
      setLevel(0);
      setPity(0);
      setStep(1);
      setHasCalculated(false);
    }
  }, [open]);

  const robberiesNeeded = useMemo(() => {
    const lvl = Math.min(Math.max(level, 0), 4) as 0 | 1 | 2 | 3 | 4;
    const pityPercent = Math.min(Math.max(pity, 0), 100);
    return calculateRobberiesToLevelUp(lvl, pityPercent);
  }, [level, pity]);

  const otherPity = useMemo(() => {
    const lvl = Math.min(Math.max(level, 0), 4) as 0 | 1 | 2 | 3 | 4;
    const pityPercent = Math.min(Math.max(pity, 0), 100);
    return calculateAllLevelPercentages(lvl, pityPercent);
  }, [level, pity]);

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="modal-container bg-secondary-bg border-button-info w-full max-w-[480px] min-w-[320px] rounded-lg border shadow-lg">
          <div className="modal-header text-primary-text flex items-center justify-between px-6 py-4 text-xl font-semibold">
            <span>Hyperchrome Pity Calculator</span>
            <button
              aria-label="Close"
              onClick={onClose}
              className="text-secondary-text hover:text-primary-text cursor-pointer rounded-md p-1 hover:bg-white/10 cursor-pointer"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="modal-content p-6">
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
                {selectLoaded ? (
                  <Select
                    value={{ value: level, label: `Level ${level}` }}
                    onChange={(option: unknown) => {
                      const newLevel = option
                        ? (option as { value: number }).value
                        : 0;
                      setLevel(newLevel);
                    }}
                    options={[0, 1, 2, 3, 4].map((v) => ({
                      value: v,
                      label: `Level ${v}`,
                    }))}
                    classNamePrefix="react-select"
                    className="w-full"
                    isClearable={false}
                    isSearchable={false}
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        backgroundColor: "var(--color-form-input)",
                        borderColor: "var(--color-stroke)",
                        color: "var(--color-primary-text)",
                        cursor: state.isFocused ? "pointer" : "pointer",
                      }),
                      singleValue: (base) => ({
                        ...base,
                        color: "var(--color-primary-text)",
                      }),
                      menu: (base) => ({
                        ...base,
                        backgroundColor: "var(--color-secondary-bg)",
                        color: "var(--color-primary-text)",
                        zIndex: 3000,
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected
                          ? "var(--color-button-info)"
                          : state.isFocused
                            ? "var(--color-primary-bg)"
                            : "var(--color-secondary-bg)",
                        color:
                          state.isSelected || state.isFocused
                            ? "var(--color-primary-text)"
                            : "var(--color-secondary-text)",
                      }),
                    }}
                  />
                ) : (
                  <div className="bg-form-input h-10 w-full animate-pulse rounded-md border"></div>
                )}
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
                  className="bg-form-input border-border-primary hover:border-border-focus text-primary-text focus:border-button-info w-full rounded border p-3 text-sm focus:outline-none"
                  placeholder="Enter your current pity percentage (0-100)"
                  value={pity}
                  onChange={(e) => {
                    const raw = parseFloat(e.target.value);
                    const clamped = Number.isNaN(raw)
                      ? 0
                      : Math.max(0, Math.min(100, raw));
                    setPity(clamped);
                  }}
                />
              </div>
            )}

            {hasCalculated && step === 2 && (
              <div className="mb-4">
                <div className="border-border-primary hover:border-border-focus bg-secondary-bg rounded-lg border p-4">
                  <div className="text-secondary-text mb-1 text-sm">Result</div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-primary-text text-3xl font-extrabold">
                      {robberiesNeeded}
                    </div>
                    <div className="text-secondary-text text-base">
                      robberies to reach HyperChrome Level{" "}
                      {Math.min(level + 1, 5)}
                    </div>
                  </div>
                  <div className="text-secondary-text mt-2 text-xs">
                    💡Pro tip: After {robberiesNeeded} robberies, pity reaches
                    <span className="text-primary-text px-1 font-semibold">
                      66.6%
                    </span>
                    in private servers. Robbing in a public server at that point
                    guarantees an instant level-up
                  </div>
                  <div className="text-secondary-text mt-2 text-xs">
                    Based on Level {level}, {pity}% pity.
                  </div>
                </div>
              </div>
            )}
            {hasCalculated && step === 2 && (
              <div className="mb-4">
                <div className="border-border-primary hover:border-border-focus bg-secondary-bg rounded-lg border p-4">
                  <div className="text-secondary-text mb-2 text-xs">
                    If you trade to a different level, here&apos;s what your
                    pity would be for each level-up.
                  </div>
                  {parseFloat(otherPity[1]) <= 100 && (
                    <div className="text-secondary-text text-base">
                      Level 1 <FaArrowRight className="mx-1 inline" /> Level 2:{" "}
                      {otherPity[1]}%
                    </div>
                  )}
                  {parseFloat(otherPity[2]) <= 100 && (
                    <div className="text-secondary-text text-base">
                      Level 2 <FaArrowRight className="mx-1 inline" /> Level 3:{" "}
                      {otherPity[2]}%
                    </div>
                  )}
                  {parseFloat(otherPity[3]) <= 100 && (
                    <div className="text-secondary-text text-base">
                      Level 3 <FaArrowRight className="mx-1 inline" /> Level 4:{" "}
                      {otherPity[3]}%
                    </div>
                  )}
                  {parseFloat(otherPity[4]) <= 100 && (
                    <div className="text-secondary-text text-base">
                      Level 4 <FaArrowRight className="mx-1 inline" /> Level 5:{" "}
                      {otherPity[4]}%
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer flex justify-end gap-2 px-6 py-4">
            {step > 1 && (
              <button
                type="button"
                onClick={() => {
                  setHasCalculated(false);
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
                onClick={() => setStep((s) => Math.min(2, s + 1))}
                className="bg-button-info text-form-button-text hover:bg-button-info-hover min-w-[100px] cursor-pointer rounded border-none px-4 py-2 text-sm"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setHasCalculated(true)}
                className="bg-button-info text-form-button-text hover:bg-button-info-hover min-w-[100px] cursor-pointer rounded border-none px-4 py-2 text-sm"
              >
                Calculate
              </button>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
