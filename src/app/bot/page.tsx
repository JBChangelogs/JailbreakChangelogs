"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ChatBubbleLeftRightIcon,
  CommandLineIcon,
  BoltIcon,
  CalendarIcon,
  DocumentTextIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default function BotPage() {
  const [backgroundImage, setBackgroundImage] = useState("");

  useEffect(() => {
    const randomNumber = Math.floor(Math.random() * 19) + 1;
    setBackgroundImage(`https://assets.jailbreakchangelogs.xyz/assets/backgrounds/background${randomNumber}.webp`);
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
              unoptimized
            />
          )}
        </div>

        <div className="container relative z-10 mx-auto px-4">
          <div className="text-center">
            <h1 className="mb-6 text-3xl font-bold text-muted md:text-5xl">
              Welcome to our Discord Bot Page
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-base text-muted md:text-lg">
              Your go-to resource for information and updates about our Discord bot!
            </p>
            <a
              href="https://discord.com/discovery/applications/1281308669299920907"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-lg bg-[#124E66] px-8 py-3 text-lg font-semibold text-muted hover:bg-[#0D3A4A]"
            >
              Invite to Your Server
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-muted">
            Bot Features
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-lg border border-[#2E3944] bg-[#212a31] p-6">
              <div className="mb-4 flex items-center gap-2">
                <CalendarIcon className="h-6 w-6 text-[#5865F2]" />
                <h3 className="text-xl font-semibold text-muted">
                  Season Tracking
                </h3>
              </div>
              <p className="text-[#FFFFFF]">
                Remove the hassle of visiting the website! With season tracking, you can view all the latest season content directly from the Discord bot.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-lg border border-[#2E3944] bg-[#212a31] p-6">
              <div className="mb-4 flex items-center gap-2">
                <DocumentTextIcon className="h-6 w-6 text-[#5865F2]" />
                <h3 className="text-xl font-semibold text-muted">
                  Changelog Tracking
                </h3>
              </div>
              <p className="text-[#FFFFFF]">
                Stay informed about the latest updates and changes without the hassle of visiting external sites. Get instant updates on changelogs right from the bot.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-lg border border-[#2E3944] bg-[#212a31] p-6">
              <div className="mb-4 flex items-center gap-2">
                <ArrowsRightLeftIcon className="h-6 w-6 text-[#5865F2]" />
                <h3 className="text-xl font-semibold text-muted">
                  Item Tracking
                </h3>
              </div>
              <p className="text-[#FFFFFF]">
                Use /item and /items commands to track specific items or browse all available items in Jailbreak. View detailed item information directly through Discord!
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-lg border border-[#2E3944] bg-[#212a31] p-6">
              <div className="mb-4 flex items-center gap-2">
                <BoltIcon className="h-6 w-6 text-[#5865F2]" />
                <h3 className="text-xl font-semibold text-muted">
                  Fast & Efficient
                </h3>
              </div>
              <p className="text-[#FFFFFF]">
                Optimized for performance with quick response times and efficient resource usage to keep your server running smoothly.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-lg border border-[#2E3944] bg-[#212a31] p-6">
              <div className="mb-4 flex items-center gap-2">
                <CommandLineIcon className="h-6 w-6 text-[#5865F2]" />
                <h3 className="text-xl font-semibold text-muted">
                  Easy Commands
                </h3>
              </div>
              <p className="text-[#FFFFFF]">
                Access Jailbreak information quickly with simple commands. Check values, view changelogs, and more with intuitive slash commands.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-lg border border-[#2E3944] bg-[#212a31] p-6">
              <div className="mb-4 flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-[#5865F2]" />
                <h3 className="text-xl font-semibold text-muted">
                  Trade Notifications
                </h3>
              </div>
              <p className="text-[#FFFFFF]">
                Get DMs from users who want to trade with you from our trading page when you make a trade ad.
              </p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <p className="text-[#D3D9D4]">
              Bot made with ❤️ by{" "}
              <Link
                href="/users/659865209741246514"
                className="text-blue-400 hover:text-blue-300 hover:underline"
              >
                Jakobiis
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
} 