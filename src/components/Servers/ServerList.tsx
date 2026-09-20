"use client";

import React from "react";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { createLogger } from "@/services/logger";

const log = createLogger("API");

import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { formatProfileDate } from "@/utils/helpers/timestamp";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import AddServerModal from "./AddServerModal";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import Link from "next/link";
import { Pagination } from "@/components/ui/Pagination";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserAvatar } from "@/utils/ui/avatar";
import DOMPurify from "dompurify";
import type { PrivateServer, PrivateServerListResponse } from "@/types/server";
import { Button } from "@/components/ui/button";
import { sanitizeText } from "@/utils/ui/sanitizeText";
import { PUBLIC_API_URL, getResponseErrorMessage } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { hasLineClampOverflow } from "@/utils/ui/collapsibleContent";

const BADGE_BASE_URL =
  "https://assets.jailbreakchangelogs.com/assets/website_icons";
const supporterIcons = {
  1: `${BADGE_BASE_URL}/jbcl_supporter_1.svg`,
  2: `${BADGE_BASE_URL}/jbcl_supporter_2.svg`,
  3: `${BADGE_BASE_URL}/jbcl_supporter_3.svg`,
};

const processMentions = (text: string): string => {
  return text.replace(/@(\w+)/g, (_, username) => {
    return `<span>@${username}</span>`;
  });
};

const URL_PATTERN =
  /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.(?:gg|com|net|org|me|io|gl|ly|co|xyz|app|dev|chat|tv)(?:\/\S*)?\b/gi;

const redactLinks = (text: string): string => {
  return text.replace(URL_PATTERN, "[REDACTED]");
};

const sanitizeHTML = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["span", "br"],
    ALLOWED_ATTR: [],
  });
};

const fetchServersPage = async (
  page: number,
  query: string,
  signal?: AbortSignal,
): Promise<PrivateServerListResponse> => {
  // TODO: Restore server sorting controls when the API accepts a sort parameter.
  const path = query
    ? `/servers/search?query=${encodeURIComponent(query)}&page=${page}`
    : `/servers?page=${page}`;
  const { url, headers } = buildApiFetchRequest(PUBLIC_API_URL, path);
  const response = await fetch(url, { cache: "no-store", headers, signal });
  if (!response.ok) {
    throw new Error(
      await getResponseErrorMessage(response, "Failed to fetch servers"),
    );
  }
  return (await response.json()) as PrivateServerListResponse;
};

const ServerList: React.FC = () => {
  const { isAuthenticated, user } = useAuthContext();
  const [{ query: queryFromUrl, page }, setParams] = useQueryStates({
    query: parseAsString.withDefault(""),
    page: parseAsInteger.withDefault(1),
  });
  const [servers, setServers] = React.useState<PrivateServer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isFetching, setIsFetching] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState(queryFromUrl);
  const [totalServers, setTotalServers] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(0);
  const [serverNumberMap, setServerNumberMap] = React.useState<
    Record<number, number>
  >({});
  const [refreshVersion, setRefreshVersion] = React.useState(0);
  const loggedInUserId = user?.id ?? null;
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingServer, setEditingServer] =
    React.useState<PrivateServer | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [serverToDelete, setServerToDelete] =
    React.useState<PrivateServer | null>(null);
  const [deletingServer, setDeletingServer] = React.useState(false);
  const [expandedRules, setExpandedRules] = React.useState<Set<number>>(
    new Set(),
  );
  const [truncatedRules, setTruncatedRules] = React.useState<Set<number>>(
    new Set(),
  );
  const ruleParagraphRefs = React.useRef<Map<number, HTMLParagraphElement>>(
    new Map(),
  );

  const measureRulesTruncation = React.useCallback((serverId: number) => {
    const node = ruleParagraphRefs.current.get(serverId);
    if (!node) return;
    const isOverflowing = hasLineClampOverflow(node, 2);
    setTruncatedRules((prev) => {
      const alreadyMarked = prev.has(serverId);
      if (isOverflowing === alreadyMarked) return prev;
      const next = new Set(prev);
      if (isOverflowing) {
        next.add(serverId);
      } else {
        next.delete(serverId);
      }
      return next;
    });
  }, []);

  React.useEffect(() => {
    const handleResize = () => {
      ruleParagraphRefs.current.forEach((_node, serverId) =>
        measureRulesTruncation(serverId),
      );
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [measureRulesTruncation]);
  // Handle page change
  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    if (value === page) return;
    setLoading(true);
    setIsFetching(true);
    void setParams({ page: value > 1 ? value : null });
  };

  React.useEffect(() => {
    setSearchQuery(queryFromUrl);
  }, [queryFromUrl]);

  React.useEffect(() => {
    const controller = new AbortController();

    const fetchServers = async () => {
      setLoading(true);
      setIsFetching(true);
      setError(null);

      try {
        if (!PUBLIC_API_URL) {
          throw new Error("Missing PUBLIC_API_URL");
        }
        const data = await fetchServersPage(
          page,
          queryFromUrl.trim(),
          controller.signal,
        );
        if (controller.signal.aborted) return;

        if (data.total_pages > 0 && page > data.total_pages) {
          void setParams({ page: data.total_pages });
          return;
        }

        const numbers: Record<number, number> = {};
        data.items.forEach((server, index) => {
          numbers[server.id] = data.total - (page - 1) * data.size - index;
        });
        setServerNumberMap(numbers);
        setServers(data.items);
        setTotalServers(data.total);
        setTotalPages(data.total_pages);
      } catch (serverErr) {
        if (controller.signal.aborted) return;
        log.error("Failed to fetch servers", serverErr);
        setError(
          serverErr instanceof Error
            ? serverErr.message
            : "An error occurred while fetching servers",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setIsFetching(false);
        }
      }
    };

    void fetchServers();

    return () => {
      controller.abort();
    };
  }, [page, queryFromUrl, refreshVersion, setParams]);

  const handleServerAdded = () => {
    setLoading(true);
    setIsFetching(true);
    void setParams({ query: null, page: null });
    setRefreshVersion((version) => version + 1);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    if (query === queryFromUrl.trim() && page === 1) return;
    setLoading(true);
    setIsFetching(true);
    void setParams({ query, page: null });
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    if (!queryFromUrl) return;
    setServers([]);
    setLoading(true);
    setIsFetching(true);
    void setParams({ query: null, page: null });
  };

  const handleDeleteServer = (server: PrivateServer) => {
    setServerToDelete(server);
    setDeleteModalOpen(true);
  };

  const handleDeleteServerFromMenu = (server: PrivateServer) => {
    // Let Radix close the menu before opening modal to avoid layout/focus race.
    setTimeout(() => {
      handleDeleteServer(server);
    }, 0);
  };

  const confirmDeleteServer = async () => {
    if (!serverToDelete) return;
    if (deletingServer) return;
    if (!isAuthenticated || !PUBLIC_API_URL) {
      toast.info("You must be logged in to delete a server.");
      setDeleteModalOpen(false);
      setServerToDelete(null);
      return;
    }
    setDeletingServer(true);
    const deletingToastId = toast.loading("Deleting server...");
    try {
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/servers/${serverToDelete.id}`,
      );
      const response = await fetch(url, {
        method: "DELETE",
        credentials: "include",
        headers,
      });
      if (response.ok) {
        toast.success("Server deleted successfully!", { id: deletingToastId });
        handleServerAdded();
      } else {
        const message = await getResponseErrorMessage(
          response,
          "Failed to delete server",
        );
        toast.error(message, { id: deletingToastId });
      }
    } catch (deleteError) {
      log.error("Failed to delete server", deleteError);
      toast.error("An error occurred while deleting the server.", {
        id: deletingToastId,
      });
    } finally {
      setDeletingServer(false);
      setDeleteModalOpen(false);
      setServerToDelete(null);
    }
  };

  const handleEditServer = (server: PrivateServer) => {
    setEditingServer(server);
    setIsAddModalOpen(true);
  };

  const handleEditServerFromMenu = (server: PrivateServer) => {
    // Let Radix close the menu before opening modal to avoid layout/focus race.
    setTimeout(() => {
      handleEditServer(server);
    }, 0);
  };

  const handleAddServer = () => {
    setEditingServer(null);
    setIsAddModalOpen(true);
  };

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Server link copied to clipboard!");
    } catch {
      toast.error("Failed to copy server link");
    }
  };

  const searchControls = (
    <form onSubmit={handleSearchSubmit} className="mb-6">
      <div className="relative flex items-center">
        <input
          type="search"
          name="query"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search server rules..."
          className="border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text focus:border-button-info w-full rounded-lg border px-4 py-3 pr-16 transition-all duration-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
          aria-label="Search server rules"
          disabled={isFetching}
        />
        <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-2">
          {searchQuery && (
            <>
              <button
                type="button"
                onClick={handleClearSearch}
                className="text-secondary-text hover:text-primary-text cursor-pointer transition-colors"
                aria-label="Clear search"
              >
                <Icon icon="heroicons:x-mark" className="h-5 w-5" />
              </button>
              <div className="border-primary-text h-6 border-l opacity-30" />
            </>
          )}
          <button
            type="submit"
            disabled={isFetching || !searchQuery.trim()}
            className="text-link hover:bg-link/10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Search"
          >
            {isFetching ? (
              <Spinner className="h-5 w-5" />
            ) : (
              <Icon icon="heroicons:magnifying-glass" className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </form>
  );

  const listHeader = (
    <div className="mb-4 flex items-center justify-between gap-3 px-4 lg:px-0">
      <p className="text-secondary-text flex items-center gap-2 text-sm">
        {queryFromUrl ? "Matching servers" : "Total servers"}:
        {loading ? (
          <Spinner className="h-4 w-4" />
        ) : (
          totalServers.toLocaleString()
        )}
      </p>
      <Button
        onClick={handleAddServer}
        size="sm"
        className="shrink-0 whitespace-nowrap"
      >
        <Icon icon="heroicons:plus" className="h-4 w-4" />
        <span className="hidden sm:inline">Add server</span>
        <span className="sm:hidden">Add</span>
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div>
        {searchControls}
        {listHeader}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="border-border-card bg-secondary-bg rounded-xl border p-4 shadow-sm sm:p-5"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Skeleton style={{ width: 110, height: 24 }} />
                  <Skeleton style={{ width: 90, height: 16 }} />
                </div>
                <Skeleton style={{ width: 90, height: 28 }} />
              </div>

              <div className="border-border-card bg-tertiary-bg mb-4 rounded-lg border p-3">
                <Skeleton style={{ width: 90, height: 16 }} />
                <div className="mt-2 flex items-center gap-2">
                  <Skeleton
                    className="rounded-full"
                    style={{ width: 32, height: 32 }}
                  />
                  <Skeleton style={{ width: 130, height: 22 }} />
                </div>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                <Skeleton style={{ width: 130, height: 28 }} />
                <Skeleton style={{ width: 120, height: 28 }} />
              </div>

              <div className="border-border-card bg-tertiary-bg rounded-lg border p-3 sm:p-4">
                <Skeleton style={{ width: 70, height: 20 }} />
                <div className="mt-2 space-y-2">
                  <Skeleton className="w-full" style={{ height: 16 }} />
                  <Skeleton style={{ width: "85%", height: 16 }} />
                </div>
              </div>

              <div className="border-border-card mt-4 flex items-center justify-between border-t pt-4">
                <Skeleton style={{ width: 90, height: 32 }} />
                <Skeleton style={{ width: 100, height: 32 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        {searchControls}
        {listHeader}
        <div className="bg-button-danger/10 border-button-danger text-button-danger rounded-lg border p-4">
          {error}
        </div>
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div>
        {searchControls}
        {listHeader}
        <div className="border-border-card bg-secondary-bg hover:border-border-focus rounded-lg border p-8 text-center">
          <Icon
            icon="heroicons-outline:shield-check"
            className="text-button-info mx-auto mb-4 h-12 w-12"
          />
          <h3 className="text-primary-text mb-2 text-xl font-semibold">
            {queryFromUrl ? "No matching servers" : "No servers available"}
          </h3>
          <p className="text-secondary-text">
            {queryFromUrl
              ? `No server rules match “${queryFromUrl}”.`
              : "You can add a server or check back later"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {searchControls}
      {listHeader}

      {totalPages > 1 && (
        <div className="mb-6 flex justify-center">
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            disabled={isFetching}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 gap-y-6 pb-4 md:grid-cols-2 xl:grid-cols-3">
        {servers.map((server) => {
          // Check if user is a Supporter (premium types 1-3)
          const premiumType = server.user.premiumtype ?? 0;
          const isSupporter = premiumType >= 1 && premiumType <= 3;
          const supporterTier = isSupporter ? premiumType : null;
          const isServerOwner = loggedInUserId === server.user.id;
          const expiresText =
            server.expires === "Never"
              ? "Never"
              : formatProfileDate(server.expires);
          const hasRules = Boolean(server.rules && server.rules !== "N/A");
          const parsedRules = hasRules
            ? sanitizeHTML(
                processMentions(redactLinks(sanitizeText(server.rules))),
              )
            : "No rules set by owner";
          const isRulesExpanded = expandedRules.has(server.id);
          const shouldShowRulesExpand =
            hasRules && truncatedRules.has(server.id);

          return (
            <div
              key={server.id}
              className="border-border-card bg-secondary-bg flex h-full flex-col rounded-xl border p-4 shadow-sm transition-all hover:shadow-md sm:p-5"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-primary-text block text-base font-semibold">
                    Server #{serverNumberMap[server.id]}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {isServerOwner && (
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="px-2"
                          aria-label="Server actions"
                        >
                          <Icon icon="heroicons:ellipsis-horizontal" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        onCloseAutoFocus={(event) => event.preventDefault()}
                        className="border-border-card bg-secondary-bg text-primary-text min-w-45 rounded-xl border p-0"
                      >
                        <DropdownMenuItem
                          className="w-full cursor-pointer rounded-none px-4 py-2"
                          onSelect={() => handleEditServerFromMenu(server)}
                        >
                          <Icon
                            icon="heroicons:pencil"
                            className="mr-2 h-4 w-4"
                          />
                          Edit server
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="hover:bg-button-danger/10 text-button-danger hover:text-button-danger focus:bg-button-danger/10 focus:text-button-danger w-full cursor-pointer rounded-none px-4 py-2"
                          onSelect={() => handleDeleteServerFromMenu(server)}
                        >
                          <Icon
                            icon="heroicons:trash-solid"
                            className="mr-2 h-4 w-4"
                          />
                          Delete server
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              <div className="border-border-card bg-tertiary-bg mb-4 rounded-lg border p-3">
                <p className="text-secondary-text mb-2 text-xs tracking-wide uppercase">
                  Server owner
                </p>
                <div className="flex items-center justify-between gap-3">
                  {server.user.id ? (
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <UserAvatar
                        userId={server.user.id}
                        avatarHash={server.user.avatar}
                        username={server.user.username}
                        size={9}
                        custom_avatar={server.user.custom_avatar ?? undefined}
                        showBadge={false}
                        settings={server.user.settings}
                        premiumType={server.user.premiumtype}
                      />
                      <Link
                        href={`/users/${server.user.id}`}
                        prefetch={false}
                        className="text-primary-text hover:text-link active:text-link-active min-w-0 truncate font-medium transition-colors"
                      >
                        {server.user.username}
                      </Link>
                      {isSupporter && supporterTier && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center">
                              <Image
                                src={
                                  supporterIcons[
                                    supporterTier as keyof typeof supporterIcons
                                  ]
                                }
                                alt={`Supporter Type ${supporterTier}`}
                                width={16}
                                height={16}
                                className="object-contain"
                              />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-secondary-bg text-primary-text border-none shadow-(--color-card-shadow)"
                          >
                            <p>Supporter Type {supporterTier}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  ) : (
                    <Skeleton style={{ width: 100 }} />
                  )}
                </div>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                <div className="text-primary-text bg-tertiary-bg/40 border-border-card hover:bg-quaternary-bg/60 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm transition-all">
                  <Icon icon="heroicons:clock" className="h-3.5 w-3.5" />
                  Added {formatProfileDate(server.created_at)}
                </div>
                <div className="text-primary-text bg-tertiary-bg/40 border-border-card hover:bg-quaternary-bg/60 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm transition-all">
                  <Icon
                    icon="heroicons:calendar-days"
                    className="h-3.5 w-3.5"
                  />
                  Expires {expiresText}
                </div>
              </div>

              <div className="border-border-card bg-tertiary-bg rounded-lg border p-3 sm:p-4">
                <h4 className="text-primary-text mb-2 text-sm font-medium">
                  Server rules
                </h4>
                <p
                  ref={(node) => {
                    if (node) {
                      ruleParagraphRefs.current.set(server.id, node);
                    } else {
                      ruleParagraphRefs.current.delete(server.id);
                    }
                    measureRulesTruncation(server.id);
                  }}
                  className="text-secondary-text text-sm wrap-break-word"
                  style={
                    isRulesExpanded
                      ? undefined
                      : {
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }
                  }
                  dangerouslySetInnerHTML={{ __html: parsedRules }}
                />
                {shouldShowRulesExpand && (
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedRules((prev) => {
                        const next = new Set(prev);
                        if (next.has(server.id)) {
                          next.delete(server.id);
                        } else {
                          next.add(server.id);
                        }
                        return next;
                      })
                    }
                    className="text-link hover:text-link-hover mt-2 cursor-pointer text-xs"
                  >
                    {isRulesExpanded ? "Show less" : "Read full rules"}
                  </button>
                )}
              </div>

              <div className="mt-auto flex items-center justify-between pt-4">
                <Button
                  onClick={() => handleCopyLink(server.link)}
                  size="sm"
                  variant="secondary"
                  className="px-3"
                  aria-label="Copy Server Link"
                  data-rybbit-event="Copy Server Link"
                  data-rybbit-prop-server-id={server.id}
                >
                  <Icon icon="heroicons:clipboard" className="mr-1 h-4 w-4" />
                  Copy link
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant="default"
                  className="px-3"
                  data-rybbit-event="Join Server"
                  data-rybbit-prop-server-id={server.id}
                >
                  <a
                    href={server.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Join Server
                  </a>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 mb-8 flex justify-center">
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            disabled={isFetching}
          />
        </div>
      )}

      {isAddModalOpen && (
        <AddServerModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onServerAdded={handleServerAdded}
          editingServer={editingServer}
        />
      )}

      <Dialog
        open={deleteModalOpen && !!serverToDelete}
        onOpenChange={(open) => !open && setDeleteModalOpen(false)}
      >
        <DialogContent
          className="bg-secondary-bg max-w-md rounded-lg p-0 backdrop-blur-none"
          showClose
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby={undefined}
        >
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-primary-text text-xl font-semibold">
              Delete Server?
            </DialogTitle>
          </DialogHeader>

          <DialogDescription className="text-secondary-text px-6 pt-4 pb-6">
            Are you sure you want to delete this server? This action cannot be
            undone.
          </DialogDescription>

          <DialogFooter className="mt-4 gap-2 px-6 pt-2 pb-6">
            <Button
              variant="ghost"
              size="sm"
              disabled={deletingServer}
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deletingServer}
              onClick={confirmDeleteServer}
            >
              {deletingServer ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServerList;
