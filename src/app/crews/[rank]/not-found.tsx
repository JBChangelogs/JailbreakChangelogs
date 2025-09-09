import Link from "next/link";
import { HomeIcon } from "@heroicons/react/24/outline";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export default function CrewNotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#2e3944] bg-[url('https://assets.jailbreakchangelogs.xyz/assets/backgrounds/background16.webp')] bg-cover bg-center bg-no-repeat text-[#D3D9D4]">
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 z-[1] bg-black/50" />

      <div className="relative z-[2] mx-auto max-w-md px-4 text-center">
        <div className="rounded-2xl border border-white/[0.12] bg-[rgba(30,30,30,0.35)] px-8 py-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] backdrop-blur-xl">
          <div className="mb-8">
            <div
              className={`${inter.className} text-9xl font-bold text-[#5865F2]`}
            >
              404
            </div>
            <h1 className="mb-2 text-2xl font-bold text-white">
              Crew Not Found
            </h1>
            <p className="text-muted">
              The crew you&apos;re looking for doesn&apos;t exist or may have
              been removed.
            </p>
          </div>
          <div className="space-y-3">
            <Link
              href="/crews"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#5865F2] px-6 py-3 font-medium text-white transition-colors hover:bg-[#4752C4]"
            >
              Browse All Crews
            </Link>
            <Link
              href="/"
              className="text-muted flex w-full items-center justify-center gap-2 rounded-lg bg-[#212A31] px-6 py-3 transition-colors"
            >
              <HomeIcon className="h-5 w-5" />
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
