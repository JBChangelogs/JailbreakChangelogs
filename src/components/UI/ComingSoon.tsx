import Link from 'next/link';
import { HomeIcon } from '@heroicons/react/24/outline';

export default function ComingSoon() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#2e3944] text-[#D3D9D4] bg-[url('https://assets.jailbreakchangelogs.xyz/assets/backgrounds/background11.webp')] bg-cover bg-no-repeat bg-center relative">
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/50 z-[1]" />
      {/* Vignette overlay */}
      <div className="absolute inset-0 bg-[url('https://assets.jailbreakchangelogs.xyz/assets/backgrounds/vignette.png')] bg-cover bg-no-repeat bg-center z-[1]" />
      
      <div className="text-center max-w-md mx-auto px-4 relative z-[2]">
        <div className="px-8 py-8 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] bg-[rgba(30,30,30,0.35)] backdrop-blur-xl border border-white/[0.12]">
          <div className="mb-8">
            <div className="flex justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 72 72">
                <path fill="#fff" d="M15.35 59.08h-1.779c-.684 0-1.238-.578-1.238-1.291v-34.83c0-.713.554-1.291 1.238-1.291h1.779c.684 0 1.238.578 1.238 1.291v34.83c0 .713-.554 1.291-1.238 1.291m43.11 0h-1.779c-.684 0-1.238-.713-1.238-1.593v-32.97c0-.88.554-1.593 1.238-1.593h1.779c.684 0 1.238.713 1.238 1.593v32.97c0 .88-.555 1.593-1.238 1.593"/>
                <path fill="#fcea2b" d="M7.45 43.47h7.743L7.45 51.213z"/>
                <path fill="#3f3f3f" d="M15.19 43.47h12.34l-7.743 7.743l-12.34-.058z"/>
                <path fill="#fcea2b" d="M27.48 43.47h12.34l-7.743 7.743h-12.29z"/>
                <path fill="#3f3f3f" d="M39.82 43.47h12.34l-7.743 7.743h-12.34z"/>
                <path fill="#fcea2b" d="m52.16 43.47l11.89-.184l-7.918 7.951H44.368z"/>
                <path fill="#3f3f3f" d="M64.008 43.332v7.612h-7.612z"/>
                <path fill="#fcea2b" d="m7.95 28.33l7.646-.034l-7.646 7.646z"/>
                <path fill="#3f3f3f" d="M15.6 28.3h11.94l-7.695 7.646H7.955z"/>
                <path fill="#fcea2b" d="M27.48 28.3h12.34l-7.743 7.743h-12.29z"/>
                <path fill="#3f3f3f" d="M39.82 28.3h12.34l-7.743 7.743h-12.34z"/>
                <path fill="#fcea2b" d="m52.16 28.3l10.908-.007l-.015 1.05l-6.615 6.603l-12.02.098z"/>
                <path fill="#3f3f3f" d="M64.05 28.33v7.612h-7.612z"/>
                <g fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                  <path d="M12.74 42.72v-6.348M16.92 50.9v6.509c0 .672-.545 1.217-1.217 1.217h-1.748a1.217 1.217 0 0 1-1.217-1.217v-6.071M16.92 36.37v6.348M12.74 28.24v-5.907m4.181 0v5.812M55.1 43.29v-6.921m4.18 14.971v6.071c0 .672-.545 1.217-1.217 1.217h-1.748a1.217 1.217 0 0 1-1.217-1.217V51.34m4.182-14.97v5.969M55.1 28.03v-5.891m4.181 0v5.796M7.95 28.33h56.1v7.612H7.95z"/>
                  <path d="M7.95 43.29h56.1v7.612H7.95z"/>
                  <circle cx="14.83" cy="17.97" r="4.594"/>
                  <circle cx="57.19" cy="17.97" r="4.594"/>
                </g>
                <g fill="#f4aa41" stroke="#e27022" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                  <circle cx="14.835" cy="17.966" r="4.594"/>
                  <circle cx="57.185" cy="17.966" r="4.594"/>
                </g>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Under Construction</h1>
            <p className="text-muted mb-4">
              This feature is currently under active development.
            </p>
            <p className="text-muted text-sm">
              Join our Discord to test this feature early with our Discord bot (very experimental, info may be inaccurate - please report bugs), or stay tuned for the website release!
            </p>
          </div>
          <div className="space-y-3">
            <Link
              href="https://discord.jailbreakchangelogs.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Join The Discord
            </Link>
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg transition-colors font-medium"
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
