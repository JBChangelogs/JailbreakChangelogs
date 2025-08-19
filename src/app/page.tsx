"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  DocumentTextIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  ArrowsRightLeftIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

export default function Home() {
  const [backgroundImage, setBackgroundImage] = useState("");

  useEffect(() => {
    // Generate random number between 1 and 14
    const randomNumber = Math.floor(Math.random() * 19) + 1;
    setBackgroundImage(
      `https://assets.jailbreakchangelogs.xyz/assets/backgrounds/background${randomNumber}.webp`
    );
  }, []);

  return (
    <main className="min-h-screen bg-[#2E3944]">
      {/* Hero Section */}
      <section className="relative py-20">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black"></div>
          {backgroundImage && (
            <Image
              src={backgroundImage}
              alt="Jailbreak Background"
              fill
              className="object-cover opacity-40"
              priority
            />
          )}
        </div>

        <div className="container relative z-10 mx-auto px-4">
          <div className="text-center">
            <h1 className="mb-6 text-3xl font-bold text-muted md:text-5xl">
              Roblox Jailbreak Changelogs & Values Hub
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-base text-muted md:text-lg">
              Your comprehensive platform for Roblox Jailbreak item values,
              trade listings, update tracking, and community features. Get
              accurate trading data, post trade ads, track seasonal changes, and
              connect with other players!
            </p>
            <a
              href="roblox://experiences/start?placeId=606849621"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-lg bg-[#124E66] px-8 py-3 text-lg font-semibold text-muted hover:bg-[#0D3A4A]"
            >
              Play Jailbreak Now
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-muted">
            Features
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 - Combined Changelogs & Seasonal */}
            <div className="rounded-lg border border-[#2E3944] bg-[#212a31] p-6">
              <div className="mb-4 flex items-center gap-2">
                <DocumentTextIcon className="h-6 w-6 text-[#3B82F6]" />
                <h3 className="text-xl font-semibold text-muted">
                  Changelogs & Seasons
                </h3>
              </div>
              <p className="text-[#FFFFFF]">
                Access the entire history of changelogs for Roblox Jailbreak and
                stay informed about all updates, seasonal changes, and the
                newest rewards with their requirements.
              </p>
            </div>

            {/* Feature 2 - Private Servers */}
            <div className="rounded-lg border border-[#2E3944] bg-[#212a31] p-6">
              <div className="mb-4 flex items-center gap-2">
                <CalendarIcon className="h-6 w-6 text-[#3B82F6]" />
                <h3 className="text-xl font-semibold text-muted">
                  Private Servers
                </h3>
              </div>
              <p className="text-[#FFFFFF]">
                Browse and submit private server listings for Roblox Jailbreak.
                Connect with fellow players in dedicated trading and gaming
                communities.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-lg border border-[#2E3944] bg-[#212a31] p-6">
              <div className="mb-4 flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-[#3B82F6]" />
                <h3 className="text-xl font-semibold text-muted">
                  Community Engagement
                </h3>
              </div>
              <p className="text-[#FFFFFF]">
                Engage with the community by commenting on changelogs, seasons,
                item and trade ad pages. OAuth ensures only verified members can
                participate.
              </p>
            </div>

            {/* Feature 4 - Values Database */}
            <div className="rounded-lg border border-[#2E3944] bg-[#212a31] p-6">
              <div className="mb-4 flex items-center gap-2">
                <CurrencyDollarIcon className="h-6 w-6 text-[#3B82F6]" />
                <h3 className="text-xl font-semibold text-muted">
                  Values Database
                </h3>
              </div>
              <p className="text-[#FFFFFF]">
                View values for all tradable items in Roblox Jailbreak. Favorite
                items, track value history, and monitor price changes over time.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-lg border border-[#2E3944] bg-[#212a31] p-6">
              <div className="mb-4 flex items-center gap-2">
                <ArrowsRightLeftIcon className="h-6 w-6 text-[#3B82F6]" />
                <h3 className="text-xl font-semibold text-muted">
                  Trading Hub
                </h3>
              </div>
              <p className="text-[#FFFFFF]">
                Create trade advertisements and check current item values. Post
                your offers, request specific items, and browse through other
                players&apos; trade listings to find the perfect deal.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-lg border border-[#2E3944] bg-[#212a31] p-6">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheckIcon className="h-6 w-6 text-[#3B82F6]" />
                <h3 className="text-xl font-semibold text-muted">
                  Dupe Detection System
                </h3>
              </div>
              <p className="text-[#FFFFFF]">
                Report and check for duped items. Search by player or item to
                see if they have been reported as duplicated in the trading
                system.
              </p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <p className="text-[#D3D9D4]">
              Crafted with ❤️ by{" "}
              <Link
                href="/users/659865209741246514"
                className="text-blue-400 hover:text-blue-300 hover:underline"
              >
                Jakobiis
              </Link>
              {" & "}
              <Link
                href="/users/1019539798383398946"
                className="text-blue-400 hover:text-blue-300 hover:underline"
              >
                Jalenzz16
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
