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
      `/api/assets/backgrounds/background${randomNumber}.webp`,
    );
  }, []);

  return (
    <main className="bg-primary-bg min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          {backgroundImage && (
            <Image
              src={backgroundImage}
              alt="Jailbreak Background"
              fill
              className="object-cover"
              style={{ objectPosition: "center 70%" }}
              priority
            />
          )}
          <div
            className="absolute inset-0 z-10"
            style={{ backgroundColor: "var(--color-hero-overlay)" }}
          ></div>
        </div>

        <div className="relative z-10 container mx-auto px-4">
          <div className="text-center">
            <h1
              className="mb-6 text-3xl font-bold md:text-5xl"
              style={{ color: "var(--color-form-button-text)" }}
            >
              Roblox Jailbreak Changelogs & Values Hub
            </h1>
            <p
              className="mx-auto mb-8 max-w-2xl text-base md:text-lg"
              style={{ color: "var(--color-form-button-text)" }}
            >
              Your comprehensive platform for Roblox Jailbreak item values,
              trade listings, update tracking, and community features. Get
              accurate trading data, post trade ads, track seasonal changes, and
              connect with other players!
            </p>
            <a
              href="roblox://experiences/start?placeId=606849621"
              target="_blank"
              rel="noopener noreferrer"
              className="text-form-button-text bg-button-info hover:bg-button-info-hover active:bg-button-info-active focus:ring-border-focus inline-block rounded-lg px-8 py-3 text-lg font-semibold transition-colors duration-200 focus:ring-2 focus:outline-none"
            >
              Play Jailbreak Now
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-primary-text mb-12 text-center text-3xl font-bold">
            Features
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 - Combined Changelogs & Seasonal */}
            <div className="bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow rounded-lg border p-6 transition-colors duration-200 hover:shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <DocumentTextIcon className="text-link h-6 w-6" />
                <h3 className="text-card-headline text-xl font-semibold">
                  Changelogs & Seasons
                </h3>
              </div>
              <p className="text-card-paragraph">
                Access the entire history of changelogs for Roblox Jailbreak and
                stay informed about all updates, seasonal changes, and the
                newest rewards with their requirements.
              </p>
            </div>

            {/* Feature 2 - Private Servers */}
            <div className="bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow rounded-lg border p-6 transition-colors duration-200 hover:shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <CalendarIcon className="text-link h-6 w-6" />
                <h3 className="text-card-headline text-xl font-semibold">
                  Private Servers
                </h3>
              </div>
              <p className="text-card-paragraph">
                Browse and submit private server listings for Roblox Jailbreak.
                Connect with fellow players in dedicated trading and gaming
                communities.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow rounded-lg border p-6 transition-colors duration-200 hover:shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="text-link h-6 w-6" />
                <h3 className="text-card-headline text-xl font-semibold">
                  Community Engagement
                </h3>
              </div>
              <p className="text-card-paragraph">
                Engage with the community by commenting on changelogs, seasons,
                item and trade ad pages. OAuth ensures only verified members can
                participate.
              </p>
            </div>

            {/* Feature 4 - Values Database */}
            <div className="bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow rounded-lg border p-6 transition-colors duration-200 hover:shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <CurrencyDollarIcon className="text-link h-6 w-6" />
                <h3 className="text-card-headline text-xl font-semibold">
                  Values Database
                </h3>
              </div>
              <p className="text-card-paragraph">
                View values for all tradable items in Roblox Jailbreak. Favorite
                items, track value history, and monitor price changes over time.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow rounded-lg border p-6 transition-colors duration-200 hover:shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <ArrowsRightLeftIcon className="text-link h-6 w-6" />
                <h3 className="text-card-headline text-xl font-semibold">
                  Trading Hub
                </h3>
              </div>
              <p className="text-card-paragraph">
                Create trade advertisements and check current item values. Post
                your offers, request specific items, and browse through other
                players&apos; trade listings to find the perfect deal.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow rounded-lg border p-6 transition-colors duration-200 hover:shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheckIcon className="text-link h-6 w-6" />
                <h3 className="text-card-headline text-xl font-semibold">
                  Dupe Detection System
                </h3>
              </div>
              <p className="text-card-paragraph">
                Report and check for duped items. Search by player or item to
                see if they have been reported as duplicated in the trading
                system.
              </p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <p className="text-tertiary-text flex items-center justify-center gap-1">
              Crafted with{" "}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                className="inline"
              >
                <path
                  fill="#1d80e2"
                  fillOpacity="0"
                  d="M12 8c0 0 0 0 0.76 -1c0.88 -1.16 2.18 -2 3.74 -2c2.49 0 4.5 2.01 4.5 4.5c0 0.93 -0.28 1.79 -0.76 2.5c-0.81 1.21 -8.24 9 -8.24 9c0 0 -7.43 -7.79 -8.24 -9c-0.48 -0.71 -0.76 -1.57 -0.76 -2.5c0 -2.49 2.01 -4.5 4.5 -4.5c1.56 0 2.87 0.84 3.74 2c0.76 1 0.76 1 0.76 1Z"
                >
                  <animate
                    fill="freeze"
                    attributeName="fill-opacity"
                    begin="0.7s"
                    dur="0.5s"
                    values="0;1"
                  />
                </path>
                <path
                  fill="none"
                  stroke="#1d80e2"
                  strokeDasharray="32"
                  strokeDashoffset="32"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8c0 0 0 0 -0.76 -1c-0.88 -1.16 -2.18 -2 -3.74 -2c-2.49 0 -4.5 2.01 -4.5 4.5c0 0.93 0.28 1.79 0.76 2.5c0.81 1.21 8.24 9 8.24 9M12 8c0 0 0 0 0.76 -1c0.88 -1.16 2.18 -2 3.74 -2c2.49 0 4.5 2.01 4.5 4.5c0 0.93 -0.28 1.79 -0.76 2.5c-0.81 1.21 -8.24 9 -8.24 9"
                >
                  <animate
                    fill="freeze"
                    attributeName="stroke-dashoffset"
                    dur="0.7s"
                    values="32;0"
                  />
                </path>
              </svg>
              {" by "}
              <Link
                href="/users/659865209741246514"
                className="text-link hover:text-link-hover active:text-link-active transition-colors duration-200 hover:underline"
              >
                Jakobiis
              </Link>
              {" & "}
              <Link
                href="/users/1019539798383398946"
                className="text-link hover:text-link-hover active:text-link-active transition-colors duration-200 hover:underline"
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
