"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import { TrophyIcon } from "@heroicons/react/24/solid";
import confetti from "canvas-confetti";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

export default function RedeemPage() {
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    premiumtype: number;
    redeemed: boolean;
  } | null>(null);
  const validateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);

  const [redeemedResult, setRedeemedResult] = useState<{
    premiumtype: number;
    message: string;
  } | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const { isAuthenticated, user } = useAuthContext();

  // Confetti function with custom colors
  const triggerConfetti = (customColors?: string[]) => {
    // Default random colors if none provided
    const defaultPalette = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E9",
    ];

    const colors =
      customColors ||
      defaultPalette.sort(() => 0.5 - Math.random()).slice(0, 2);
    const end = Date.now() + 5 * 1000;

    const frame = () => {
      if (Date.now() > end) return;

      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors: colors,
        scalar: 2,
        zIndex: 1300,
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors: colors,
        scalar: 2,
        zIndex: 1300,
      });

      requestAnimationFrame(frame);
    };

    frame();
  };

  const lastValidatedCodeRef = useRef<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const codeParam = urlParams.get("code");
      if (codeParam) {
        setCode(codeParam);
      }
    }
  }, []);

  const validateCode = useCallback((codeToValidate: string) => {
    lastValidatedCodeRef.current = codeToValidate;

    if (validateTimeoutRef.current) {
      clearTimeout(validateTimeoutRef.current);
    }

    if (!codeToValidate.trim()) {
      setValidationResult(null);
      setIsValidating(false);
      setMessage(null);
      return;
    }

    setIsValidating(true);

    validateTimeoutRef.current = setTimeout(async () => {
      // Create a local variable to capture the code being validated in this closure
      const currentCode = codeToValidate;

      try {
        const res = await fetch(
          `/api/codes/validate?code=${encodeURIComponent(currentCode)}`,
          { cache: "no-store" },
        );

        // If the code has changed since this request started, discard the result
        if (lastValidatedCodeRef.current !== currentCode) {
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setValidationResult(data);
        } else {
          // Should not happen often with the API fix (404 returns 200 with valid:false)
          // But if it does (e.g. 500 error), treat as invalid validation attempt
          setValidationResult(null);
        }
      } catch (err) {
        console.error("Validation error:", err);
        if (lastValidatedCodeRef.current === currentCode) {
          setValidationResult(null);
        }
      } finally {
        if (lastValidatedCodeRef.current === currentCode) {
          setIsValidating(false);
        }
      }
    }, 500);
  }, []);

  useEffect(() => {
    validateCode(code);
  }, [code, validateCode]);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setMessage({ text: "Please log in to redeem codes", type: "error" });
      return;
    }

    if (!code.trim()) {
      setMessage({ text: "Please enter a code", type: "error" });
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmRedeem = async () => {
    setShowConfirmModal(false);
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/codes/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRedeemedResult({
          premiumtype: data.premiumtype,
          message: data.message || "Code redeemed successfully",
        });

        setShowCelebrationModal(true);

        // Determine confetti colors based on tier
        let confettiColors = ["#ffffff", "#4ECDC4"]; // Default
        if (data.premiumtype === 1) confettiColors = ["#ffffff", "#cd7f32"]; // Bronze
        if (data.premiumtype === 2) confettiColors = ["#ffffff", "#c0c0c0"]; // Silver
        if (data.premiumtype === 3) confettiColors = ["#ffffff", "#ffd700"]; // Gold

        triggerConfetti(confettiColors);

        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get("code")) {
            urlParams.delete("code");
            const newUrl = `${window.location.pathname}${urlParams.toString() ? "?" + urlParams.toString() : ""}`;
            window.history.replaceState({}, "", newUrl);
          }
        }
      } else if (response.status === 400) {
        const data = await response.text();
        if (data === '"Code already redeemed"') {
          setMessage({
            text: "This code has already been redeemed",
            type: "error",
          });
        } else {
          setMessage({ text: "Invalid code format", type: "error" });
        }

        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get("code")) {
            urlParams.delete("code");
            const newUrl = `${window.location.pathname}${urlParams.toString() ? "?" + urlParams.toString() : ""}`;
            window.history.replaceState({}, "", newUrl);
          }
        }
      } else if (response.status === 404) {
        setMessage({ text: "Invalid Code", type: "error" });
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get("code")) {
            urlParams.delete("code");
            const newUrl = `${window.location.pathname}${urlParams.toString() ? "?" + urlParams.toString() : ""}`;
            window.history.replaceState({}, "", newUrl);
          }
        }
      } else if (response.status === 409) {
        setMessage({
          text: "The code has already been redeemed",
          type: "error",
        });
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get("code")) {
            urlParams.delete("code");
            const newUrl = `${window.location.pathname}${urlParams.toString() ? "?" + urlParams.toString() : ""}`;
            window.history.replaceState({}, "", newUrl);
          }
        }
      } else {
        setMessage({
          text: "An error occurred. Please try again.",
          type: "error",
        });
      }
    } catch {
      setMessage({
        text: "An error occurred. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto mb-8 max-w-[1920px] px-4 pb-16 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Breadcrumb />
        <h1 className="text-primary-text mb-12 text-center text-4xl font-bold">
          Redeem Jailbreak Changelogs Code
        </h1>

        <div className="grid gap-8 sm:gap-16 lg:grid-cols-2">
          {/* Left Column - Redemption Form */}
          <div className="space-y-8">
            <form onSubmit={handleRedeem} className="space-y-8">
              <div className="space-y-2">
                <label
                  htmlFor="code"
                  className="text-secondary-text mb-3 block text-lg font-medium"
                >
                  Enter your code here
                </label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className={`border-border-primary bg-secondary-bg text-primary-text hover:border-border-focus w-full rounded-lg border px-6 py-3 text-lg transition-colors focus:ring-2 focus:outline-none ${
                    message?.type === "error"
                      ? "border-button-danger focus:ring-button-danger"
                      : "focus:border-button-info focus:ring-button-info"
                  }`}
                  placeholder="Enter your code here"
                  disabled={isLoading}
                />
                {/* Validation Feedback */}
                {isValidating && (
                  <div className="text-button-info mt-2 flex items-center text-sm">
                    <svg
                      className="text-button-info mr-2 -ml-1 h-4 w-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Validating code...
                  </div>
                )}

                {!isValidating && validationResult && (
                  <div
                    className={`mt-2 flex items-center space-x-2 text-sm ${
                      !validationResult.valid || validationResult.redeemed
                        ? "text-button-danger"
                        : "text-button-info"
                    }`}
                  >
                    {!validationResult.valid || validationResult.redeemed ? (
                      <>
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>
                          {!validationResult.valid
                            ? "This code is invalid."
                            : "This code has already been redeemed."}
                        </span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span>Valid code! Ready to redeem.</span>
                      </>
                    )}
                  </div>
                )}

                {message && !isValidating && (
                  <div
                    className={`flex items-center space-x-2 text-sm ${
                      message.type === "success"
                        ? "text-button-info"
                        : "text-button-danger"
                    }`}
                  >
                    {message.type === "success" ? (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    )}
                    <span>{message.text}</span>
                  </div>
                )}
                <p className="text-tertiary-text mt-4 text-sm">
                  By redeeming your code, you represent that you, and your
                  parent or legal guardian if you are under age 18, agree to our{" "}
                  <Link href="/tos" className="text-link hover:text-link-hover">
                    Terms of Use
                  </Link>{" "}
                  and acknowledge our{" "}
                  <Link
                    href="/privacy"
                    className="text-link hover:text-link-hover"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  isLoading ||
                  !code.trim() ||
                  isValidating ||
                  (validationResult !== null &&
                    (!validationResult.valid || validationResult.redeemed))
                }
                className={`w-full rounded-lg px-6 py-4 text-lg font-semibold transition-colors ${
                  isLoading ||
                  !code.trim() ||
                  isValidating ||
                  (validationResult !== null &&
                    (!validationResult.valid || validationResult.redeemed))
                    ? "border-button-info-disabled bg-button-info-disabled text-form-button-text cursor-not-allowed"
                    : "bg-button-info text-form-button-text hover:bg-button-info-hover hover:cursor-pointer"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="text-form-button-text mr-3 -ml-1 h-5 w-5 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Redeeming...
                  </div>
                ) : (
                  "Redeem"
                )}
              </button>
            </form>
          </div>

          {/* Right Column - Instructions */}
          <div className="border-border-primary bg-secondary-bg rounded-lg border p-4 sm:p-8">
            <h2 className="text-primary-text mb-6 text-2xl font-semibold">
              How to Get a Code
            </h2>
            <ol className="text-secondary-text space-y-6">
              <li className="flex flex-col sm:flex-row sm:items-start">
                <span className="bg-button-info text-form-button-text mb-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-semibold sm:mr-4 sm:mb-0">
                  1
                </span>
                <div className="text-lg">
                  <span>Purchase a Supporter Tier via:</span>
                  <ul className="mt-2 space-y-2 text-base">
                    <li className="flex flex-col items-center sm:flex-row sm:items-center">
                      <div className="mb-1 flex items-center sm:mb-0">
                        <Image
                          src="https://assets.jailbreakchangelogs.xyz/assets/images/kofi_assets/kofi_symbol.svg"
                          alt="Ko-fi Symbol"
                          width={16}
                          height={16}
                          className="mr-2"
                        />
                      </div>
                      <span className="text-center sm:ml-0 sm:text-left">
                        <a
                          href="https://ko-fi.com/jbchangelogs"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-link hover:text-link-hover"
                        >
                          Ko-fi
                        </a>{" "}
                        (include Discord ID in message)
                      </span>
                    </li>
                    <li className="text-tertiary-text flex items-center justify-center text-sm font-medium">
                      OR
                    </li>
                    <li className="flex flex-col items-center sm:flex-row sm:items-center">
                      <div className="mb-1 flex items-center sm:mb-0">
                        <RobloxIcon className="mr-2 h-4 w-4" />
                      </div>
                      <span className="text-center sm:ml-0 sm:text-left">
                        Our{" "}
                        <a
                          href="https://www.roblox.com/games/104188650191561/Support-Us"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-link hover:text-link-hover"
                        >
                          Roblox game
                        </a>{" "}
                        (complete actions in-game)
                      </span>
                    </li>
                  </ul>
                </div>
              </li>
              <li className="flex flex-col sm:flex-row sm:items-start">
                <span className="bg-button-info text-form-button-text mb-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-semibold sm:mr-4 sm:mb-0">
                  2
                </span>
                <div className="text-lg">
                  <span>Receive your unique code via Discord</span>
                  <p className="text-tertiary-text mt-1 text-sm">
                    Your code will be sent to your Discord via our bot. Having
                    issues? Join our{" "}
                    <a
                      href="https://discord.jailbreakchangelogs.xyz/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-link hover:text-link-hover"
                    >
                      Discord server
                    </a>{" "}
                    for support.
                  </p>
                </div>
              </li>
              <li className="flex flex-col sm:flex-row sm:items-start">
                <span className="bg-button-info text-form-button-text mb-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-semibold sm:mr-4 sm:mb-0">
                  3
                </span>
                <span className="text-lg">
                  Paste your code in the input field and click
                  &quot;Redeem&quot; to get your benefits
                </span>
              </li>
            </ol>

            <div className="bg-button-info/10 border-border-primary mt-8 rounded border p-4 shadow-sm">
              <div className="mb-2 flex items-start gap-4">
                <div className="relative z-10">
                  <span className="text-primary-text text-base font-bold">
                    Ko-fi Supporters
                  </span>
                  <div className="text-secondary-text mt-1">
                    When purchasing via Ko-fi,{" "}
                    <span className="font-bold">
                      ensure your Discord user ID is in parenthesis inside your
                      message
                    </span>{" "}
                    (e.g., <code>Hello there! (1019539798383398946)</code>).
                    This is required to receive your code!
                  </div>
                </div>
              </div>
            </div>

            <div className="border-border-primary mt-4 border-t pt-4">
              <p className="text-secondary-text mb-6 text-lg">
                Thank you for supporting us!
              </p>
              <Link
                href="/supporting"
                className="text-link hover:text-link-hover inline-flex items-center text-lg"
              >
                <span>View all supporter tiers and benefits</span>
                <svg
                  className="ml-2 h-5 w-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M9 5l7 7-7 7"></path>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        className="relative z-50"
      >
        <div
          className="bg-overlay-bg fixed inset-0 backdrop-blur-sm"
          aria-hidden="true"
        />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="modal-container border-button-info bg-secondary-bg mx-auto w-full max-w-md rounded-lg border p-4 shadow-lg sm:p-6">
            <div className="mb-4">
              <DialogTitle className="text-primary-text text-xl font-semibold">
                Confirm Code Redemption
              </DialogTitle>
              {user &&
              validationResult &&
              user.premiumtype > validationResult.premiumtype ? (
                <div className="bg-button-danger/10 border-button-danger mt-4 rounded-lg border p-3">
                  <p className="text-button-danger mb-1 text-sm font-bold">
                    Warning: Downgrade Detected
                  </p>
                  <p className="text-secondary-text text-sm">
                    You are currently{" "}
                    <span className="text-primary-text font-bold">
                      Tier {user.premiumtype}
                    </span>
                    . Redeeming this code (Tier {validationResult.premiumtype})
                    will{" "}
                    <span className="text-primary-text font-bold">
                      replace your current benefits
                    </span>{" "}
                    and you will be downgraded.
                  </p>
                  <p className="text-secondary-text mt-2 text-sm font-bold">
                    Are you sure you want to proceed?
                  </p>
                </div>
              ) : (
                <p className="text-secondary-text mt-2 text-sm">
                  Are you sure you want to redeem this code?
                </p>
              )}
            </div>

            <div className="border-border-primary bg-tertiary-bg mb-6 rounded-lg border p-3">
              <p className="text-secondary-text text-sm">
                <span className="font-medium">Code:</span>{" "}
                <code className="text-primary-text block max-w-full truncate">
                  {code}
                </code>
              </p>
              {validationResult && validationResult.premiumtype > 0 && (
                <p className="text-secondary-text mt-1 text-sm">
                  <span className="font-medium">Tier:</span>{" "}
                  <span className="text-primary-text">
                    Tier {validationResult.premiumtype}
                  </span>
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="border-border-primary text-secondary-text hover:bg-tertiary-bg hover:text-primary-text w-full rounded-lg border px-4 py-2 transition-colors hover:cursor-pointer sm:flex-1"
              >
                Cancel
              </button>
              <button
                onClick={confirmRedeem}
                className={`${user && validationResult && user.premiumtype > validationResult.premiumtype ? "bg-button-danger hover:bg-red-600" : "bg-button-info hover:bg-button-info-hover"} text-form-button-text w-full rounded-lg px-4 py-2 transition-colors hover:cursor-pointer sm:flex-1`}
              >
                {user &&
                validationResult &&
                user.premiumtype > validationResult.premiumtype
                  ? "Confirm Downgrade"
                  : "Redeem Code"}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <Dialog
        open={showCelebrationModal}
        onClose={() => setShowCelebrationModal(false)}
        className="relative z-50"
      >
        <div
          className="bg-overlay-bg fixed inset-0 backdrop-blur-sm"
          aria-hidden="true"
        />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="modal-container border-button-info bg-secondary-bg mx-auto w-full max-w-lg rounded-lg border p-4 shadow-lg sm:p-8">
            <div className="absolute inset-0 overflow-hidden rounded-lg">
              <div
                className="absolute -top-4 left-1/4 h-2 w-2 animate-bounce rounded-full bg-yellow-400"
                style={{ animationDelay: "0s", animationDuration: "1s" }}
              ></div>
              <div
                className="absolute -top-4 left-1/2 h-2 w-2 animate-bounce rounded-full bg-blue-400"
                style={{ animationDelay: "0.2s", animationDuration: "1s" }}
              ></div>
              <div
                className="absolute -top-4 left-3/4 h-2 w-2 animate-bounce rounded-full bg-green-400"
                style={{ animationDelay: "0.4s", animationDuration: "1s" }}
              ></div>
              <div
                className="absolute -top-4 left-1/3 h-2 w-2 animate-bounce rounded-full bg-purple-400"
                style={{ animationDelay: "0.6s", animationDuration: "1s" }}
              ></div>
              <div
                className="absolute -top-4 left-2/3 h-2 w-2 animate-bounce rounded-full bg-pink-400"
                style={{ animationDelay: "0.8s", animationDuration: "1s" }}
              ></div>
            </div>

            <div className="relative text-center">
              <div className="bg-secondary-bg/50 border-border-primary mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border">
                {redeemedResult &&
                redeemedResult.premiumtype >= 1 &&
                redeemedResult.premiumtype <= 3 ? (
                  <Image
                    src={`https://assets.jailbreakchangelogs.xyz/assets/website_icons/jbcl_supporter_${redeemedResult.premiumtype}.svg`}
                    alt={`Supporter Tier ${redeemedResult.premiumtype}`}
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                ) : (
                  <TrophyIcon className="h-10 w-10 text-yellow-500" />
                )}
              </div>

              <DialogTitle className="text-primary-text mb-4 text-3xl font-bold">
                Code Redeemed Successfully!
              </DialogTitle>

              <p className="text-secondary-text mb-4 text-lg">
                The code has been successfully redeemed! You have received{" "}
                <span className="text-primary-text font-bold">
                  {redeemedResult
                    ? `Supporter Tier ${redeemedResult.premiumtype}`
                    : "Supporter"}
                </span>
                .
              </p>

              <p className="text-primary-text mb-6 text-base font-bold">
                Thank you for your support!
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/supporting${redeemedResult ? `?tier=${redeemedResult.premiumtype}` : ""}`}
                  className="bg-button-info text-form-button-text hover:bg-button-info-hover w-full rounded-lg px-4 py-2 text-center transition-colors sm:flex-1"
                >
                  View Your New Benefits
                </Link>
                <Link
                  href="/"
                  className="bg-button-info text-form-button-text hover:bg-button-info-hover w-full rounded-lg px-4 py-2 transition-colors sm:flex-1"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
