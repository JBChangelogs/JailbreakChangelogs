"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, Tab, Box, Dialog, DialogContent } from "@mui/material";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { storeCampaign } from "@/utils/notifications/campaign";
import { useSearchParams } from "next/navigation";
import {
  showProcessingAuthToast,
  dismissProcessingAuthToast,
} from "@/utils/auth/auth";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

function LoginModalInner({ open, onClose }: LoginModalProps) {
  const [tabValue, setTabValue] = useState(0);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [joinDiscord, setJoinDiscord] = useState(false);
  const tokenProcessedRef = useRef(false);
  const { login, user, isAuthenticated, showLoginModal, setShowLoginModal } =
    useAuthContext();
  const { resolvedTheme } = useTheme();
  const searchParams = useSearchParams();
  const campaign = searchParams.get("campaign");

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleClose = useCallback(() => {
    setShowLoginModal(false);
    onClose();
  }, [setShowLoginModal, onClose]);

  useEffect(() => {
    // Check if we have a token in the URL and haven't processed it yet
    if (typeof window !== "undefined" && !tokenProcessedRef.current) {
      // Use Next.js useSearchParams to get token from URL
      const token = searchParams.get("token");

      if (campaign) {
        storeCampaign(campaign);
      }

      if (token) {
        tokenProcessedRef.current = true;
        // Only show loading toast if we're not already redirecting
        if (!isRedirecting) {
          const loadingToast = showProcessingAuthToast();

          login(token)
            .then((response) => {
              if (response.success) {
                // Clean up the URL by removing the token parameter
                let newUrl = window.location.pathname;

                // Preserve hash if it exists
                if (window.location.hash) {
                  newUrl += window.location.hash;
                }

                // Remove token from main URL parameters if it exists
                const urlParams = new URLSearchParams(window.location.search);
                urlParams.delete("token");
                const newSearch = urlParams.toString();
                if (newSearch) {
                  newUrl += "?" + newSearch;
                }

                window.history.replaceState({}, "", newUrl);
                handleClose();
              } else {
                throw new Error(response.error || "Authentication failed");
              }
            })
            .catch((error) => {
              console.error("Authentication error:", error);

              // Clean up the URL by removing the token parameter on any auth error
              let newUrl = window.location.pathname;

              // Preserve hash if it exists
              if (window.location.hash) {
                newUrl += window.location.hash;
              }

              // Remove token from main URL parameters if it exists
              const urlParams = new URLSearchParams(window.location.search);
              urlParams.delete("token");
              const newSearch = urlParams.toString();
              if (newSearch) {
                newUrl += "?" + newSearch;
              }

              window.history.replaceState({}, "", newUrl);
              // Reset the processed token state on error
              tokenProcessedRef.current = false;
            })
            .finally(() => {
              dismissProcessingAuthToast(loadingToast);
            });
        }
      }
    }

    const handleSetLoginTab = (event: CustomEvent) => {
      setTabValue(event.detail);
    };

    window.addEventListener("setLoginTab", handleSetLoginTab as EventListener);

    return () => {
      window.removeEventListener(
        "setLoginTab",
        handleSetLoginTab as EventListener,
      );
    };
  }, [onClose, isRedirecting, login, handleClose, searchParams, campaign]);

  return (
    <AnimatePresence>
      {(open || showLoginModal) && (
        <Dialog
          open={open || showLoginModal}
          onClose={handleClose}
          maxWidth="sm"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                backgroundColor: "transparent",
                border: "none",
                borderRadius: "8px",
                boxShadow: "none",
                overflow: "visible",
                "& .MuiDialogContent-root": {
                  padding: "24px",
                  borderRadius: "8px",

                  "&:first-of-type": {
                    paddingTop: "24px",
                  },
                },
              },
            },
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-overlay-bg fixed inset-0 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
              y: 20,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: 20,
            }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="relative z-10"
          >
            <DialogContent
              sx={{
                p: 3,
                backgroundColor: "var(--color-secondary-bg)",
                borderRadius: "16px",
                border: "1px solid var(--color-border-primary)",
                boxShadow: "var(--color-card-shadow)",
                backdropFilter: "blur(12px)",
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <Box
                  sx={{
                    borderBottom: 1,
                    borderColor: "var(--color-border-primary)",
                    mb: 3,
                  }}
                >
                  <Tabs
                    value={campaign ? 0 : tabValue}
                    onChange={campaign ? undefined : handleTabChange}
                    variant="fullWidth"
                    sx={{
                      "& .MuiTabs-indicator": {
                        backgroundColor: "var(--color-button-info)",
                      },
                      "& .Mui-selected": {
                        color: "var(--color-button-info) !important",
                      },
                      "& .MuiTab-root": {
                        color: "var(--color-secondary-text)",
                      },
                    }}
                  >
                    <Tab
                      icon={
                        <Image
                          src="https://assets.jailbreakchangelogs.xyz/assets/logos/discord/Discord_Logo.webp"
                          alt="Discord"
                          width={120}
                          height={36}
                          draggable={false}
                          className="opacity-70 transition-opacity"
                        />
                      }
                      iconPosition="top"
                      sx={{
                        "&.Mui-selected .opacity-70": {
                          opacity: 1,
                        },
                      }}
                    />
                    {!campaign && (
                      <Tab
                        icon={
                          <Image
                            src={
                              resolvedTheme === "dark"
                                ? "/assets/logos/roblox/Roblox_Logo_Light.webp"
                                : "/assets/logos/roblox/Roblox_Logo_Dark.webp"
                            }
                            alt="Roblox"
                            width={120}
                            height={36}
                            draggable={false}
                            className="opacity-70 transition-opacity"
                          />
                        }
                        iconPosition="top"
                        sx={{
                          "&.Mui-selected .opacity-70": {
                            opacity: 1,
                          },
                        }}
                      />
                    )}
                  </Tabs>
                </Box>
              </motion.div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={campaign ? 0 : tabValue}
                  initial={{
                    opacity: 0,
                    x: (campaign ? 0 : tabValue) === 0 ? -20 : 20,
                  }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{
                    opacity: 0,
                    x: (campaign ? 0 : tabValue) === 0 ? 20 : -20,
                  }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <TabPanel value={campaign ? 0 : tabValue} index={0}>
                    <motion.div
                      className="mb-8 flex flex-col items-center gap-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                    >
                      <h2 className="text-primary-text mb-2 text-xl font-semibold">
                        Connect with Discord
                      </h2>
                      <p className="text-secondary-text text-center text-sm">
                        {campaign ? (
                          <>
                            Log in with Discord to support the{" "}
                            <span className="text-button-info font-medium">
                              {campaign}
                            </span>{" "}
                            campaign! Your login helps the campaign owner track
                            participation and engagement. We only collect your
                            publicly available Discord details. Your data
                            security is important to us - there&apos;s no need
                            to provide a password.
                          </>
                        ) : (
                          <>
                            Jailbreak Changelogs connects with Discord to build
                            your user profile. We only collect your publicly
                            available Discord details. To use our trading
                            features, you&apos;ll need to link your Roblox
                            account after signing in. Your data security is
                            important to us - there&apos;s no need to provide a
                            password.
                          </>
                        )}
                      </p>
                    </motion.div>

                    <motion.div
                      className="space-y-4 text-center"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                    >
                      <p className="text-tertiary-text mb-4 text-xs">
                        By continuing, you agree to our{" "}
                        <a
                          href="/tos"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-link-hover text-link underline"
                        >
                          Terms of Service
                        </a>{" "}
                        and{" "}
                        <a
                          href="/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-link-hover text-link underline"
                        >
                          Privacy Policy
                        </a>
                        .
                      </p>
                      <div className="mb-4 flex justify-center">
                        <label className="flex cursor-pointer items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={joinDiscord}
                            onChange={(e) => setJoinDiscord(e.target.checked)}
                            className="text-button-info focus:ring-button-info h-4 w-4 cursor-pointer rounded"
                          />
                          <span className="text-primary-text text-sm">
                            Join our Discord server
                          </span>
                        </label>
                      </div>
                      <motion.button
                        onClick={() => {
                          setIsRedirecting(true);
                          const currentURL = window.location.href;
                          const oauthRedirect = `${PUBLIC_API_URL}/oauth?redirect=${encodeURIComponent(currentURL)}${joinDiscord ? "&join_discord=true" : ""}`;

                          toast.loading("Redirecting to Discord...", {
                            duration: 2000,
                            position: "bottom-right",
                          });

                          window.location.href = oauthRedirect;
                        }}
                        className={`bg-button-info text-form-button-text hover:bg-button-info-hover hover:shadow-button-info/25 flex w-full cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-3 font-medium shadow-lg transition-all duration-200`}
                      >
                        {campaign
                          ? "Login to Support Campaign"
                          : "Continue with Discord"}
                      </motion.button>
                    </motion.div>
                  </TabPanel>
                </motion.div>
              </AnimatePresence>

              {!campaign && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tabValue}
                    initial={{ opacity: 0, x: tabValue === 1 ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: tabValue === 1 ? 20 : -20 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <TabPanel value={tabValue} index={1}>
                      <motion.div
                        className="mb-8 flex flex-col items-center gap-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                      >
                        <h2 className="text-primary-text mb-2 text-xl font-semibold">
                          Connect with Roblox
                        </h2>
                        <p className="text-secondary-text text-center text-sm">
                          Jailbreak Changelogs connects with Roblox to build
                          your user profile. We only collect your publicly
                          available Roblox details. To use our trading features,
                          you&apos;ll need to link your Roblox account after
                          signing in. Your data security is important to us -
                          there&apos;s no need to provide a password.
                        </p>
                      </motion.div>
                      <motion.div
                        className="space-y-4 text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                      >
                        <p className="text-tertiary-text mb-4 text-xs">
                          By continuing, you agree to our{" "}
                          <a
                            href="/tos"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-link-hover text-link underline"
                          >
                            Terms of Service
                          </a>{" "}
                          and{" "}
                          <a
                            href="/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-link-hover text-link underline"
                          >
                            Privacy Policy
                          </a>
                          .
                        </p>
                        <motion.button
                          onClick={async () => {
                            try {
                              // Check if user is authenticated via AuthContext
                              if (!login) {
                                toast.error("Authentication not available", {
                                  duration: 3000,
                                  position: "bottom-right",
                                });
                                return;
                              }

                              // Check if user is authenticated via centralized auth
                              if (!isAuthenticated || !user) {
                                toast.error(
                                  "Please log in with Discord first",
                                  {
                                    duration: 3000,
                                    position: "bottom-right",
                                  },
                                );
                                return;
                              }

                              setIsRedirecting(true);
                              const currentURL = window.location.href;
                              const oauthRedirect = `/api/oauth/roblox/redirect?redirect=${encodeURIComponent(currentURL)}`;

                              toast.loading("Redirecting to Roblox...", {
                                duration: 2000,
                                position: "bottom-right",
                              });

                              window.location.href = oauthRedirect;
                            } catch (error) {
                              console.error(
                                "Error initiating Roblox OAuth:",
                                error,
                              );
                              toast.error(
                                "Failed to start Roblox authentication",
                                {
                                  duration: 3000,
                                  position: "bottom-right",
                                },
                              );
                              setIsRedirecting(false);
                            }
                          }}
                          className={`bg-button-info text-form-button-text hover:bg-button-info-hover hover:shadow-button-info/25 flex w-full cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-3 font-medium shadow-lg transition-all duration-200`}
                        >
                          Continue with Roblox
                        </motion.button>
                      </motion.div>
                    </TabPanel>
                  </motion.div>
                </AnimatePresence>
              )}
            </DialogContent>
          </motion.div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}

export default function LoginModal(props: LoginModalProps) {
  return (
    <Suspense fallback={null}>
      <LoginModalInner {...props} />
    </Suspense>
  );
}
