"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { useAuthContext } from "@/contexts/AuthContext";
import { PUBLIC_API_URL, getResponseErrorMessage } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import {
  canOverrideExperiments,
  ExperimentOverrideRejectedError,
  parseExperimentsResponse,
  readExperimentOverrides,
  saveExperimentOverrides,
  serializeExperimentOverrides,
  validateExperimentOverrides,
  type ExperimentOverrides,
} from "@/utils/api/experiments";

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
      return {
        assignments: assigned.experiments,
        effective: current.experiments,
        descriptions: { ...assigned.descriptions, ...current.descriptions },
        overrides,
      };
    },
    retry: false,
    refetchOnWindowFocus: false,
  });
  const {
    assignments = {},
    effective = {},
    descriptions = {},
    overrides = {},
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
      action: "key" | "toggle" | "reset";
    }) => {
      if (!allowed || accountId !== userId)
        throw new Error("Tester or owner access is required.");
      await queryClient.cancelQueries({
        queryKey: ["user-experiments", accountId],
      });
      const current = await fetchAssignments(next);
      validateExperimentOverrides(next, previous, current.experiments);
      if (!saveExperimentOverrides(accountId, next)) {
        throw new Error(
          "Unable to save overrides. Allow browser storage and try again.",
        );
      }
      return {
        accountId,
        effective: current.experiments,
        descriptions: current.descriptions,
        overrides: next,
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
          action === "reset"
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
  const saving = overrideMutation.isPending;
  const loading = experimentsQuery.isPending;
  const inputError =
    keyError && keyError.accountId === userId ? keyError.message : null;

  function updateOverrides(
    next: ExperimentOverrides,
    action: "key" | "toggle" | "reset",
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
          Try features before they roll out. Changes apply to this browser.
        </p>
        {isLoading ? (
          <p className="text-secondary-text mt-6" role="status">
            Checking tester access…
          </p>
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
            <div className="border-border-card mt-8 flex flex-wrap items-center justify-between gap-3 border-b pb-3">
              <h2 className="text-primary-text text-xs font-semibold tracking-wider uppercase">
                Available experiments
                {!loading && (
                  <span className="text-secondary-text ml-2">
                    ({keys.length})
                  </span>
                )}
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={experimentsQuery.isFetching || saving}
                  aria-busy={experimentsQuery.isFetching}
                  aria-live="polite"
                  onClick={() => {
                    overrideMutation.reset();
                    void experimentsQuery.refetch();
                  }}
                >
                  {experimentsQuery.isFetching && !loading ? (
                    <>
                      <Spinner className="h-4 w-4" />
                      Refreshing…
                    </>
                  ) : (
                    "Refresh"
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={loading || saving || !Object.keys(overrides).length}
                  onClick={() => updateOverrides({}, "reset")}
                >
                  Reset all overrides
                </Button>
              </div>
            </div>
            {experimentsQuery.error && (
              <div
                className="border-border-error/30 bg-form-error/5 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3"
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
                    className="flex items-center justify-between gap-6 py-5"
                    aria-hidden="true"
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-5 w-44 max-w-full" />
                      <Skeleton className="h-4 w-96 max-w-full" />
                      <Skeleton className="h-7 w-56 max-w-full" />
                    </div>
                    <Skeleton className="h-6 w-11 shrink-0 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="divide-border-card divide-y"
                aria-busy={saving || experimentsQuery.isFetching}
              >
                {!keys.length && !experimentsQuery.isError && (
                  <p className="text-secondary-text py-4">
                    You have no active experiment assignments.
                  </p>
                )}
                {keys.map((key) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-6 py-5"
                  >
                    <div className="min-w-0">
                      <h2
                        id={`experiment-${key}`}
                        title={key}
                        className="text-primary-text text-base font-semibold break-words"
                      >
                        {key
                          .split("_")
                          .filter(Boolean)
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1),
                          )
                          .join(" ")}
                      </h2>
                      {descriptions[key]?.trim() && (
                        <p
                          id={`experiment-description-${key}`}
                          className="text-secondary-text mt-1 text-sm break-words whitespace-pre-line"
                        >
                          {descriptions[key]}
                        </p>
                      )}
                      <p className="text-primary-text bg-tertiary-bg mt-2 inline-flex rounded-md px-2.5 py-1 text-sm font-medium">
                        {overrides[key] && effective[key] !== overrides[key]
                          ? `Override not applied · ${effective[key]?.replace(/^./, (letter) => letter.toUpperCase()) ?? "Not assigned"}`
                          : !effective[key]
                            ? "Not assigned to this experiment"
                            : `${effective[key] === "treatment" ? "Enabled" : effective[key] === "control" ? "Disabled" : "Assigned"} ${overrides[key] ? "by override" : "automatically"} · ${effective[key].replace(/^./, (letter) => letter.toUpperCase())}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col-reverse items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
                      {overrides[key] && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={saving}
                          onClick={() => {
                            const next = { ...overrides };
                            delete next[key];
                            updateOverrides(next, "reset");
                          }}
                        >
                          Reset
                        </Button>
                      )}
                      <Switch
                        aria-labelledby={`experiment-${key}`}
                        aria-describedby={
                          descriptions[key]?.trim()
                            ? `experiment-description-${key}`
                            : undefined
                        }
                        checked={effective[key] === "treatment"}
                        disabled={
                          saving ||
                          (!!effective[key] &&
                            effective[key] !== "treatment" &&
                            effective[key] !== "control")
                        }
                        onCheckedChange={(enabled) =>
                          void updateOverrides(
                            {
                              ...overrides,
                              [key]: enabled ? "treatment" : "control",
                            },
                            "toggle",
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-secondary-text mt-3 text-sm leading-relaxed">
              Treatment enables a feature; Control disables it. Reset restores
              your automatic assignment.
              <br />
              Reload other open pages to apply changes.
            </p>
            <section className="border-border-card mt-8 border-t pt-5">
              <form
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!userId) return;
                  if (!/^[a-z0-9_]{1,64}$/.test(experimentKey)) {
                    setKeyError({
                      accountId: userId,
                      message:
                        "Enter an exact experiment key using 1–64 lowercase letters, numbers, or underscores.",
                    });
                    return;
                  }
                  updateOverrides(
                    {
                      ...overrides,
                      [experimentKey]: "treatment",
                    },
                    "key",
                  );
                }}
              >
                <label
                  htmlFor="experiment-key"
                  className="text-primary-text text-sm font-semibold"
                >
                  Enable an experiment by key
                </label>
                <p
                  id="experiment-key-help"
                  className="text-secondary-text mt-1 text-sm"
                >
                  Enter a running experiment’s exact key.
                </p>
                <div className="mt-3 flex max-w-xl flex-wrap gap-2">
                  <input
                    id="experiment-key"
                    value={experimentKey}
                    onChange={(event) => {
                      setExperimentKey(event.target.value);
                      setKeyError(null);
                    }}
                    aria-invalid={!!inputError}
                    aria-describedby={
                      inputError
                        ? "experiment-key-help experiment-key-error"
                        : "experiment-key-help"
                    }
                    placeholder="e.g. item_fuzzy_searching"
                    required
                    pattern="[a-z0-9_]{1,64}"
                    maxLength={64}
                    disabled={loading || saving}
                    className="border-border-card bg-tertiary-bg text-primary-text aria-invalid:border-border-error min-w-0 flex-1 rounded-lg border px-3 py-2"
                  />
                  <Button
                    type="submit"
                    disabled={loading || saving || !experimentKey}
                  >
                    Enable
                  </Button>
                </div>
                {inputError && (
                  <p
                    id="experiment-key-error"
                    role="alert"
                    className="text-form-error mt-2 max-w-xl text-sm leading-relaxed"
                  >
                    {inputError}
                  </p>
                )}
              </form>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
