"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  getExperimentIndicatorPlacement,
  setExperimentIndicatorPlacement,
} from "@/utils/ui/experimentIndicator";
import { PUBLIC_API_URL, getResponseErrorMessage } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import {
  fetchSyncedOverrides,
  isOverrideSyncEnabled,
  mergeOverrideChanges,
  setOverrideSyncEnabled,
  writeSyncedOverrides,
} from "@/utils/api/experimentOverrideSync";
import {
  canOverrideExperiments,
  ExperimentOverrideRejectedError,
  parseExperimentsResponse,
  readExperimentOverrides,
  sameExperimentOverrides,
  saveExperimentOverrides,
  serializeExperimentOverrides,
  subscribeExperimentOverrides,
  validateExperimentOverrides,
  type ExperimentOverrides,
} from "@/utils/api/experiments";

const segment =
  "text-secondary-text has-checked:bg-button-info has-checked:text-form-button-text has-focus-visible:ring-border-focus has-disabled:cursor-not-allowed has-disabled:opacity-50 cursor-pointer rounded-md px-3 py-1 text-sm font-medium transition-colors has-focus-visible:ring-2";

/** "item_fuzzy_searching" -> "Item Fuzzy Searching". */
const experimentName = (key: string) =>
  key
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

/** treatment/control as On/Off; other variants by name. */
const variantLabel = (variant: string | undefined) =>
  variant === "treatment"
    ? "On"
    : variant === "control"
      ? "Off"
      : variant
        ? variant.charAt(0).toUpperCase() + variant.slice(1)
        : "not enrolled";

async function fetchAssignments(
  overrides: ExperimentOverrides,
  signal?: AbortSignal,
) {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL,
    "/v2/users/me/experiments",
  );
  delete headers["X-Experiment"];
  const header = serializeExperimentOverrides(overrides);
  if (header) headers["X-Experiment"] = header;
  const response = await fetch(url, {
    headers,
    credentials: "include",
    cache: "no-store",
    signal,
  });
  if (!response.ok) {
    throw new Error(
      await getResponseErrorMessage(response, "Unable to load experiments."),
    );
  }
  return parseExperimentsResponse(await response.json());
}

export default function ExperimentsClient() {
  const { user, isLoading, setShowLoginModal } = useAuthContext();
  const allowed = canOverrideExperiments(user);
  const userId = user?.id;
  const queryClient = useQueryClient();
  const synced = useSyncExternalStore(
    subscribeExperimentOverrides,
    isOverrideSyncEnabled,
    () => false,
  );
  const [syncBusy, setSyncBusy] = useState(false);
  const indicatorPlacement = useSyncExternalStore(
    subscribeExperimentOverrides,
    getExperimentIndicatorPlacement,
    () => "floating",
  );
  // Turning sync on when this browser and the synced variants disagree.
  const [syncChoice, setSyncChoice] = useState<{
    local: ExperimentOverrides;
    synced: ExperimentOverrides;
  } | null>(null);
  const [confirmSyncOff, setConfirmSyncOff] = useState(false);
  const [clearSyncedOnOff, setClearSyncedOnOff] = useState(false);
  const [experimentKey, setExperimentKey] = useState("");
  const [keyError, setKeyError] = useState<{
    accountId: string;
    message: string;
  } | null>(null);
  const experimentsQuery = useQuery({
    queryKey: ["user-experiments", userId],
    enabled: !isLoading && allowed && !!userId,
    queryFn: async ({ signal }) => {
      if (!allowed || !userId)
        throw new Error("Tester or owner access is required.");
      const overrides = readExperimentOverrides(userId);
      const natural = fetchAssignments({}, signal);
      const [assigned, current] = await Promise.all([
        natural,
        Object.keys(overrides).length
          ? fetchAssignments(overrides, signal)
          : natural,
      ]);
      // Off needs a "control" variant, and the API ignores forced variants an
      // experiment doesn't have. Force control everywhere once to see which
      // experiments have one. If this check fails, every Off stays available.
      const keys = [
        ...new Set([
          ...Object.keys(assigned.experiments),
          ...Object.keys(overrides),
        ]),
      ];
      const probe = keys.length
        ? await fetchAssignments(
            Object.fromEntries(keys.map((key) => [key, "control" as const])),
            signal,
          ).catch(() => null)
        : null;
      return {
        assignments: assigned.experiments,
        effective: current.experiments,
        descriptions: { ...assigned.descriptions, ...current.descriptions },
        overrides,
        // Whether each checked experiment has an Off; unchecked ones allow it.
        hasControl: Object.fromEntries(
          probe
            ? keys.map((key) => [key, probe.experiments[key] === "control"])
            : [],
        ),
      };
    },
    retry: false,
    refetchOnWindowFocus: false,
  });
  // Refetch when the forced variants change from another device or tab.
  useEffect(() => {
    if (!userId) return;
    return subscribeExperimentOverrides(() => {
      const data = queryClient.getQueryData<{
        overrides: ExperimentOverrides;
      }>(["user-experiments", userId]);
      if (
        data &&
        !sameExperimentOverrides(
          data.overrides,
          readExperimentOverrides(userId),
        )
      ) {
        void queryClient.invalidateQueries({
          queryKey: ["user-experiments", userId],
        });
      }
    });
  }, [queryClient, userId]);

  /** Runs a sync change, reporting failures and refetching after. */
  async function runSync(task: () => Promise<void>) {
    if (!userId) return;
    setSyncBusy(true);
    try {
      await task();
    } catch (error) {
      toast.error("Unable to change syncing", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSyncBusy(false);
      void queryClient.invalidateQueries({
        queryKey: ["user-experiments", userId],
      });
    }
  }

  /** Turns sync on with `chosen` as the forced variants everywhere. */
  async function enableSync(
    chosen: ExperimentOverrides,
    current: ExperimentOverrides,
  ) {
    await writeSyncedOverrides(chosen, current);
    saveExperimentOverrides(userId!, chosen);
    setOverrideSyncEnabled(true);
  }

  function handleSyncChange(on: boolean) {
    if (!userId) return;
    if (!on) {
      setClearSyncedOnOff(false);
      setConfirmSyncOff(true);
      return;
    }
    void runSync(async () => {
      const local = readExperimentOverrides(userId);
      const remote = await fetchSyncedOverrides();
      const hasLocal = Object.keys(local).length > 0;
      const hasRemote = Object.keys(remote).length > 0;
      if (hasLocal && hasRemote && !sameExperimentOverrides(local, remote)) {
        setSyncChoice({ local, synced: remote });
        return;
      }
      await enableSync(hasLocal ? local : remote, remote);
    });
  }

  function disableSync() {
    void runSync(async () => {
      // This browser already holds a copy of the synced variants and keeps it.
      setOverrideSyncEnabled(false);
      // Other devices may still sync, so only clear when asked to.
      if (clearSyncedOnOff) {
        await writeSyncedOverrides({}, await fetchSyncedOverrides());
      }
    });
  }

  const {
    assignments = {},
    effective = {},
    descriptions = {},
    overrides = {},
    hasControl = {},
  } = experimentsQuery.data ?? {};
  const overrideMutation = useMutation({
    mutationFn: async ({
      accountId,
      next,
      previous,
      action,
    }: {
      accountId: string;
      next: ExperimentOverrides;
      previous: ExperimentOverrides;
      action: "key" | "toggle" | "reset" | "clear";
    }) => {
      if (!allowed || accountId !== userId)
        throw new Error("Tester or owner access is required.");
      await queryClient.cancelQueries({
        queryKey: ["user-experiments", accountId],
      });
      // With sync on, apply this change on top of what the server has now,
      // since another device may have changed it. Clearing clears everything.
      const server = isOverrideSyncEnabled()
        ? await fetchSyncedOverrides()
        : null;
      const target =
        server && action !== "clear"
          ? mergeOverrideChanges(server, previous, next)
          : next;
      const current = await fetchAssignments(target);
      validateExperimentOverrides(next, previous, current.experiments);
      // If a write fails partway, match the server instead.
      if (server) {
        try {
          await writeSyncedOverrides(target, server);
        } catch (error) {
          const synced = await fetchSyncedOverrides().catch(() => null);
          if (synced) saveExperimentOverrides(accountId, synced);
          throw error;
        }
      }
      if (!saveExperimentOverrides(accountId, target)) {
        throw new Error(
          "Unable to save overrides. Allow browser storage and try again.",
        );
      }
      return {
        accountId,
        effective: current.experiments,
        descriptions: current.descriptions,
        overrides: target,
        action,
      };
    },
    onSuccess: ({ accountId, effective, descriptions, overrides, action }) => {
      queryClient.setQueryData<NonNullable<typeof experimentsQuery.data>>(
        ["user-experiments", accountId],
        (previous) => ({
          assignments: previous?.assignments ?? {},
          effective,
          descriptions: { ...previous?.descriptions, ...descriptions },
          overrides,
          hasControl: previous?.hasControl ?? {},
        }),
      );
      if (accountId === userId && action === "key") {
        setExperimentKey("");
        setKeyError(null);
      }
    },
    onError: (error, { accountId, action }) => {
      if (accountId !== userId) return;
      if (
        action === "key" &&
        error instanceof ExperimentOverrideRejectedError
      ) {
        setKeyError({ accountId, message: error.message });
      } else {
        toast.error(
          action === "reset" || action === "clear"
            ? "Unable to reset experiment overrides"
            : "Unable to update experiment",
          {
            description: error.message,
          },
        );
      }
    },
    retry: false,
  });
  const saving = overrideMutation.isPending || syncBusy;
  const loading = experimentsQuery.isPending;
  const inputError =
    keyError && keyError.accountId === userId ? keyError.message : null;

  function updateOverrides(
    next: ExperimentOverrides,
    action: "key" | "toggle" | "reset" | "clear",
  ) {
    if (!allowed || !userId || saving) return;
    if (action === "key") setKeyError(null);
    overrideMutation.mutate({
      accountId: userId,
      next,
      previous: overrides,
      action,
    });
  }

  const keys = [
    ...new Set([...Object.keys(assignments), ...Object.keys(overrides)]),
  ].sort();
  return (
    <div className="container mx-auto mb-8 px-4">
      <div className="mx-auto max-w-4xl pb-8">
        <Breadcrumb containerClassName="py-4" />
        <h1 className="page-heading mb-2">Experiments</h1>
        <p className="text-secondary-text text-sm">
          Try features before they roll out.{" "}
          {synced
            ? "Forced variants apply on every device you sync."
            : "Forced variants apply to this browser."}
        </p>
        {isLoading ? (
          <div
            className="mt-6 space-y-6"
            role="status"
            aria-label="Loading experiments"
          >
            <span className="sr-only">Loading experiments…</span>
            <div aria-hidden="true" className="space-y-6">
              {[0, 1].map((card) => (
                <div
                  key={card}
                  className="border-border-card bg-secondary-bg flex items-center justify-between gap-4 rounded-lg border px-4 py-3"
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-40 max-w-full motion-reduce:animate-none" />
                    <Skeleton className="h-4 w-80 max-w-full motion-reduce:animate-none" />
                  </div>
                  <Skeleton
                    className={`${card === 0 ? "w-44 rounded-lg" : "w-11 rounded-full"} h-8 shrink-0 motion-reduce:animate-none`}
                  />
                </div>
              ))}
              <div className="border-border-card bg-secondary-bg overflow-hidden rounded-xl border">
                <div className="border-border-card border-b px-4 py-4">
                  <Skeleton className="h-5 w-32 motion-reduce:animate-none" />
                </div>
                <div className="divide-border-card divide-y">
                  {[0, 1].map((row) => (
                    <div key={row} className="space-y-3 px-4 py-4">
                      <Skeleton className="h-5 w-48 max-w-full motion-reduce:animate-none" />
                      <Skeleton className="h-4 w-80 max-w-full motion-reduce:animate-none" />
                      <Skeleton className="h-3 w-40 max-w-full motion-reduce:animate-none" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : !user ? (
          <div className="mt-6">
            <p className="text-secondary-text mb-4">
              Sign in with a tester or owner account to continue.
            </p>
            <Button onClick={() => setShowLoginModal(true)}>Sign in</Button>
          </div>
        ) : !allowed ? (
          <p className="text-secondary-text mt-6">
            This page is available to testers and owners.
          </p>
        ) : (
          <>
            <div className="border-border-card bg-secondary-bg mt-6 flex flex-col items-start justify-between gap-4 rounded-lg border px-4 py-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p
                  id="experiment-indicator-label"
                  className="text-primary-text text-sm font-semibold"
                >
                  Experiment badge
                </p>
                <p className="text-secondary-text text-sm">
                  Choose where it appears. Hiding it keeps your experiments
                  active.
                </p>
              </div>
              <div
                role="radiogroup"
                aria-labelledby="experiment-indicator-label"
                className="border-border-card bg-tertiary-bg flex shrink-0 rounded-lg border p-0.5"
              >
                {(["floating", "header", "hidden"] as const).map((value) => (
                  <label key={value} className={segment}>
                    <input
                      type="radio"
                      name="experiment-indicator-placement"
                      value={value}
                      checked={indicatorPlacement === value}
                      onChange={() => setExperimentIndicatorPlacement(value)}
                      className="sr-only"
                    />
                    {value === "floating"
                      ? "Floating"
                      : value === "header"
                        ? "Header"
                        : "Hidden"}
                  </label>
                ))}
              </div>
            </div>
            <div className="border-border-card bg-secondary-bg mt-6 flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
              <div className="min-w-0">
                <label
                  htmlFor="experiment-sync"
                  className="text-primary-text text-sm font-semibold"
                >
                  Sync across my devices
                </label>
                <p className="text-secondary-text text-sm">
                  Forced variants follow you to other browsers that also have
                  sync on.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {syncBusy && <Spinner className="h-4 w-4" />}
                <Switch
                  id="experiment-sync"
                  checked={synced}
                  disabled={loading || saving}
                  onCheckedChange={handleSyncChange}
                />
              </div>
            </div>
            <section
              aria-labelledby="experiments-heading"
              className="border-border-card bg-secondary-bg mt-6 overflow-hidden rounded-xl border"
            >
              <div className="border-border-card flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
                <h2
                  id="experiments-heading"
                  className="text-primary-text flex items-center gap-2 font-semibold"
                >
                  Experiments
                  {!loading && (
                    <span className="bg-tertiary-bg text-secondary-text rounded-full px-2 py-0.5 text-xs font-medium">
                      {keys.length}
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={
                      loading || saving || !Object.keys(overrides).length
                    }
                    onClick={() => updateOverrides({}, "clear")}
                  >
                    Clear forced
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Refresh experiments"
                    disabled={experimentsQuery.isFetching || saving}
                    aria-busy={experimentsQuery.isFetching}
                    onClick={() => {
                      overrideMutation.reset();
                      void experimentsQuery.refetch();
                    }}
                  >
                    <RefreshCw
                      aria-hidden="true"
                      className={
                        experimentsQuery.isFetching && !loading
                          ? "animate-spin motion-reduce:animate-none"
                          : undefined
                      }
                    />
                  </Button>
                </div>
              </div>

              {experimentsQuery.error && (
                <div
                  className="border-border-card bg-form-error/5 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3"
                  role="alert"
                >
                  <p className="text-form-error text-sm">
                    {experimentsQuery.error.message}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={experimentsQuery.isFetching || saving}
                    onClick={() => void experimentsQuery.refetch()}
                  >
                    Retry
                  </Button>
                </div>
              )}

              {loading ? (
                <div
                  className="divide-border-card divide-y"
                  role="status"
                  aria-label="Loading experiments"
                >
                  <span className="sr-only">Loading experiments…</span>
                  {[0, 1].map((row) => (
                    <div
                      key={row}
                      className="flex items-center justify-between gap-6 px-4 py-4"
                      aria-hidden="true"
                    >
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-5 w-44 max-w-full" />
                        <Skeleton className="h-4 w-80 max-w-full" />
                      </div>
                      <Skeleton className="h-8 w-44 shrink-0 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : (
                <ul
                  className="divide-border-card divide-y"
                  aria-busy={saving || experimentsQuery.isFetching}
                >
                  {!keys.length && !experimentsQuery.isError && (
                    <li className="text-secondary-text px-4 py-6 text-center text-sm">
                      You&apos;re not in any experiments right now.
                    </li>
                  )}
                  {keys.map((key) => {
                    const forced = overrides[key];
                    const notApplied = !!forced && effective[key] !== forced;
                    // Only On/Off can be forced from here.
                    const forceable =
                      !effective[key] ||
                      effective[key] === "treatment" ||
                      effective[key] === "control";
                    const noOff = hasControl[key] === false;
                    return (
                      <li
                        key={key}
                        className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <h3
                              id={`experiment-${key}`}
                              className="text-primary-text font-semibold break-words"
                            >
                              {experimentName(key)}
                            </h3>
                            <code className="bg-tertiary-bg text-secondary-text rounded px-1.5 py-0.5 font-mono text-xs break-all">
                              {key}
                            </code>
                          </div>
                          {descriptions[key]?.trim() && (
                            <p className="text-secondary-text mt-1 text-sm break-words whitespace-pre-line">
                              {descriptions[key]}
                            </p>
                          )}
                          <p
                            className={`mt-1.5 text-xs ${notApplied ? "text-status-warning" : "text-secondary-text"}`}
                          >
                            {notApplied
                              ? `Couldn't force ${variantLabel(forced)}. It may have ended or changed. Now ${variantLabel(effective[key])}.`
                              : forced
                                ? `Forced ${variantLabel(forced)} · default is ${variantLabel(assignments[key])}`
                                : `Default · ${variantLabel(assignments[key])}`}
                            {noOff && " · No Off variant to force"}
                          </p>
                        </div>
                        <div
                          role="radiogroup"
                          aria-labelledby={`experiment-${key}`}
                          className="border-border-card bg-tertiary-bg flex shrink-0 self-start rounded-lg border p-0.5 sm:self-auto"
                        >
                          {(
                            [
                              ["default", "Default"],
                              ["treatment", "On"],
                              ["control", "Off"],
                            ] as const
                          ).map(([value, label]) => (
                            <label
                              key={value}
                              className={segment}
                              title={
                                value === "control" && noOff
                                  ? "This experiment has no Off variant"
                                  : undefined
                              }
                            >
                              <input
                                type="radio"
                                name={`experiment-${key}-variant`}
                                value={value}
                                checked={(forced ?? "default") === value}
                                disabled={
                                  saving ||
                                  (!forceable && value !== "default") ||
                                  (value === "control" && noOff)
                                }
                                onChange={() => {
                                  const next = { ...overrides };
                                  if (value === "default") delete next[key];
                                  else next[key] = value;
                                  updateOverrides(
                                    next,
                                    value === "default" ? "reset" : "toggle",
                                  );
                                }}
                                className="sr-only"
                              />
                              {label}
                            </label>
                          ))}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              <form
                noValidate
                className="border-border-card bg-tertiary-bg/40 border-t px-4 py-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!userId) return;
                  if (!/^[a-z0-9_]{1,64}$/.test(experimentKey)) {
                    setKeyError({
                      accountId: userId,
                      message:
                        "Use 1–64 lowercase letters, numbers or underscores.",
                    });
                    return;
                  }
                  updateOverrides(
                    { ...overrides, [experimentKey]: "treatment" },
                    "key",
                  );
                }}
              >
                <label
                  htmlFor="experiment-key"
                  className="text-primary-text text-sm font-medium"
                >
                  Not listed? Force one on by its key
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    id="experiment-key"
                    value={experimentKey}
                    onChange={(event) => {
                      setExperimentKey(event.target.value);
                      setKeyError(null);
                    }}
                    aria-invalid={!!inputError}
                    aria-describedby={
                      inputError ? "experiment-key-error" : undefined
                    }
                    placeholder="item_fuzzy_searching"
                    required
                    pattern="[a-z0-9_]{1,64}"
                    maxLength={64}
                    spellCheck={false}
                    autoComplete="off"
                    disabled={loading || saving}
                    className="border-border-card bg-secondary-bg text-primary-text placeholder:text-secondary-text/60 focus:border-button-info aria-invalid:border-border-error h-9 min-w-0 flex-1 rounded-lg border px-3 font-mono text-sm outline-none"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="h-9!"
                    disabled={loading || saving || !experimentKey}
                  >
                    Force on
                  </Button>
                </div>
                {inputError && (
                  <p
                    id="experiment-key-error"
                    role="alert"
                    className="text-form-error mt-2 text-sm leading-relaxed"
                  >
                    {inputError}
                  </p>
                )}
                <p className="text-secondary-text mt-3 text-xs">
                  On forces the treatment and Off the control. Reload other open
                  pages to apply changes.
                </p>
              </form>
            </section>
          </>
        )}
      </div>

      <Dialog
        open={!!syncChoice}
        onOpenChange={(open) => !open && setSyncChoice(null)}
      >
        <DialogContent showClose className="bg-secondary-bg max-w-md">
          <DialogHeader>
            <DialogTitle>Which forced variants should sync?</DialogTitle>
            <DialogDescription>
              This browser has {Object.keys(syncChoice?.local ?? {}).length} and
              your synced devices have{" "}
              {Object.keys(syncChoice?.synced ?? {}).length}, and they differ.
              The one you pick replaces the other everywhere you sync.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            {(
              [
                ["local", "Use this browser's", "secondary"],
                ["synced", "Use synced", "default"],
              ] as const
            ).map(([side, label, variant]) => (
              <Button
                key={side}
                variant={variant}
                size="sm"
                onClick={() => {
                  const choice = syncChoice;
                  setSyncChoice(null);
                  if (choice)
                    void runSync(() => enableSync(choice[side], choice.synced));
                }}
              >
                {label}
              </Button>
            ))}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={confirmSyncOff}
        onClose={() => setConfirmSyncOff(false)}
        onConfirm={disableSync}
        title="Stop syncing?"
        confirmText="Stop syncing"
        confirmVariant="default"
      >
        <p className="text-secondary-text text-sm">
          This browser keeps its current forced variants. Your other devices
          keep syncing.
        </p>
        <label className="text-primary-text mt-4 flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            checked={clearSyncedOnOff}
            onCheckedChange={(checked) => setClearSyncedOnOff(checked === true)}
          />
          Also clear synced variants
        </label>
      </ConfirmDialog>
    </div>
  );
}
