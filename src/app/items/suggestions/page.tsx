"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createLogger } from "@/services/logger";
import { useQueryStates, parseAsInteger, parseAsString } from "nuqs";

const log = createLogger("API");
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/AuthContext";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { toast } from "sonner";
import Link from "next/link";
import { BanBanner } from "@/components/ui/BanBanner";
import { parseBan, showBanToast } from "@/utils/api/ban";
import { trackEvent } from "@/utils/analytics/rybbit";
import type { Item } from "@/types/index";
import NitroRailAd from "@/components/Ads/NitroRailAd";
import NitroInlineVideoPlayer from "@/components/Ads/NitroInlineVideoPlayer";
import { EditReasonModal } from "@/components/Items/Suggestions/EditReasonModal";
import { SuggestionForm } from "@/components/Items/Suggestions/SuggestionForm";
import { SuggestionResults } from "@/components/Items/Suggestions/SuggestionResults";
import { SuggestionsToolbar } from "@/components/Items/Suggestions/SuggestionsToolbar";
import { SuggestionGuidelinesDialog } from "@/components/Items/Suggestions/SuggestionGuidelinesDialog";
import { SuggesterLeaderboard } from "@/components/Items/Suggestions/SuggesterLeaderboard";
import { VotersModal } from "@/components/Items/Suggestions/VotersModal";
import { useSuggestionFilters } from "@/hooks/useSuggestionFilters";
import { useSuggestionEditing } from "@/hooks/useSuggestionEditing";
import { useSuggestionSort } from "@/hooks/useSuggestionSort";
import { useSuggestionVoting } from "@/hooks/useSuggestionVoting";
import { useSuggestionsFeed } from "@/hooks/useSuggestionsFeed";
import type {
  LeaderboardEntry,
  SuggestionLimits,
} from "@/components/Items/Suggestions/types";
import {
  AccountAgeError,
  ProfanityError,
  RateLimitError,
} from "@/components/Items/Suggestions/errors";
import { GUIDELINES_DISMISSED_KEY } from "@/components/Items/Suggestions/shared";

export default function ValueSuggestionsPage() {
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    user,
    setLoginModal,
    bans,
    setBan,
  } = useAuthContext();
  const ban = bans["value_suggestions"] ?? null;

  const [{ query: urlQuery, page, sort, submit }, setParams] = useQueryStates({
    query: parseAsString.withDefault(""),
    page: parseAsInteger.withDefault(1),
    sort: parseAsString,
    submit: parseAsString,
  });
  const [hasSearchText, setHasSearchText] = useState(!!urlQuery);
  const {
    suggestions,
    setSuggestions,
    totalPages,
    total,
    loadingSuggestions,
    isSearchLoading,
    pageChanging,
    suggestionsError,
    noSuggestionsFound,
    pendingNew,
    pendingTypes,
    fetchSuggestions,
    beginPageChange,
  } = useSuggestionsFeed({ urlQuery, sort, page });
  const {
    votingIds,
    votingTypes,
    voteRateLimits,
    handleVote,
    votersOpen,
    votersTab,
    activeVoters,
    openVotersModal,
    setVotersOpen,
    setVotersTab,
    openVotersSuggestionIdRef,
  } = useSuggestionVoting({
    setSuggestions,
    user,
    isAuthenticated,
    setLoginModal,
    setBan,
    sort,
    page,
  });
  const {
    editModalOpen,
    editTarget,
    openEditModal,
    closeEditModal,
    handleEditSave,
  } = useSuggestionEditing({ setSuggestions, setBan });

  // Items state (for form dropdown)
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const [limits, setLimits] = useState<SuggestionLimits | null>(null);
  const [loadingLimits, setLoadingLimits] = useState(false);

  const hasAutoOpenedFormRef = useRef(false);
  useEffect(() => {
    if (!submit || hasAutoOpenedFormRef.current || isAuthLoading) return;
    hasAutoOpenedFormRef.current = true;
    void setParams({ submit: null });
    if (!isAuthenticated) {
      setLoginModal({ open: true });
      return;
    }
    if (user && !user.roblox_id) {
      setLoginModal({ open: true, tab: "roblox", onlyRoblox: true });
      return;
    }
    void doOpenForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submit, isAuthLoading, isAuthenticated]);

  // Guidelines dialog state
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      !localStorage.getItem(GUIDELINES_DISMISSED_KEY)
    ) {
      setGuidelinesOpen(true);
    }
  }, []);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  const updateSort = useCallback(
    (value: string, history?: "replace") => {
      void setParams(
        { sort: value, page: null },
        history ? { history } : undefined,
      );
    },
    [setParams],
  );
  const { availableSorts, handleSortChange } = useSuggestionSort(
    sort,
    updateSort,
  );
  const canSeeVt =
    user?.flags?.some(
      (flag) =>
        (flag.flag === "is_owner" ||
          flag.flag === "is_vt" ||
          flag.flag === "is_vtm") &&
        flag.enabled !== false,
    ) ?? false;
  const {
    typeFilter,
    fieldFilter,
    filteredSuggestions,
    suggestionItemTypes,
    suggestionFields,
    setTypeFilter,
    setFieldFilter,
  } = useSuggestionFilters(suggestions, sort, canSeeVt);
  const [isSearchHighlighted, setIsSearchHighlighted] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = searchInputRef.current?.value?.trim() ?? "";
    void setParams({ query: value || null, page: null });
  };

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    beginPageChange();
    void setParams({ page: value > 1 ? value : null });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    void setParams({ page: null });
  };

  const handleFieldFilterChange = (value: string) => {
    setFieldFilter(value);
    void setParams({ page: null });
  };

  const handleClearAllFilters = () => {
    setTypeFilter("All");
    setFieldFilter("All");
    if (searchInputRef.current) searchInputRef.current.value = "";
    setHasSearchText(false);
    void setParams({ query: null, page: null });
  };

  // Keep input in sync when URL changes externally (back/forward navigation)
  useEffect(() => {
    if (searchInputRef.current) searchInputRef.current.value = urlQuery;
    setHasSearchText(!!urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "f") {
        event.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
          setIsSearchHighlighted(true);
          setTimeout(() => setIsSearchHighlighted(false), 2000);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    const fetchItems = async () => {
      try {
        const { url, headers } = buildApiFetchRequest(
          PUBLIC_API_URL!,
          "/items/list",
        );
        const res = await fetch(url, { headers });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          log.error("fetch items failed", { status: res.status, body });
          throw new Error("Failed to fetch items");
        }
        const data: Item[] = await res.json();
        if (ignore) return;
        setItems(data);
      } catch {
        // silently fail — form can still show without items
      } finally {
        if (!ignore) {
          setLoadingItems(false);
        }
      }
    };
    fetchItems();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    const { url, headers } = buildApiFetchRequest(
      PUBLIC_API_URL!,
      "/value-suggestions/stats/leaderboard",
    );
    fetch(url, { credentials: "include", headers })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (ignore) return;
        const entries = Array.isArray(data)
          ? data
          : Array.isArray(data?.leaderboard)
            ? data.leaderboard
            : [];
        setLeaderboard(entries as LeaderboardEntry[]);
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) {
          setLoadingLeaderboard(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleFormSubmit = async (payload: {
    item: number;
    field: string;
    value: string;
    reason: string;
    isVt: boolean;
  }) => {
    const { url, headers } = buildApiFetchRequest(
      PUBLIC_API_URL!,
      "/value-suggestions",
    );
    const body: Record<string, unknown> = {
      item: payload.item,
      suggestion: {
        field: payload.field,
        value: payload.value,
        reason: payload.reason,
      },
    };
    if (payload.isVt) body.is_vt = true;
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const banInfo = parseBan(res);
    if (banInfo) {
      setBan(banInfo);
      setShowForm(false);
      showBanToast(banInfo);
      throw new Error("banned");
    }
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 429) {
        toast.error(
          "You're submitting too fast. Please wait a moment and try again.",
        );
        const retryAfter = parseInt(res.headers.get("retry-after") ?? "60", 10);
        throw new RateLimitError(retryAfter);
      }
      if (res.status === 403) {
        if (data?.detail === "Forbidden") {
          toast.info(
            "You need to connect your Roblox account to submit item suggestions.",
          );
          setLoginModal({ open: true, tab: "roblox", onlyRoblox: true });
          throw { response: { status: res.status, data } };
        }
        throw new AccountAgeError(
          data?.message ??
            data?.error ??
            "You are not allowed to make suggestions.",
        );
      }
      if (data?.error === "profanity_detected") {
        throw new ProfanityError(data.flagged || [], data.message);
      }
      toast.error(
        data?.message ?? data?.error ?? "Failed to submit suggestion.",
      );
      throw { response: { status: res.status, data } };
    }

    toast.success("Suggestion submitted successfully!");
    setShowForm(false);
    void setParams({ page: null });
    fetchSuggestions(1);
  };

  const doOpenForm = async () => {
    setShowForm(true);
    if (limits) return;
    setLoadingLimits(true);
    try {
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL!,
        "/value-suggestions/limits",
      );
      const res = await fetch(url, { credentials: "include", headers });
      if (res.ok) {
        const data: SuggestionLimits = await res.json();
        setLimits(data);
      }
    } catch {
      // fall back to defaults if fetch fails
    } finally {
      setLoadingLimits(false);
    }
  };

  const openForm = () => {
    if (showForm) {
      setShowForm(false);
      return;
    }
    if (user && !user.roblox_id) {
      toast.info(
        "You need to connect your Roblox account to submit item suggestions.",
      );
      setLoginModal({ open: true, tab: "roblox", onlyRoblox: true });
      return;
    }
    doOpenForm();
  };

  useEffect(() => {
    if (!showForm) return;
    const id = setTimeout(() => {
      if (!formRef.current) return;
      const headerHeight =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--header-height",
          ),
        ) || 64;
      const top =
        formRef.current.getBoundingClientRect().top +
        window.scrollY -
        headerHeight -
        16;
      window.scrollTo({ top, behavior: "smooth" });
    }, 50);
    return () => clearTimeout(id);
  }, [showForm]);

  const handleGuidelinesConfirm = () => {
    const isFirstTime = !localStorage.getItem(GUIDELINES_DISMISSED_KEY);
    localStorage.setItem(GUIDELINES_DISMISSED_KEY, "1");
    setGuidelinesOpen(false);
    toast.success("You have agreed to our suggestion guidelines.");
    if (isFirstTime) trackEvent("Suggestion Guidelines Accepted");
  };

  return (
    <>
      <NitroRailAd
        adIdSmall="np-values-suggestions-rail"
        adIdWide="np-values-suggestions-rail-wide"
      />
      <NitroRailAd
        adIdSmall="np-values-suggestions-rail-right"
        adIdWide="np-values-suggestions-rail-right-wide"
        side="right"
      />
      <main className="min-h-screen">
        <div className="container mx-auto mb-8 px-4 sm:px-6">
          <Breadcrumb />

          {/* Header */}
          <div className="border-border-card bg-secondary-bg mb-6 rounded-lg border p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
              <div className="flex-1">
                <h1 className="text-primary-text mb-1 text-2xl font-semibold">
                  Item Suggestions
                </h1>
                <p className="text-secondary-text text-sm">
                  Help keep item values accurate. Submit a suggestion with your
                  reasoning — the community votes, and our team reviews before
                  applying changes.
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Button asChild variant="default" size="sm">
                    <Link href="/values">Value List</Link>
                  </Button>
                  <Button asChild variant="default" size="sm">
                    <Link href="/items/changelogs">Item Changelogs</Link>
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setGuidelinesOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Icon
                      icon="material-symbols:info-outline-rounded"
                      className="h-4 w-4"
                      inline
                    />
                    Guidelines
                  </Button>
                  {isAuthenticated ? (
                    <Button
                      onClick={openForm}
                      variant={showForm ? "destructive" : "success"}
                      disabled={!!ban}
                      size="sm"
                      className="flex items-center gap-2 disabled:opacity-50"
                    >
                      <Icon
                        icon={
                          showForm
                            ? "material-symbols:close-rounded"
                            : "material-symbols:add-rounded"
                        }
                        className="h-4 w-4"
                        inline
                      />
                      {showForm ? "Cancel" : "Submit Suggestion"}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        toast.info(
                          "You need to be logged in to submit item suggestions.",
                        );
                        setLoginModal({ open: true });
                      }}
                      variant="success"
                      size="sm"
                    >
                      <Icon
                        icon="material-symbols:login-rounded"
                        className="h-4 w-4"
                        inline
                      />
                      Login to Suggest
                    </Button>
                  )}
                </div>
              </div>
              <NitroInlineVideoPlayer
                slotId="np-values-suggestions-video"
                className="w-full self-center lg:self-start"
              />
            </div>
          </div>

          <SuggesterLeaderboard
            leaderboard={leaderboard}
            loadingLeaderboard={loadingLeaderboard}
          />
          {/* Upvote Disclaimer */}
          <div className="border-border-error bg-button-danger/10 mb-6 rounded-lg border px-5 py-4">
            <p className="text-form-error text-lg font-bold">
              Please note that a high upvote count does not guarantee a
              suggestion will be accepted.
            </p>
          </div>

          {/* Ban Banner */}
          {ban && <BanBanner ban={ban} className="mb-4" />}

          {/* Submit Form */}
          <div ref={formRef}>
            {showForm && isAuthenticated && !ban && (
              <SuggestionForm
                items={items}
                loadingItems={loadingItems}
                limits={limits}
                loadingLimits={loadingLimits}
                isVtEligible={
                  user?.flags?.some(
                    (f) =>
                      (f.flag === "is_owner" ||
                        f.flag === "is_vt" ||
                        f.flag === "is_vtm") &&
                      f.enabled !== false,
                  ) ?? false
                }
                user={user}
                onSubmit={handleFormSubmit}
                onCancel={() => setShowForm(false)}
                onOpenGuidelines={() => setGuidelinesOpen(true)}
              />
            )}
          </div>

          <SuggestionsToolbar
            loadingSuggestions={loadingSuggestions}
            total={total}
            urlQuery={urlQuery}
            availableSorts={availableSorts}
            sort={sort}
            canSeeVt={canSeeVt}
            suggestionsError={suggestionsError}
            noSuggestionsFound={noSuggestionsFound}
            suggestionsCount={suggestions.length}
            searchInputRef={searchInputRef}
            isSearchLoading={isSearchLoading}
            hasSearchText={hasSearchText}
            isSearchHighlighted={isSearchHighlighted}
            onSearchSubmit={handleSearchSubmit}
            onSearchTextChange={(value) => {
              setHasSearchText(Boolean(value));
              if (!value && urlQuery) {
                void setParams({ query: null, page: null });
              }
            }}
            onClearSearch={() => {
              if (searchInputRef.current) searchInputRef.current.value = "";
              setHasSearchText(false);
              void setParams({ query: null, page: null });
            }}
            typeFilter={typeFilter}
            onTypeFilterChange={handleTypeFilterChange}
            suggestionItemTypes={suggestionItemTypes}
            fieldFilter={fieldFilter}
            onFieldFilterChange={handleFieldFilterChange}
            suggestionFields={suggestionFields}
            pendingNew={pendingNew}
            pendingTypes={pendingTypes}
            onSortChange={handleSortChange}
            onRefresh={() => {
              void setParams({ page: null });
              void fetchSuggestions(1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />

          <SuggestionResults
            loadingSuggestions={loadingSuggestions}
            noSuggestionsFound={noSuggestionsFound}
            suggestionsError={suggestionsError}
            suggestions={suggestions}
            filteredSuggestions={filteredSuggestions}
            isAuthenticated={isAuthenticated}
            userId={user?.id}
            userHasRoblox={Boolean(user?.roblox_id)}
            isBanned={Boolean(ban)}
            urlQuery={urlQuery}
            totalPages={totalPages}
            page={page}
            pageChanging={pageChanging}
            votingIds={votingIds}
            votingTypes={votingTypes}
            voteRateLimits={voteRateLimits}
            onLogin={() => setLoginModal({ open: true })}
            onConnectRoblox={() =>
              setLoginModal({
                open: true,
                tab: "roblox",
                onlyRoblox: true,
              })
            }
            onOpenForm={openForm}
            onRetry={() => fetchSuggestions(page)}
            onClearAllFilters={handleClearAllFilters}
            onPageChange={handlePageChange}
            onVote={handleVote}
            onOpenVoters={openVotersModal}
            onOpenEdit={openEditModal}
          />
        </div>

        {/* Guidelines Dialog */}
        <SuggestionGuidelinesDialog
          open={guidelinesOpen}
          onConfirm={handleGuidelinesConfirm}
        />

        {/* Edit Reason Modal */}
        <EditReasonModal
          open={editModalOpen}
          onClose={closeEditModal}
          suggestion={editTarget}
          item={editTarget ? (editTarget.item ?? null) : null}
          onSave={handleEditSave}
          limits={limits}
        />

        <VotersModal
          open={votersOpen}
          onOpenChange={(open) => {
            setVotersOpen(open);
            if (!open) openVotersSuggestionIdRef.current = null;
          }}
          tab={votersTab}
          onTabChange={setVotersTab}
          voters={activeVoters}
        />
      </main>
    </>
  );
}
