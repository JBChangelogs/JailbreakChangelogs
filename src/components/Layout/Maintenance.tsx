import Image from 'next/image';

export default function Maintenance() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#2e3944] text-[#D3D9D4] bg-[url('https://assets.jailbreakchangelogs.xyz/assets/backgrounds/background16.webp')] bg-cover bg-no-repeat bg-center relative">
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black/70 z-[1]" />
      
      <div className="container mx-auto max-w-sm relative z-[2] px-4">
        <div className="text-center flex flex-col items-center gap-6 px-8 py-10 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] bg-[rgba(30,30,30,0.35)] backdrop-blur-xl border border-white/[0.12]">
          <Image
            src="https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Short_Transparent.webp"
            alt="Jailbreak Changelogs Logo"
            width={140}
            height={140}
            priority
            unoptimized
            draggable={false}
            className="h-[140px] w-auto filter drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
          />

          <h1 className="text-white font-extrabold tracking-wider mb-4 text-4xl">
            Under Maintenance
          </h1>
          
          <p className="text-[#f3f4f6] text-xl font-medium mb-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
            We&apos;re currently performing some maintenance on our site. We&apos;ll be back soon!
          </p>
          
          <a
            href="https://status.jailbreakchangelogs.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#1d7da3] hover:bg-[#1a6f91] text-white text-base font-semibold px-6 py-2.5 rounded-lg shadow-[0_4px_14px_0_rgba(0,0,0,0.25)] transition-colors duration-200"
          >
            Check Service Status
          </a>
        </div>
      </div>
    </div>
  );
} 