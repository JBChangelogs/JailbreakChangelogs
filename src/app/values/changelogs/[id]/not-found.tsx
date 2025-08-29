import Link from 'next/link';
import { HomeIcon } from '@heroicons/react/24/outline';
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export default function ValuesChangelogNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#2e3944] text-[#D3D9D4] bg-[url('https://assets.jailbreakchangelogs.xyz/assets/backgrounds/background16.webp')] bg-cover bg-no-repeat bg-center relative">
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/50 z-[1]" />
      
      <div className="text-center max-w-md mx-auto px-4 relative z-[2]">
        <div className="px-8 py-8 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] bg-[rgba(30,30,30,0.35)] backdrop-blur-xl border border-white/[0.12]">
          <div className="mb-8">
            <div className={`${inter.className} font-bold text-9xl text-[#5865F2]`}>
              404
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Values Changelog Not Found</h1>
            <p className="text-muted">
              The values changelog you&apos;re looking for doesn&apos;t exist or may have been removed.
            </p>
          </div>
          <div className="space-y-3">
            <Link
              href="/values/changelogs"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg transition-colors font-medium"
            >
              Browse All Values Changelogs
            </Link>
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#212A31] text-muted rounded-lg transition-colors"
            >
              <HomeIcon className="w-5 h-5" />
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 