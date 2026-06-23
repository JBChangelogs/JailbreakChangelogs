import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Script from "next/script";
import Image from "next/image";
import "./globals.css";
import Header from "@/components/Layout/Header";
import HideOnAccessDenied from "@/components/Layout/HideOnAccessDenied";
import MaintenanceBypass from "@/components/Layout/MaintenanceBypass";
import Footer from "@/components/Layout/Footer";
import VersionInfoWrapper from "@/components/Layout/VersionInfoWrapper";
import VersionInfoSkeleton from "@/components/Layout/VersionInfoSkeleton";
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";
import ThemeProvider from "@/components/ThemeProvider";
import { ThemeProvider as CustomThemeProvider } from "@/contexts/ThemeContext";
import { TwemojiProvider } from "@/contexts/TwemojiContext";
import { AuthProvider } from "@/contexts/AuthContext";
import NitroAnchorCloseSupporterModal from "@/components/Ads/NitroAnchorCloseSupporterModal";
import NitroVideoCloseSupporterModal from "@/components/Ads/NitroVideoCloseSupporterModal";
import NitroBottomAnchor from "@/components/Ads/NitroBottomAnchor";
import NitroVideoPlayer from "@/components/Ads/NitroVideoPlayer";
import AdErrorBoundary from "@/components/Ads/AdErrorBoundary";
import RybbitIdentity from "@/components/Analytics/RybbitIdentity";
import {
  checkMaintenanceMode,
  getMaintenanceMetadata,
} from "@/utils/api/maintenance";
import { getGitHubUrl } from "@/utils/trading/version";
import { Suspense } from "react";
import QueryProvider from "@/components/QueryProvider";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export const viewport: Viewport = {
  themeColor: "#2462cd",
};

export async function generateMetadata(): Promise<Metadata> {
  const maintenanceMetadata = await getMaintenanceMetadata();
  if (maintenanceMetadata) {
    return maintenanceMetadata;
  }

  return {
    metadataBase: new URL("https://jailbreakchangelogs.com"),
    title: {
      template: "%s | Jailbreak Changelogs",
      default: "Jailbreak Changelogs",
    },
    description:
      "Your all-in-one Roblox Jailbreak platform for changelogs and game update tracking, values, trading, inventory lookups, OG item tracking, dupe detection, and more.",
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: "Jailbreak Changelogs",
      description:
        "Your all-in-one Roblox Jailbreak platform for changelogs and game update tracking, values, trading, inventory lookups, OG item tracking, dupe detection, and more.",
      images: [
        {
          url: "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Embed_Graphic.png",
          width: 2400,
          height: 1260,
          alt: "Jailbreak Changelogs Banner",
        },
      ],
      type: "website",
      locale: "en_US",
      siteName: "Jailbreak Changelogs",
      url: "https://jailbreakchangelogs.com",
    },
    twitter: {
      card: "summary_large_image",
      title: "Jailbreak Changelogs",
      description:
        "Your all-in-one Roblox Jailbreak platform for changelogs and game update tracking, values, trading, inventory lookups, OG item tracking, dupe detection, and more.",
      images: [
        "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Embed_Graphic.png",
      ],
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isMaintenanceMode } = await checkMaintenanceMode();
  const githubUrl = getGitHubUrl();
  const isRailwayDeployed = ["production", "testing"].includes(
    process.env.RAILWAY_ENVIRONMENT_NAME ?? "",
  );
  if (isMaintenanceMode) {
    return (
      <html
        lang="en"
        className={`${GeistSans.variable} ${GeistMono.variable}`}
        suppressHydrationWarning
      >
        <head>
          {/* Apply saved theme class before React hydrates to prevent FOUC */}
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'||t==='amoled'){document.documentElement.classList.add(t);}}catch(e){}})();`,
            }}
          />
          {/* Rybbit Analytics */}
          {isRailwayDeployed && (
            <Script
              src="https://rybbit-api.jailbreakchangelogs.com/api/script.js"
              data-site-id="0d25b013fe3a"
              defer
            />
          )}
          {/* Nitro Pay Ads & GDPR - Always load script for consent prompts */}
          <Script
            id="nitropay-init"
            data-cfasync="false"
            dangerouslySetInnerHTML={{
              __html: `window.nitroAds=window.nitroAds||{createAd:function(){return new Promise(e=>{window.nitroAds.queue.push(["createAd",arguments,e])})},addUserToken:function(){window.nitroAds.queue.push(["addUserToken",arguments])},queue:[]};`,
            }}
          />
          <Script
            async
            src="https://s.nitropay.com/ads-2263.js"
            data-cfasync="false"
            data-spa="auto"
            data-log-level="silent"
            data-demo={
              process.env.NODE_ENV === "development" ? "false" : undefined
            }
          />
        </head>
        <body className="bg-primary-bg font-sans">
          <noscript>
            <div className="bg-primary-bg fixed inset-0 z-50 flex items-center justify-center">
              <div className="mx-auto max-w-md p-8 text-center">
                <Image
                  src="/logos/JBCL_Long_Transparent.webp"
                  alt="Jailbreak Changelogs"
                  width={256}
                  height={58}
                  className="mx-auto mb-6 h-24 w-auto"
                />
                <h1 className="text-primary-text mb-4 text-2xl font-bold">
                  JavaScript Required
                </h1>
                <p className="text-secondary-text mb-6">
                  This application requires JavaScript to function properly.
                  Please enable JavaScript in your browser settings and refresh
                  the page.
                </p>
                <p className="text-secondary-text text-sm">
                  After enabling JavaScript, please refresh this page.
                </p>
              </div>
            </div>
          </noscript>
          <CustomThemeProvider>
            <TwemojiProvider>
              <ThemeProvider>
                <QueryProvider>
                  <Toaster
                    position="top-right"
                    dir="ltr"
                    expand
                    offset={{
                      top: "calc(var(--header-height, 0px) + 16px)",
                      right: "var(--toast-runtime-right, 16px)",
                    }}
                  />
                  <MaintenanceBypass>
                    <NextTopLoader
                      color="var(--color-button-info)"
                      showSpinner={false}
                      shadow="0 0 10px var(--color-button-info),0 0 5px var(--color-button-info)"
                    />

                    <AuthProvider>
                      <RybbitIdentity />
                      <AdErrorBoundary>
                        <NitroBottomAnchor />
                        <NitroVideoPlayer />
                        <NitroAnchorCloseSupporterModal />
                        <NitroVideoCloseSupporterModal />
                      </AdErrorBoundary>
                      <div
                        id="main-layout"
                        className="flex min-h-screen flex-col"
                      >
                        <Suspense
                          fallback={
                            <div className="bg-primary-bg/75 border-border-card h-16 border-b backdrop-blur-lg" />
                          }
                        >
                          <HideOnAccessDenied>
                            <Header />
                          </HideOnAccessDenied>
                        </Suspense>
                        <main className="min-h-screen flex-1">
                          <NuqsAdapter>
                            <Suspense>{children}</Suspense>
                          </NuqsAdapter>
                        </main>
                        <HideOnAccessDenied>
                          <Footer
                            githubUrl={githubUrl}
                            versionInfo={
                              <Suspense fallback={<VersionInfoSkeleton />}>
                                <VersionInfoWrapper />
                              </Suspense>
                            }
                          />
                        </HideOnAccessDenied>
                      </div>
                    </AuthProvider>
                  </MaintenanceBypass>
                </QueryProvider>
              </ThemeProvider>
            </TwemojiProvider>
          </CustomThemeProvider>
        </body>
      </html>
    );
  }

  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Apply saved theme class before React hydrates to prevent FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'||t==='amoled'){document.documentElement.classList.add(t);}}catch(e){}})();`,
          }}
        />
        {/* Preconnect to external asset domains */}
        <link rel="preconnect" href="https://assets.jailbreakchangelogs.com" />
        <link
          rel="dns-prefetch"
          href="https://assets.jailbreakchangelogs.com"
        />
        {/* Rybbit Analytics */}
        {isRailwayDeployed && (
          <Script
            src="https://rybbit-api.jailbreakchangelogs.com/api/script.js"
            data-site-id="0d25b013fe3a"
            defer
          />
        )}
        {/* Nitro Pay Ads & GDPR - Always load script for consent prompts */}
        <Script
          id="nitropay-init"
          data-cfasync="false"
          dangerouslySetInnerHTML={{
            __html: `window.nitroAds=window.nitroAds||{createAd:function(){return new Promise(e=>{window.nitroAds.queue.push(["createAd",arguments,e])})},addUserToken:function(){window.nitroAds.queue.push(["addUserToken",arguments])},queue:[]};`,
          }}
        />
        <Script
          async
          src="https://s.nitropay.com/ads-2263.js"
          data-cfasync="false"
          data-spa="auto"
          data-log-level="silent"
          data-demo={
            process.env.NODE_ENV === "development" ? "false" : undefined
          }
        />
      </head>
      <body className="bg-primary-bg font-sans">
        <noscript>
          <div className="bg-primary-bg fixed inset-0 z-50 flex items-center justify-center">
            <div className="mx-auto max-w-md p-8 text-center">
              <Image
                src="/logos/JBCL_Long_Transparent.webp"
                alt="Jailbreak Changelogs"
                width={256}
                height={58}
                loading="eager"
                className="mx-auto mb-6 h-24 w-auto"
              />
              <h1 className="text-primary-text mb-4 text-2xl font-bold">
                JavaScript Required
              </h1>
              <p className="text-secondary-text mb-6">
                This application requires JavaScript to function properly.
                Please enable JavaScript in your browser settings and refresh
                the page.
              </p>
              <p className="text-secondary-text text-sm">
                After enabling JavaScript, please refresh this page.
              </p>
            </div>
          </div>
        </noscript>
        <CustomThemeProvider>
          <TwemojiProvider>
            <ThemeProvider>
              <QueryProvider>
                <Toaster
                  position="top-right"
                  dir="ltr"
                  expand
                  offset={{
                    top: "calc(var(--header-height, 0px) + 16px)",
                    right: "var(--toast-runtime-right, 16px)",
                  }}
                />
                <NextTopLoader
                  color="var(--color-button-info)"
                  showSpinner={false}
                  shadow="0 0 10px var(--color-button-info),0 0 5px var(--color-button-info)"
                />

                <AuthProvider>
                  <RybbitIdentity />
                  <NitroBottomAnchor />
                  <NitroVideoPlayer />
                  <NitroAnchorCloseSupporterModal />
                  <NitroVideoCloseSupporterModal />
                  <div className="flex min-h-screen flex-col">
                    <Suspense
                      fallback={
                        <div className="bg-primary-bg/75 border-border-card h-16 border-b backdrop-blur-lg" />
                      }
                    >
                      <HideOnAccessDenied>
                        <Header />
                      </HideOnAccessDenied>
                    </Suspense>
                    <main className="min-h-screen flex-1">
                      <NuqsAdapter>
                        <Suspense>{children}</Suspense>
                      </NuqsAdapter>
                    </main>
                    <HideOnAccessDenied>
                      <Footer
                        githubUrl={githubUrl}
                        versionInfo={
                          <Suspense fallback={<VersionInfoSkeleton />}>
                            <VersionInfoWrapper />
                          </Suspense>
                        }
                      />
                    </HideOnAccessDenied>
                  </div>
                </AuthProvider>
              </QueryProvider>
            </ThemeProvider>
          </TwemojiProvider>
        </CustomThemeProvider>
      </body>
    </html>
  );
}
