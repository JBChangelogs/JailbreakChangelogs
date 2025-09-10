"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Dialog, DialogContent } from "@mui/material";
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      scroll="paper"
      slotProps={{
        paper: {
          sx: {
            minHeight: { xs: "60vh", sm: "55vh" },
          },
        },
      }}
    >
      <DialogContent
        sx={{ p: 0, backgroundColor: "#212A31", border: "1px solid #2E3944" }}
      >
        <div className="relative space-y-5 p-4 sm:p-6">
          <button
            aria-label="Close"
            onClick={onClose}
            className="absolute top-3 right-3 rounded-md p-1 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-white">
              Hyperchrome Pity Calculator
            </h2>
            <p className="text-xs text-[#A0A7AC]">
              Answer a few questions to calculate robberies needed to reach the
              next level.
            </p>
          </div>

          <div className="text-sm text-neutral-400">Step {step} of 2</div>

          {step === 1 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">
                What is your current hyperchrome level? (0-4)
              </label>
              <div className="text-xs text-[#A0A7AC]">
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
                    control: (base) => ({
                      ...base,
                      backgroundColor: "#37424D",
                      borderColor: "#2E3944",
                      color: "#D3D9D4",
                    }),
                    singleValue: (base) => ({ ...base, color: "#D3D9D4" }),
                    menu: (base) => ({
                      ...base,
                      backgroundColor: "#37424D",
                      color: "#D3D9D4",
                      zIndex: 3000,
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected
                        ? "#5865F2"
                        : state.isFocused
                          ? "#2E3944"
                          : "#37424D",
                      color:
                        state.isSelected || state.isFocused
                          ? "#FFFFFF"
                          : "#D3D9D4",
                    }),
                  }}
                />
              ) : (
                <div className="h-10 w-full animate-pulse rounded-md border border-[#2E3944] bg-[#37424D]"></div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">
                What is your current pity? (0-100)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                className="w-full rounded border p-2"
                style={{
                  backgroundColor: "#37424D",
                  borderColor: "#2E3944",
                  color: "#D3D9D4",
                }}
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

          {/* Step 3 removed; advanced info is shown in results */}

          <div
            className={`flex items-center pt-2 ${step === 1 ? "justify-end" : "justify-between"}`}
          >
            {step > 1 && (
              <button
                className="rounded-md border border-[#2E3944] bg-[#37424D] px-4 py-2 text-sm font-medium text-white hover:bg-[#2E394D]"
                onClick={() => {
                  setHasCalculated(false);
                  setStep((s) => Math.max(1, s - 1));
                }}
              >
                Back
              </button>
            )}
            {step < 2 ? (
              <button
                className="rounded-md bg-[#5865F2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4752C4] disabled:opacity-50"
                onClick={() => setStep((s) => Math.min(2, s + 1))}
              >
                Next
              </button>
            ) : (
              <button
                className="rounded-md bg-[#5865F2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4752C4]"
                onClick={() => setHasCalculated(true)}
              >
                Calculate
              </button>
            )}
          </div>

          {hasCalculated && step === 2 && (
            <div className="rounded-lg border border-[#5865F2] bg-[#212A31] p-4">
              <div className="mb-1 text-sm text-[#A0A7AC]">Result</div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-extrabold text-white">
                  {robberiesNeeded}
                </div>
                <div className="text-base text-[#D3D9D4]">
                  robberies to reach HyperChrome Level {Math.min(level + 1, 5)}
                </div>
              </div>
              <div className="mt-2 text-xs text-[#A0A7AC]">
                💡Pro tip: After {robberiesNeeded} robberies, pity reaches
                <span className="px-1 font-semibold text-white">66.6%</span>
                in private servers. Robbing in a public server at that point
                guarantees an instant level-up
              </div>
              <div className="mt-2 text-xs text-[#A0A7AC]">
                Based on Level {level}, {pity}% pity.
              </div>
            </div>
          )}
          {hasCalculated && step === 2 && (
            <div className="rounded-lg border border-[#5865F2] bg-[#212A31] p-4">
              <div className="mb-2 text-xs text-[#A0A7AC]">
                If you trade to a different level, here&apos;s what your pity
                would be for each level-up.
              </div>
              {level !== 0 && parseFloat(otherPity[0]) <= 100 && (
                <div className="text-base text-[#D3D9D4]">
                  Level 0 <FaArrowRight className="mx-1 inline" /> Level 1:{" "}
                  {otherPity[0]}%
                </div>
              )}
              {parseFloat(otherPity[1]) <= 100 && (
                <div className="text-base text-[#D3D9D4]">
                  Level 1 <FaArrowRight className="mx-1 inline" /> Level 2:{" "}
                  {otherPity[1]}%
                </div>
              )}
              {parseFloat(otherPity[2]) <= 100 && (
                <div className="text-base text-[#D3D9D4]">
                  Level 2 <FaArrowRight className="mx-1 inline" /> Level 3:{" "}
                  {otherPity[2]}%
                </div>
              )}
              {parseFloat(otherPity[3]) <= 100 && (
                <div className="text-base text-[#D3D9D4]">
                  Level 3 <FaArrowRight className="mx-1 inline" /> Level 4:{" "}
                  {otherPity[3]}%
                </div>
              )}
              {parseFloat(otherPity[4]) <= 100 && (
                <div className="text-base text-[#D3D9D4]">
                  Level 4 <FaArrowRight className="mx-1 inline" /> Level 5:{" "}
                  {otherPity[4]}%
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
