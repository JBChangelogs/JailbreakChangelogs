"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { generateShuffledBackgroundImages } from "@/utils/fisherYatesShuffle";

import { Icon } from "../components/UI/IconWrapper";
import TestimonialsSection from "@/components/Testimonials/TestimonialsSection";

export default function Home() {
  const [backgroundImages, setBackgroundImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    setTimeout(() => {
      setBackgroundImages(generateShuffledBackgroundImages());
    }, 0);
  }, []);

  // Function to cycle to the next image
  const nextImage = useCallback(() => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex + 1 >= backgroundImages.length ? 0 : prevIndex + 1,
    );
  }, [backgroundImages.length]);

  // Auto-cycle through images every 10 seconds
  useEffect(() => {
    if (backgroundImages.length === 0) return;

    const interval = setInterval(nextImage, 10000);
    return () => clearInterval(interval);
  }, [backgroundImages.length, nextImage]);

  const currentBackgroundImage = backgroundImages[currentImageIndex] || "";

  return (
    <main className="bg-primary-bg min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          {currentBackgroundImage && (
            <Image
              src={currentBackgroundImage}
              alt="Jailbreak Background"
              fill
              className="object-cover transition-opacity duration-1000"
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
      <TestimonialsSection />
      {/* Features Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-primary-text mb-12 text-center text-3xl font-bold">
            Features
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 - Changelogs & Seasons */}
            <div className="bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow rounded-lg border p-6 transition-colors duration-200 hover:shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <Icon
                  icon="mdi:file-document"
                  className="text-link h-6 w-6"
                  inline={true}
                />
                <h3 className="text-card-headline text-xl font-semibold">
                  Changelogs & Seasons
                </h3>
              </div>
              <p className="text-card-paragraph">
                Access the complete history of Jailbreak updates since 2017,
                seasonal rewards, contracts, and XP calculators to track your
                progress.
              </p>
            </div>

            {/* Feature 2 - Player Tools */}
            <div className="bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow rounded-lg border p-6 transition-colors duration-200 hover:shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <Icon
                  icon="mdi:account"
                  className="text-link h-6 w-6"
                  inline={true}
                />
                <h3 className="text-card-headline text-xl font-semibold">
                  Player Tools
                </h3>
              </div>
              <p className="text-card-paragraph">
                Check inventories, find OG owners, detect duped items, and view
                money leaderboards to track player progress and item ownership.
              </p>
            </div>

            {/* Feature 3 - Trading & Values */}
            <div className="bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow rounded-lg border p-6 transition-colors duration-200 hover:shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <Icon
                  icon="mdi:currency-usd"
                  className="text-link h-6 w-6"
                  inline={true}
                />
                <h3 className="text-card-headline text-xl font-semibold">
                  Trading & Values
                </h3>
              </div>
              <p className="text-card-paragraph">
                View item values, create trade ads, calculate trading worth, and
                access official trading statistics from Badimo.
              </p>
            </div>

            {/* Feature 4 - Community Features */}
            <div className="bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow rounded-lg border p-6 transition-colors duration-200 hover:shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <Icon
                  icon="mdi:chat"
                  className="text-link h-6 w-6"
                  inline={true}
                />
                <h3 className="text-card-headline text-xl font-semibold">
                  Community Features
                </h3>
              </div>
              <p className="text-card-paragraph">
                Join discussions, create profiles, browse private servers, and
                engage with the community with OAuth-secured features.
              </p>
            </div>

            {/* Feature 5 - Private Servers */}
            <div className="bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow rounded-lg border p-6 transition-colors duration-200 hover:shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <Icon
                  icon="mdi:calendar"
                  className="text-link h-6 w-6"
                  inline={true}
                />
                <h3 className="text-card-headline text-xl font-semibold">
                  Private Servers
                </h3>
              </div>
              <p className="text-card-paragraph">
                Browse and submit private servers for grinding, hanging out,
                trading, and more. Connect with fellow players.
              </p>
            </div>

            {/* Feature 6 - Advanced Tools */}
            <div className="bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow rounded-lg border p-6 transition-colors duration-200 hover:shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <Icon
                  icon="mdi:shield-check"
                  className="text-link h-6 w-6"
                  inline={true}
                />
                <h3 className="text-card-headline text-xl font-semibold">
                  Advanced Tools
                </h3>
              </div>
              <p className="text-card-paragraph">
                Access XP calculators, dupe detection, money leaderboards, and
                comprehensive Jailbreak analytics and tracking tools.
              </p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <p className="text-tertiary-text flex items-center justify-center gap-1">
              Crafted with{" "}
              <Icon
                icon="line-md:heart-filled"
                className="inline h-4 w-4 text-blue-500"
                style={{ color: "#1d80e2" }}
              />
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
