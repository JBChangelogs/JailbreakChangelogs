"use client";

import type { ReactNode, SyntheticEvent } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, Tab, Box, Dialog, DialogContent } from "@mui/material";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

interface LoginModalViewProps {
  showLoginModal: boolean;
  tabValue: number;
  campaign: string | null;
  resolvedTheme: string | undefined;
  joinDiscord: boolean;
  onTabChange: (_event: SyntheticEvent, newValue: number) => void;
  onClose: () => void;
  onJoinDiscordChange: (checked: boolean) => void;
  onDiscordLogin: () => void;
  onRobloxLogin: () => Promise<void>;
}

export default function LoginModalView({
  showLoginModal,
  tabValue,
  campaign,
  resolvedTheme,
  joinDiscord,
  onTabChange,
  onClose,
  onJoinDiscordChange,
  onDiscordLogin,
  onRobloxLogin,
}: LoginModalViewProps) {
  const activeTabValue = campaign ? 0 : tabValue;
  const isOpen = showLoginModal;

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          open={isOpen}
          onClose={onClose}
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
                "@media (max-width: 480px)": {
                  margin: 0,
                  width: "100vw",
                  maxWidth: "100vw",
                  borderRadius: 0,
                },
                "& .MuiDialogContent-root": {
                  padding: "24px",
                  borderRadius: "8px",
                  "&:first-of-type": {
                    paddingTop: "24px",
                  },
                  "@media (max-width: 360px)": {
                    padding: "16px",
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
            onClick={onClose}
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
              className="border-border-card bg-primary-bg/75 backdrop-blur-lg"
              sx={{
                p: 3,
                borderRadius: "16px",
                border: "1px solid var(--color-border-card)",
                boxShadow: "none",
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
                    value={activeTabValue}
                    onChange={campaign ? undefined : onTabChange}
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
                      "@media (max-width: 360px)": {
                        "& .MuiTab-root": {
                          minHeight: "44px",
                          padding: "6px 8px",
                        },
                      },
                    }}
                  >
                    <Tab
                      icon={
                        <Image
                          src={
                            resolvedTheme === "dark"
                              ? "/logos/discord/Discord_Logo.webp"
                              : "/logos/discord/Discord_Logo_Dark.webp"
                          }
                          alt="Discord"
                          width={132}
                          height={36}
                          draggable={false}
                          className="h-auto w-[88px] transition-opacity max-[480px]:w-[72px] sm:w-[132px]"
                        />
                      }
                      iconPosition="top"
                    />
                    {!campaign && (
                      <Tab
                        icon={
                          <Image
                            src={
                              resolvedTheme === "dark"
                                ? "/logos/roblox/Roblox_Logo.webp"
                                : "/logos/roblox/Roblox_Logo_Dark.webp"
                            }
                            alt="Roblox"
                            width={112}
                            height={36}
                            draggable={false}
                            className="h-auto w-[76px] transition-opacity max-[480px]:w-[64px] sm:w-[112px]"
                          />
                        }
                        iconPosition="top"
                      />
                    )}
                  </Tabs>
                </Box>
              </motion.div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTabValue}
                  initial={{ opacity: 0, x: activeTabValue === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: activeTabValue === 0 ? 20 : -20 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <TabPanel value={activeTabValue} index={0}>
                    <motion.div
                      className="mb-8 flex flex-col items-center gap-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                    >
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
                      <p className="text-primary-text mb-4 text-xs">
                        By continuing, you agree to our{" "}
                        <a
                          href="/tos"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-link hover:text-link-hover underline"
                        >
                          Terms of Service
                        </a>{" "}
                        and{" "}
                        <a
                          href="/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-link hover:text-link-hover underline"
                        >
                          Privacy Policy
                        </a>
                        .
                      </p>
                      <div className="mb-4 flex justify-center">
                        <label
                          htmlFor="join-discord"
                          className="border-border-card bg-tertiary-bg hover:bg-quaternary-bg inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors select-none"
                        >
                          <Checkbox
                            id="join-discord"
                            className="border-primary-text"
                            checked={joinDiscord}
                            onCheckedChange={(checked) =>
                              onJoinDiscordChange(checked === true)
                            }
                          />
                          <span className="text-primary-text text-sm">
                            Join our Discord server
                          </span>
                        </label>
                      </div>
                      <Button
                        onClick={onDiscordLogin}
                        variant="default"
                        size="lg"
                        className="w-full"
                        data-umami-event="Login with Discord"
                        {...(campaign && {
                          "data-umami-event-campaign": campaign,
                        })}
                      >
                        {campaign
                          ? "Login to Support Campaign"
                          : "Continue with Discord"}
                      </Button>
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
                        <p className="text-primary-text mb-4 text-xs">
                          By continuing, you agree to our{" "}
                          <a
                            href="/tos"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-link hover:text-link-hover underline"
                          >
                            Terms of Service
                          </a>{" "}
                          and{" "}
                          <a
                            href="/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-link hover:text-link-hover underline"
                          >
                            Privacy Policy
                          </a>
                          .
                        </p>
                        <Button
                          onClick={onRobloxLogin}
                          variant="default"
                          size="lg"
                          className="w-full"
                          data-umami-event="Login with Roblox"
                        >
                          Continue with Roblox
                        </Button>
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
