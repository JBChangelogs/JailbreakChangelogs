"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useQueryState } from "nuqs";
import { useAuthContext } from "@/contexts/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Spinner } from "@/components/ui/Spinner";
import { safeSetJSON } from "@/utils/storage/safeStorage";
import { UserData } from "@/types/auth";
import { createLogger } from "@/services/logger";

const log = createLogger("UI");

export default function RedeemPage() {
  const [code, setCode] = useQueryState("code", {
    defaultValue: "",
    history: "replace",
    shallow: true,
  });
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

  const lastValidatedCodeRef = useRef<string>("");

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
        log.error("Validation error", err);
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

        if (user) {
          const updatedUser: UserData = {
            ...user,
            premiumtype: data.premiumtype,
          };
          safeSetJSON("user", updatedUser);
          window.dispatchEvent(
            new CustomEvent("authStateChanged", { detail: updatedUser }),
          );
        }

        setShowCelebrationModal(true);
        setCode(null);
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

        setCode(null);
      } else if (response.status === 404) {
        setMessage({ text: "Invalid Code", type: "error" });
        setCode(null);
      } else if (response.status === 409) {
        setMessage({
          text: "The code has already been redeemed",
          type: "error",
        });
        setCode(null);
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

  const isDowngrade =
    user && validationResult && user.premiumtype > validationResult.premiumtype;

  return (
    <div className="container mx-auto mb-8 max-w-480 px-4 pb-16 sm:px-8">
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
                  className={`border-border-card bg-secondary-bg text-primary-text hover:border-border-focus w-full rounded-lg border px-6 py-3 text-lg transition-colors focus:ring-2 focus:outline-none ${
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
                    <Spinner className="mr-2 -ml-1 h-4 w-4" />
                    Validating code...
                  </div>
                )}

                {!isValidating && validationResult && (
                  <div
                    className={`mt-2 flex items-center space-x-2 text-sm ${
                      !validationResult.valid || validationResult.redeemed
                        ? "text-button-danger"
                        : "text-link"
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

              <Button
                type="submit"
                disabled={
                  isLoading ||
                  !code.trim() ||
                  isValidating ||
                  (validationResult !== null &&
                    (!validationResult.valid || validationResult.redeemed))
                }
                className="w-full py-6 text-lg"
                size="lg"
                data-rybbit-event="Redeem Code"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Spinner className="mr-3 -ml-1 h-5 w-5" />
                    Redeeming...
                  </div>
                ) : (
                  "Redeem"
                )}
              </Button>
            </form>
          </div>

          {/* Right Column - Instructions */}
          <div className="border-border-card bg-secondary-bg rounded-lg border p-4 sm:p-8">
            <h2 className="text-primary-text mb-6 text-2xl font-semibold">
              How to Get a Code
            </h2>
            <ol className="text-secondary-text space-y-6">
              <li className="flex flex-col sm:flex-row sm:items-start">
                <span className="bg-button-info text-form-button-text mb-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-semibold sm:mr-4 sm:mb-0">
                  1
                </span>
                <div className="text-lg">
                  <span>Purchase a Supporter Tier via:</span>
                  <ul className="mt-2 space-y-2 text-base">
                    <li className="flex flex-col items-center sm:flex-row sm:items-center">
                      <div className="mb-1 flex items-center sm:mb-0">
                        <Image
                          src="/logos/kofi_symbol.svg"
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
                <span className="bg-button-info text-form-button-text mb-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-semibold sm:mr-4 sm:mb-0">
                  2
                </span>
                <div className="text-lg">
                  <span>Receive your unique code via Discord</span>
                  <p className="text-tertiary-text mt-1 text-sm">
                    Your code will be sent to your Discord via our bot. Having
                    issues? Join our{" "}
                    <a
                      href="https://discord.jailbreakchangelogs.com/"
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
                <span className="bg-button-info text-form-button-text mb-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-semibold sm:mr-4 sm:mb-0">
                  3
                </span>
                <span className="text-lg">
                  Paste your code in the input field and click
                  &quot;Redeem&quot; to get your benefits
                </span>
              </li>
            </ol>

            <div className="bg-button-info/10 border-border-card mt-8 rounded border p-4 shadow-sm">
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

            <div className="border-border-card mt-4 border-t pt-4">
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

      <ConfirmDialog
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmRedeem}
        title="Confirm Code Redemption"
        confirmText={isDowngrade ? "Confirm Downgrade" : "Redeem Code"}
        confirmVariant={isDowngrade ? "destructive" : "default"}
      >
        <>
          {isDowngrade ? (
            <div className="bg-button-danger/10 border-button-danger mb-4 rounded-lg border p-3">
              <p className="text-button-danger mb-1 text-sm font-bold">
                Warning: Downgrade Detected
              </p>
              <p className="text-secondary-text text-sm">
                You are currently{" "}
                <span className="text-primary-text font-bold">
                  Tier {user.premiumtype}
                </span>
                . Redeeming this code (Tier {validationResult!.premiumtype})
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
            <p className="text-secondary-text mb-4 text-sm">
              Are you sure you want to redeem this code?
            </p>
          )}

          <div className="border-border-card bg-tertiary-bg mb-6 rounded-lg border p-3">
            <p className="text-secondary-text text-sm">
              <span className="font-medium">Code:</span>{" "}
              <code className="text-primary-text break-all">{code}</code>
            </p>
            {validationResult && validationResult.premiumtype > 0 && (
              <p className="text-secondary-text mt-1 flex items-center gap-1 text-sm">
                <span className="font-medium">Tier:</span>{" "}
                <span className="text-primary-text">
                  Supporter{" "}
                  {
                    (["I", "II", "III"] as const)[
                      validationResult.premiumtype - 1
                    ]
                  }
                </span>
                <Image
                  src={`https://assets.jailbreakchangelogs.com/assets/website_icons/jbcl_supporter_${validationResult.premiumtype}.svg`}
                  alt={`Supporter Tier ${validationResult.premiumtype}`}
                  width={16}
                  height={16}
                  className="object-contain"
                />
              </p>
            )}
          </div>
        </>
      </ConfirmDialog>

      <Dialog
        open={showCelebrationModal}
        onOpenChange={setShowCelebrationModal}
      >
        <DialogContent className="max-w-lg p-4 sm:p-8" showClose>
          <div className="text-center">
            {redeemedResult &&
            redeemedResult.premiumtype >= 1 &&
            redeemedResult.premiumtype <= 3 ? (
              <Image
                src={`https://assets.jailbreakchangelogs.com/assets/website_icons/jbcl_supporter_${redeemedResult.premiumtype}.svg`}
                alt={`Supporter Tier ${redeemedResult.premiumtype}`}
                width={80}
                height={80}
                className="mx-auto mb-6 object-contain"
              />
            ) : (
              <Icon
                icon="heroicons:trophy-solid"
                className="mx-auto mb-6 h-20 w-20 text-yellow-500"
              />
            )}

            <DialogTitle className="mb-4 text-3xl font-bold">
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
          </div>

          <DialogFooter className="mt-4 gap-2 px-0 pt-2 pb-0">
            <DialogClose asChild>
              <Button variant="ghost" size="sm">
                Close
              </Button>
            </DialogClose>
            <Button asChild size="sm">
              <Link
                href={`/supporting${redeemedResult ? `?tier=${redeemedResult.premiumtype}` : ""}`}
              >
                View Your New Benefits
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/">Get Started</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
