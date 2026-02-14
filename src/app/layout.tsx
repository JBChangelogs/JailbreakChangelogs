import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Script from "next/script";
import Image from "next/image";
import "./globals.css";
import Header from "@/components/Layout/Header";
import MaintenanceBypass from "@/components/Layout/MaintenanceBypass";
import Footer from "@/components/Layout/Footer";
import VersionInfoWrapper from "@/components/Layout/VersionInfoWrapper";
import VersionInfoSkeleton from "@/components/Layout/VersionInfoSkeleton";
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";
import AuthCheck from "@/components/Auth/AuthCheck";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import ThemeProvider from "@/components/ThemeProvider";
import { ThemeProvider as CustomThemeProvider } from "@/contexts/ThemeContext";
import SurveyProvider from "@/components/Survey/SurveyProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import NitroAnchorCloseSupporterModal from "@/components/Ads/NitroAnchorCloseSupporterModal";
import NitroBottomAnchor from "@/components/Ads/NitroBottomAnchor";
import NitroVideoPlayer from "@/components/Ads/NitroVideoPlayer";
import AdErrorBoundary from "@/components/Ads/AdErrorBoundary";
import AdBlockRecovery from "@/components/Ads/AdBlockRecovery";
import AdBlockPrompt from "@/components/Ads/AdBlockPrompt";
import UmamiIdentity from "@/components/Analytics/UmamiIdentity";
import {
  checkMaintenanceMode,
  getMaintenanceMetadata,
} from "@/utils/maintenance";
import { getGitHubUrl } from "@/utils/version";
import { Suspense } from "react";
import QueryProvider from "@/components/QueryProvider";
import { getCurrentUser } from "@/utils/serverSession";

export const viewport: Viewport = {
  themeColor: "#2462cd",
};

export async function generateMetadata(): Promise<Metadata> {
  const maintenanceMetadata = await getMaintenanceMetadata();
  if (maintenanceMetadata) {
    return maintenanceMetadata;
  }

  return {
    metadataBase: new URL("https://jailbreakchangelogs.xyz"),
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
          url: "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_Embed_Graphic.png",
          width: 2400,
          height: 1260,
          alt: "Jailbreak Changelogs Banner",
        },
      ],
      type: "website",
      locale: "en_US",
      siteName: "Jailbreak Changelogs",
      url: "https://jailbreakchangelogs.xyz",
    },
    twitter: {
      card: "summary_large_image",
      title: "Jailbreak Changelogs",
      description:
        "Your all-in-one Roblox Jailbreak platform for changelogs and game update tracking, values, trading, inventory lookups, OG item tracking, dupe detection, and more.",
      images: [
        "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_Embed_Graphic.png",
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

  // Check if user is a supporter before loading Nitro script
  const user = await getCurrentUser();
  const isSupporter =
    user?.premiumtype && user.premiumtype >= 2 && user.premiumtype <= 3;

  if (isMaintenanceMode) {
    return (
      <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <head>
          {/* Umami Analytics */}
          <Script
            defer
            src={`https://umami.jailbreakchangelogs.xyz${
              process.env.NEXT_PUBLIC_UMAMI_SCRIPT_NAME
                ? process.env.NEXT_PUBLIC_UMAMI_SCRIPT_NAME.startsWith("/")
                  ? process.env.NEXT_PUBLIC_UMAMI_SCRIPT_NAME
                  : `/${process.env.NEXT_PUBLIC_UMAMI_SCRIPT_NAME}`
                : "/assets/js/app.js"
            }`}
            data-website-id="91439a73-21f8-4129-961e-5de4267a08db"
            data-domains="jailbreakchangelogs.xyz"
          />
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
                  src="/logos/JBCL_Short_Transparent.webp"
                  alt="Jailbreak Changelogs"
                  width={96}
                  height={96}
                  className="mx-auto mb-6 h-24 w-24"
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
          <AppRouterCacheProvider options={{ enableCssLayer: true }}>
            <CustomThemeProvider>
              <ThemeProvider>
                <QueryProvider>
                  <Toaster
                    position="top-center"
                    toastOptions={{
                      className: "!mt-[calc(var(--header-height,0px)+16px)]",
                    }}
                  />
                  <MaintenanceBypass>
                    <NextTopLoader
                      color="var(--color-button-info)"
                      initialPosition={0.08}
                      crawlSpeed={200}
                      height={3}
                      crawl={true}
                      showSpinner={false}
                      easing="ease"
                      speed={200}
                      shadow="0 0 10px var(--color-button-info),0 0 5px var(--color-button-info)"
                      zIndex={1600}
                    />

                    <AuthCheck />
                    <AuthProvider>
                      <UmamiIdentity />
                      <AdErrorBoundary>
                        <NitroBottomAnchor />
                        <NitroVideoPlayer />
                        <NitroAnchorCloseSupporterModal />
                      </AdErrorBoundary>
                      <SurveyProvider>
                        <div
                          id="main-layout"
                          className="flex min-h-screen flex-col"
                        >
                          <Suspense
                            fallback={
                              <div className="bg-primary-bg/75 border-border-card h-16 border-b backdrop-blur-lg" />
                            }
                          >
                            <Header />
                          </Suspense>
                          <main className="min-h-screen flex-1">
                            <Suspense>{children}</Suspense>
                          </main>
                          <Footer
                            githubUrl={githubUrl}
                            versionInfo={
                              <Suspense fallback={<VersionInfoSkeleton />}>
                                <VersionInfoWrapper />
                              </Suspense>
                            }
                          />
                        </div>
                      </SurveyProvider>
                    </AuthProvider>
                  </MaintenanceBypass>
                </QueryProvider>
              </ThemeProvider>
              {/* Ad Block Prompt UI - Only shown to non-supporters when ad blocking is detected */}
              <AdBlockPrompt />
            </CustomThemeProvider>
          </AppRouterCacheProvider>
          {/* Ad Block Detection Script - Only load if user is NOT a supporter */}
          <AdBlockRecovery isSupporter={!!isSupporter} />
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        {/* Preconnect to external asset domains */}
        <link rel="preconnect" href="https://assets.jailbreakchangelogs.xyz" />
        <link
          rel="dns-prefetch"
          href="https://assets.jailbreakchangelogs.xyz"
        />
        {/* Umami Analytics */}
        <Script
          defer
          src={`https://umami.jailbreakchangelogs.xyz${
            process.env.NEXT_PUBLIC_UMAMI_SCRIPT_NAME
              ? process.env.NEXT_PUBLIC_UMAMI_SCRIPT_NAME.startsWith("/")
                ? process.env.NEXT_PUBLIC_UMAMI_SCRIPT_NAME
                : `/${process.env.NEXT_PUBLIC_UMAMI_SCRIPT_NAME}`
              : "/assets/js/app.js"
          }`}
          data-website-id="91439a73-21f8-4129-961e-5de4267a08db"
          data-domains="jailbreakchangelogs.xyz"
        />
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
                width={96}
                height={96}
                className="mx-auto mb-6 h-24 w-24"
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
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <CustomThemeProvider>
            <ThemeProvider>
              <QueryProvider>
                <Toaster
                  position="top-center"
                  toastOptions={{
                    className: "!mt-[calc(var(--header-height,0px)+16px)]",
                  }}
                />
                <NextTopLoader
                  color="var(--color-button-info)"
                  initialPosition={0.08}
                  crawlSpeed={200}
                  height={3}
                  crawl={true}
                  showSpinner={false}
                  easing="ease"
                  speed={200}
                  shadow="0 0 10px var(--color-button-info),0 0 5px var(--color-button-info)"
                  zIndex={1600}
                />

                <AuthCheck />
                <AuthProvider>
                  <UmamiIdentity />
                  <NitroBottomAnchor />
                  <NitroVideoPlayer />
                  <NitroAnchorCloseSupporterModal />
                  <SurveyProvider>
                    <div className="flex min-h-screen flex-col">
                      <Suspense
                        fallback={
                          <div className="bg-primary-bg/75 border-border-card h-16 border-b backdrop-blur-lg" />
                        }
                      >
                        <Header />
                      </Suspense>
                      <main className="min-h-screen flex-1">
                        <Suspense>{children}</Suspense>
                      </main>
                      <Footer
                        githubUrl={githubUrl}
                        versionInfo={
                          <Suspense fallback={<VersionInfoSkeleton />}>
                            <VersionInfoWrapper />
                          </Suspense>
                        }
                      />
                    </div>
                  </SurveyProvider>
                </AuthProvider>
              </QueryProvider>
            </ThemeProvider>
            {/* Ad Block Prompt UI - Only shown to non-supporters when ad blocking is detected */}
            <AdBlockPrompt />
          </CustomThemeProvider>
        </AppRouterCacheProvider>
        {/* Ad Block Detection Script - Only load if user is NOT a supporter */}
        <AdBlockRecovery isSupporter={!!isSupporter} />
      </body>
    </html>
  );
}
