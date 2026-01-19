"use client";

import { useEffect, useState } from "react";
import { ThemeProvider } from "@mui/material";
import { darkTheme } from "@/theme/darkTheme";
import React from "react";
import {
  fetchValueSuggestion,
  fetchItems,
  voteValueSuggestion,
  unvoteValueSuggestion,
  ValueSuggestion,
} from "@/utils/api";
import { getCategoryColor } from "@/utils/categoryIcons";
import { Item } from "@/types";
import { getItemImagePath } from "@/utils/images";
import Link from "next/link";
import { formatMessageDate } from "@/utils/timestamp";
import Image from "next/image";
import { DefaultAvatar } from "@/utils/avatar";
import ReactMarkdown from "react-markdown";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { notFound } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import ChangelogComments from "@/components/PageComments/ChangelogComments";
import SuggestionVotersList from "./SuggestionVotersList";

export default function SuggestionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = React.use(params);
  const [suggestion, setSuggestion] = useState<ValueSuggestion | null>(null);
  const [itemsMap, setItemsMap] = useState<Record<number, Item>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votersRefreshKey, setVotersRefreshKey] = useState(0);

  // Voting Modal State - REMOVED

  const { user: currentUser } = useAuthContext();

  const handleVote = async (
    type: "upvote" | "downvote",
    suggestionObj: ValueSuggestion,
  ) => {
    if (!currentUser) {
      toast.error("You must be logged in to vote.");
      return;
    }

    const toastId = toast.loading("Counting your vote...");

    try {
      await voteValueSuggestion(suggestionObj.id, type);
      toast.success("Vote recorded successfully.", { id: toastId });

      // Refresh suggestion data
      const updatedSuggestion = await fetchValueSuggestion(suggestionObj.id);
      if (updatedSuggestion) {
        setSuggestion(updatedSuggestion);
        setVotersRefreshKey((prev) => prev + 1);
      }
    } catch (e) {
      if (e instanceof Error) {
        toast.error(e.message, { id: toastId });
      } else {
        toast.error("An error occurred while voting.", { id: toastId });
      }
    }
  };

  const handleUnvote = async (suggestionObj: ValueSuggestion) => {
    if (!currentUser) {
      toast.error("You must be logged in to remove your vote.");
      return;
    }

    const toastId = toast.loading("Removing your vote...");

    try {
      await unvoteValueSuggestion(suggestionObj.id);
      toast.success("Vote removed successfully.", { id: toastId });

      // Refresh suggestion data
      const updatedSuggestion = await fetchValueSuggestion(suggestionObj.id);
      if (updatedSuggestion) {
        setSuggestion(updatedSuggestion);
        setVotersRefreshKey((prev) => prev + 1);
      }
    } catch (e) {
      if (e instanceof Error) {
        toast.error(e.message, { id: toastId });
      } else {
        toast.error("An error occurred while removing vote.", { id: toastId });
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [suggestionData, itemsList] = await Promise.all([
          fetchValueSuggestion(resolvedParams.id),
          fetchItems(),
        ]);

        if (!suggestionData) {
          setError("Suggestion not found");
        } else {
          setSuggestion(suggestionData);
        }

        if (itemsList) {
          const map: Record<number, Item> = {};
          itemsList.forEach((item) => {
            map[item.id] = item;
          });
          setItemsMap(map);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [resolvedParams.id]);

  const formatFieldName = (field: string) => {
    return field
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <ThemeProvider theme={darkTheme}>
        <main className="min-h-screen">
          <div className="container mx-auto mb-8 px-4 sm:px-6">
            <Breadcrumb />
            <div className="border-border-primary bg-secondary-bg animate-pulse rounded-lg border p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="bg-primary-bg h-8 w-1/3 rounded"></div>
                <div className="bg-primary-bg h-8 w-1/4 rounded"></div>
              </div>
              <div className="bg-primary-bg mb-4 h-32 w-full rounded"></div>
              <div className="bg-primary-bg h-4 w-2/3 rounded"></div>
            </div>
          </div>
        </main>
      </ThemeProvider>
    );
  }

  if (error || !suggestion) {
    if (error === "Suggestion not found") {
      notFound();
      return null; // unreachable strictly but satisfying types
    }
    return (
      <ThemeProvider theme={darkTheme}>
        <main className="min-h-screen">
          <div className="container mx-auto px-4 sm:px-6">
            <Breadcrumb />
            <div className="text-button-danger mt-8 text-center text-xl font-bold">
              {error}
            </div>
          </div>
        </main>
      </ThemeProvider>
    );
  }

  const itemData = itemsMap[suggestion.item_id];
  const itemName = itemData ? itemData.name : `Item #${suggestion.item_id}`;
  const itemType = itemData ? itemData.type : "Vehicle";
  const itemImage =
    itemData && itemData.name
      ? getItemImagePath(itemData.type, itemData.name, true)
      : null;

  return (
    <ThemeProvider theme={darkTheme}>
      <main className="min-h-screen">
        <div className="container mx-auto mb-8 px-4 sm:px-6">
          <Breadcrumb />

          <div className="mt-6">
            <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start">
              {itemImage && (
                <div className="bg-secondary-bg border-border-primary relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border">
                  <Image
                    src={itemImage}
                    alt={itemName}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      (
                        e as unknown as {
                          currentTarget: HTMLElement;
                        }
                      ).currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
              <div className="flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <Link
                    href={`/item/${itemType.toLowerCase()}/${encodeURIComponent(itemName)}`}
                    prefetch={false}
                    className="text-primary-text hover:text-link text-3xl font-bold transition-colors"
                  >
                    {itemName}
                  </Link>
                  <span
                    className={`text-primary-text rounded px-2.5 py-0.5 text-sm font-bold tracking-wider uppercase ${
                      suggestion.status === "approved"
                        ? "bg-button-success/20"
                        : suggestion.status === "rejected"
                          ? "bg-button-danger/20"
                          : "bg-button-info/20"
                    }`}
                  >
                    {suggestion.status}
                  </span>
                  {itemData && (
                    <span
                      className="text-primary-text flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
                      style={{
                        borderColor: getCategoryColor(itemData.type),
                        backgroundColor: getCategoryColor(itemData.type) + "20",
                      }}
                    >
                      {itemData.type}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full">
                    <DefaultAvatar />
                    {suggestion.user?.avatar && (
                      <Image
                        src={
                          suggestion.user.avatar
                            ? `https://cdn.discordapp.com/avatars/${suggestion.user.id}/${suggestion.user.avatar}.png`
                            : ""
                        }
                        alt={suggestion.user.username}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          (
                            e as unknown as { currentTarget: HTMLElement }
                          ).currentTarget.style.display = "none";
                        }}
                      />
                    )}
                  </div>
                  <span className="text-secondary-text text-base">
                    Suggested by{" "}
                    <Link
                      href={`/users/${suggestion.user.id}`}
                      prefetch={false}
                      className="text-primary-text hover:text-link font-medium transition-colors"
                    >
                      {suggestion.user.global_name || suggestion.user.username}
                    </Link>{" "}
                    • {formatMessageDate(suggestion.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-1">
                <div className="bg-secondary-bg border-border-primary overflow-hidden rounded-lg border">
                  <div className="bg-primary-bg/50 border-border-primary border-b px-4 py-3">
                    <span className="text-secondary-text text-sm font-bold tracking-wider uppercase">
                      Details
                    </span>
                  </div>
                  <div className="space-y-6 p-6">
                    <div>
                      <span className="text-secondary-text mb-1 block text-xs font-bold tracking-wider uppercase">
                        Suggestion Type
                      </span>
                      <span className="text-primary-text text-lg font-medium">
                        {formatFieldName(suggestion.field)}
                      </span>
                    </div>
                    <div>
                      <span className="text-secondary-text mb-1 block text-xs font-bold tracking-wider uppercase">
                        Current Value
                      </span>
                      <span className="text-primary-text text-xl font-bold">
                        {suggestion.current_value}
                      </span>
                    </div>
                    <div>
                      <span className="text-secondary-text mb-1 block text-xs font-bold tracking-wider uppercase">
                        Suggested Value
                      </span>
                      <span className="text-button-success text-xl font-bold">
                        {suggestion.suggested_value}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-secondary-bg border-border-primary rounded-lg border p-6">
                  <div className="mb-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleVote("upvote", suggestion)}
                      className="bg-button-success/10 hover:bg-button-success/20 text-button-success flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg py-3 transition-colors focus:outline-none"
                      aria-label="Upvote"
                    >
                      <span className="text-2xl font-bold">↑</span>
                      <span className="text-lg font-bold">
                        {suggestion.upvotes}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVote("downvote", suggestion)}
                      className="bg-button-danger/10 hover:bg-button-danger/20 text-button-danger flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg py-3 transition-colors focus:outline-none"
                      aria-label="Downvote"
                    >
                      <span className="text-2xl font-bold">↓</span>
                      <span className="text-lg font-bold">
                        {suggestion.downvotes}
                      </span>
                    </button>
                  </div>

                  {currentUser &&
                    suggestion.votes &&
                    (() => {
                      const upvote = suggestion.votes.upvotes?.find(
                        (v) => v.user?.id === currentUser.id,
                      );
                      const downvote = suggestion.votes.downvotes?.find(
                        (v) => v.user?.id === currentUser.id,
                      );

                      if (upvote || downvote) {
                        return (
                          <div
                            className={`mb-4 flex flex-col items-center gap-2 rounded-lg border p-3 text-center text-sm font-medium ${
                              upvote
                                ? "border-button-success/20 bg-button-success/10 text-button-success"
                                : "border-button-danger/20 bg-button-danger/10 text-button-danger"
                            }`}
                          >
                            <span>
                              You {upvote ? "upvoted" : "downvoted"} this
                              suggestion.
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnvote(suggestion);
                              }}
                              className="border-border-primary bg-button-info text-form-button-text hover:bg-button-info-hover cursor-pointer rounded border px-3 py-1 text-xs font-bold shadow-sm transition-colors"
                            >
                              Remove Vote
                            </button>
                          </div>
                        );
                      }
                      return null;
                    })()}

                  <SuggestionVotersList
                    suggestionId={suggestion.id}
                    refreshKey={votersRefreshKey}
                  />
                </div>
              </div>

              <div className="space-y-8 lg:col-span-2">
                <div className="bg-secondary-bg border-border-primary rounded-lg border p-6">
                  <h3 className="text-primary-text mb-4 text-lg font-bold">
                    Reason
                  </h3>
                  <div className="text-secondary-text text-base leading-relaxed">
                    <ReactMarkdown
                      components={{
                        strong: (props) => (
                          <b className="text-primary-text" {...props} />
                        ),
                        p: (props) => (
                          <p
                            className="mb-3 wrap-break-word last:mb-0"
                            {...props}
                          />
                        ),
                        a: (props) => (
                          <a className="text-link hover:underline" {...props} />
                        ),
                      }}
                    >
                      {suggestion.reason || "No reason provided."}
                    </ReactMarkdown>
                  </div>
                </div>

                <div>
                  <ChangelogComments
                    changelogId={suggestion.id}
                    changelogTitle={`Suggestion #${suggestion.id}`}
                    type="item"
                    itemType={`${itemName} Value Suggestion`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </ThemeProvider>
  );
}
