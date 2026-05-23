"use client";

import { useEffect, useState } from "react";
import React from "react";
import Link from "next/link";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import SeasonContractsClient from "@/components/Seasons/SeasonContractsClient";
import WeeklyContractsCountdown from "@/components/Seasons/WeeklyContractsCountdown";
import ContractsLoading from "@/app/seasons/contracts/loading";
import { Icon } from "@iconify/react";
import {
  PUBLIC_API_URL,
  INVENTORY_API_URL,
  INVENTORY_API_SOURCE_HEADER,
} from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { createLogger } from "@/services/logger";

const log = createLogger("UI");

interface SeasonContract {
  team: "Criminal" | "Police";
  name: string;
  description: string;
  reqseasonpass: boolean;
  goal: number;
  reward: number;
}

interface LatestSeason {
  season: number;
  title: string;
  end_date: number;
}

export default function SeasonContractsPage() {
  const [contracts, setContracts] = useState<SeasonContract[] | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number>(0);
  const [latestSeason, setLatestSeason] = useState<LatestSeason | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { url: contractsSeasonUrl, headers: contractsSeasonHeaders } =
          buildApiFetchRequest(PUBLIC_API_URL!, "/seasons/latest");
        const [contractsRes, seasonRes] = await Promise.all([
          fetch(`${INVENTORY_API_URL}/seasons/contract`, {
            headers: {
              "User-Agent": "JailbreakChangelogs-Inventory/1.0",
              "X-Source": INVENTORY_API_SOURCE_HEADER,
            },
          }),
          fetch(contractsSeasonUrl, {
            credentials: "include",
            headers: {
              ...contractsSeasonHeaders,
              "User-Agent": "JailbreakChangelogs-Seasons/1.0",
            },
          }),
        ]);

        if (contractsRes.ok) {
          const data = await contractsRes.json();
          setContracts(data.data ?? []);
          setUpdatedAt(data.updated_at ?? 0);
        } else {
          setContracts([]);
        }

        if (seasonRes.ok) {
          setLatestSeason(await seasonRes.json());
        }
      } catch (error) {
        log.error("Error loading contracts data", error);
        setContracts([]);
      } finally {
        setIsLoaded(true);
      }
    };

    void loadData();
  }, []);

  if (!isLoaded) {
    return <ContractsLoading />;
  }

  const seasonEnded = latestSeason?.end_date
    ? Math.floor(Date.now() / 1000) >= latestSeason.end_date
    : false;

  if (seasonEnded) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 pb-16">
          <Breadcrumb />

          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="border-border-card bg-secondary-bg max-w-2xl rounded-lg border p-12 text-center">
              <div className="mb-8">
                <div className="bg-button-info/20 border-button-info/30 mx-auto flex h-20 w-20 items-center justify-center rounded-full border">
                  <Icon
                    icon="line-md:calendar"
                    className="text-button-info h-10 w-10"
                  />
                </div>
              </div>

              <h2 className="text-primary-text mb-4 text-2xl font-bold">
                {latestSeason?.title
                  ? `Season ${latestSeason.season} / ${latestSeason.title}`
                  : "Season"}{" "}
                Has Ended
              </h2>

              <div className="text-secondary-text mb-8 text-lg leading-relaxed">
                <p>Check back next season for new weekly contracts.</p>
              </div>

              <div className="flex justify-center">
                <Button asChild>
                  <Link href="/seasons">
                    <Icon icon="line-md:calendar" className="h-5 w-5" />
                    View Seasons
                  </Link>
                </Button>
              </div>

              <div className="mt-8">
                <div className="bg-button-info/10 border-button-info rounded-lg border p-3 sm:p-4">
                  <div className="text-primary-text flex items-start gap-2 text-xs sm:text-sm">
                    <Icon
                      icon="emojione:light-bulb"
                      className="text-button-info shrink-0 text-base sm:text-lg"
                    />
                    <span className="leading-relaxed font-medium">
                      Helpful Tip: New seasons typically start shortly after the
                      previous one ends.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!contracts || contracts.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 pb-16">
          <Breadcrumb />

          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="border-border-card bg-secondary-bg max-w-2xl rounded-lg border p-12 text-center">
              <div className="mb-8">
                <div className="bg-button-info/20 border-button-info/30 mx-auto flex h-20 w-20 items-center justify-center rounded-full border">
                  <Icon
                    icon="line-md:document"
                    className="text-button-info h-10 w-10"
                  />
                </div>
              </div>

              <h2 className="text-primary-text mb-4 text-2xl font-bold">
                No Contracts Available
              </h2>

              <div className="text-secondary-text mb-8 text-lg leading-relaxed">
                <p>Check back later for the latest weekly contracts.</p>
              </div>

              <div className="flex justify-center">
                <Button asChild>
                  <Link href="/seasons">
                    <Icon icon="line-md:calendar" className="h-5 w-5" />
                    View Seasons
                  </Link>
                </Button>
              </div>

              <div className="mt-8">
                <div className="bg-button-info/10 border-button-info rounded-lg border p-3 sm:p-4">
                  <div className="text-primary-text flex items-start gap-2 text-xs sm:text-sm">
                    <Icon
                      icon="emojione:light-bulb"
                      className="text-button-info shrink-0 text-base sm:text-lg"
                    />
                    <span className="leading-relaxed font-medium">
                      Helpful Tip: Contracts are updated weekly during active
                      seasons.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 pb-16">
        <Breadcrumb />

        <div className="mb-12">
          <WeeklyContractsCountdown season={latestSeason} />
        </div>

        <SeasonContractsClient contracts={contracts} updatedAt={updatedAt} />
      </div>
    </div>
  );
}
