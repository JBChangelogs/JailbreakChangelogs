import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Script from "next/script";
import Image from "next/image";
import "./globals.css";
import Header from "@/components/Layout/Header";
import MaintenanceBypass from "@/components/Layout/MaintenanceBypass";
import Footer from "@/components/Layout/Footer";
import OfflineDetector from "@/components/OfflineDetector";
import { Toaster } from "react-hot-toast";
import NextTopLoader from "nextjs-toploader";
import AuthCheck from "@/components/Auth/AuthCheck";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import ThemeProvider from "@/components/ThemeProvider";
import { ThemeProvider as CustomThemeProvider } from "@/contexts/ThemeContext";
import SurveyProvider from "@/components/Survey/SurveyProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ConsentProviderWrapper } from "@/components/Providers/ConsentProviderWrapper";
import ConsentBannerWrapper from "@/components/Consent/ConsentBannerWrapper";
import CookieSettingsButton from "@/components/Consent/CookieSettingsButton";
import NitroAnchorCloseSupporterModal from "@/components/Ads/NitroAnchorCloseSupporterModal";
import NitroVideoPlayerCloseSupporterModal from "@/components/Ads/NitroVideoPlayerCloseSupporterModal";
import NitroBottomAnchor from "@/components/Ads/NitroBottomAnchor";
import NitroVideoPlayer from "@/components/Ads/NitroVideoPlayer";
import AdBlockRecovery from "@/components/Ads/AdBlockRecovery";
import {
  checkMaintenanceMode,
  getMaintenanceMetadata,
} from "@/utils/maintenance";
import { getWebsiteVersion, getGitHubUrl } from "@/utils/version";
import { Suspense } from "react";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import QueryProvider from "@/components/QueryProvider";
import { getDefaultConsent } from "@/utils/serverConsent";
import { getCurrentUser } from "@/utils/serverSession";

export const viewport: Viewport = {
  themeColor: "#FA2E26",
};

export async function generateMetadata(): Promise<Metadata> {
  const maintenanceMetadata = await getMaintenanceMetadata();
  if (maintenanceMetadata) {
    return maintenanceMetadata;
  }

  return {
    metadataBase: new URL("https://jailbreakchangelogs.xyz"),
    title: {
      template: "%s",
      default: "Latest Updates & Patch Notes | Changelogs",
    },
    description:
      "Stay up to date with the latest Roblox Jailbreak updates, patch notes, and changes. Track new features, bug fixes, and game improvements.",
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: "Latest Updates & Patch Notes | Changelogs",
      description:
        "Stay up to date with the latest Roblox Jailbreak updates, patch notes, and changes. Track new features, bug fixes, and game improvements.",
      images: [
        {
          url: "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Short_Christmas_Background.png",
          width: 1200,
          height: 630,
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
      title: "Latest Updates & Patch Notes | Changelogs",
      description:
        "Stay up to date with the latest Roblox Jailbreak updates, patch notes, and changes. Track new features, bug fixes, and game improvements.",
      images: [
        "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Short_Christmas_Background.png",
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
  const versionInfo = await getWebsiteVersion();
  const githubUrl = getGitHubUrl();
  const defaultConsent = await getDefaultConsent();

  // Check if user is a supporter before loading Nitro script
  const user = await getCurrentUser();
  const isSupporter =
    user?.premiumtype && user.premiumtype >= 2 && user.premiumtype <= 3;

  if (isMaintenanceMode) {
    return (
      <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <head>
          {/* Google Consent Mode v2 - MUST be before Google Analytics */}
          <Script
            id="google-consent-mode"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('consent', 'default', {
                  'analytics_storage': '${defaultConsent.analytics_storage}',
                  'wait_for_update': 500
                });
              `,
            }}
          />
          {/* Google Analytics */}
          <GoogleAnalytics gaId="G-729QSV9S7B" />
          {/* Microsoft Clarity - Placed in head per official documentation */}
          <Script
            id="microsoft-clarity-analytics"
            dangerouslySetInnerHTML={{
              __html: `
                (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_PROJECT}");
              `,
            }}
          />
          {/* Nitro Pay Ads - Only load if user is NOT a supporter */}
          {!isSupporter && (
            <>
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
                  process.env.NODE_ENV === "development" ? "true" : undefined
                }
              />
            </>
          )}
        </head>
        <body className="bg-primary-bg font-sans">
          <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID!} />
          <noscript>
            <div className="bg-primary-bg fixed inset-0 z-50 flex items-center justify-center">
              <div className="mx-auto max-w-md p-8 text-center">
                <Image
                  src="https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Short_Transparent.webp"
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
            <ConsentProviderWrapper>
              <CookieSettingsButton />
              <CustomThemeProvider>
                <ThemeProvider>
                  <QueryProvider>
                    <Toaster
                      position="bottom-right"
                      toastOptions={{
                        success: {
                          style: {
                            background: "var(--color-secondary-bg)",
                            color: "var(--color-primary-text)",
                            border: "1px solid var(--color-border-primary)",
                            borderRadius: "16px",
                            backdropFilter: "blur(20px)",
                            WebkitBackdropFilter: "blur(20px)",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                          },
                          iconTheme: {
                            primary: "var(--color-button-info)",
                            secondary: "var(--color-secondary-bg)",
                          },
                        },
                        error: {
                          style: {
                            background: "var(--color-secondary-bg)",
                            color: "var(--color-primary-text)",
                            border: "1px solid var(--color-border-primary)",
                            borderRadius: "16px",
                            backdropFilter: "blur(20px)",
                            WebkitBackdropFilter: "blur(20px)",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                          },
                          iconTheme: {
                            primary: "var(--color-button-info)",
                            secondary: "var(--color-secondary-bg)",
                          },
                        },
                        loading: {
                          style: {
                            background: "var(--color-secondary-bg)",
                            color: "var(--color-primary-text)",
                            border: "1px solid var(--color-border-primary)",
                            borderRadius: "16px",
                            backdropFilter: "blur(20px)",
                            WebkitBackdropFilter: "blur(20px)",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                          },
                          iconTheme: {
                            primary: "var(--color-button-info)",
                            secondary: "var(--color-secondary-bg)",
                          },
                        },
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
                      <OfflineDetector />
                      <AuthCheck />
                      <AuthProvider>
                        <NitroBottomAnchor />
                        <NitroVideoPlayer />
                        <NitroAnchorCloseSupporterModal />
                        <NitroVideoPlayerCloseSupporterModal />
                        <SurveyProvider>
                          <div
                            id="main-layout"
                            className="flex min-h-screen flex-col"
                          >
                            <Suspense
                              fallback={
                                <div className="border-secondary-text bg-secondary-bg h-16 border-b" />
                              }
                            >
                              <Header />
                            </Suspense>
                            <Suspense>
                              <main className="flex-1">{children}</main>
                            </Suspense>
                            <Footer
                              githubUrl={githubUrl}
                              versionInfo={versionInfo}
                            />
                          </div>
                        </SurveyProvider>
                      </AuthProvider>
                    </MaintenanceBypass>
                  </QueryProvider>
                </ThemeProvider>
              </CustomThemeProvider>
              <ConsentBannerWrapper />
            </ConsentProviderWrapper>
          </AppRouterCacheProvider>
          {/* ABP Recovery Prompt - Only load if user is NOT a supporter */}
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
        {/* Google Consent Mode v2 - MUST be before Google Analytics */}
        <Script
          id="google-consent-mode"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                'analytics_storage': '${defaultConsent.analytics_storage}',
                'wait_for_update': 500
              });
            `,
          }}
        />
        {/* Google Analytics */}
        <GoogleAnalytics gaId="G-729QSV9S7B" />
        {/* Microsoft Clarity - Placed in head per official documentation */}
        <Script
          id="microsoft-clarity-analytics"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_PROJECT}");
            `,
          }}
        />
        {/* Nitro Pay Ads - Only load if user is NOT a supporter */}
        {!isSupporter && (
          <>
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
                process.env.NODE_ENV === "development" ? "true" : undefined
              }
            />
          </>
        )}
      </head>
      <body className="bg-primary-bg font-sans">
        <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID!} />
        <noscript>
          <div className="bg-primary-bg fixed inset-0 z-50 flex items-center justify-center">
            <div className="mx-auto max-w-md p-8 text-center">
              <Image
                src="https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Short_Transparent.webp"
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
          <ConsentProviderWrapper>
            <CookieSettingsButton />
            <CustomThemeProvider>
              <ThemeProvider>
                <QueryProvider>
                  <Toaster
                    position="bottom-right"
                    toastOptions={{
                      success: {
                        style: {
                          background: "var(--color-secondary-bg)",
                          color: "var(--color-primary-text)",
                          border: "1px solid var(--color-border-primary)",
                          borderRadius: "16px",
                          backdropFilter: "blur(20px)",
                          WebkitBackdropFilter: "blur(20px)",
                          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                        },
                        iconTheme: {
                          primary: "var(--color-button-info)",
                          secondary: "var(--color-secondary-bg)",
                        },
                      },
                      error: {
                        style: {
                          background: "var(--color-secondary-bg)",
                          color: "var(--color-primary-text)",
                          border: "1px solid var(--color-border-primary)",
                          borderRadius: "16px",
                          backdropFilter: "blur(20px)",
                          WebkitBackdropFilter: "blur(20px)",
                          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                        },
                        iconTheme: {
                          primary: "var(--color-button-info)",
                          secondary: "var(--color-secondary-bg)",
                        },
                      },
                      loading: {
                        style: {
                          background: "var(--color-secondary-bg)",
                          color: "var(--color-primary-text)",
                          border: "1px solid var(--color-border-primary)",
                          borderRadius: "16px",
                          backdropFilter: "blur(20px)",
                          WebkitBackdropFilter: "blur(20px)",
                          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                        },
                        iconTheme: {
                          primary: "var(--color-button-info)",
                          secondary: "var(--color-secondary-bg)",
                        },
                      },
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
                  <OfflineDetector />
                  <AuthCheck />
                  <AuthProvider>
                    <NitroBottomAnchor />
                    <NitroVideoPlayer />
                    <NitroAnchorCloseSupporterModal />
                    <NitroVideoPlayerCloseSupporterModal />
                    <SurveyProvider>
                      <div className="flex min-h-screen flex-col">
                        <Suspense
                          fallback={
                            <div className="border-secondary-text bg-secondary-bg h-16 border-b" />
                          }
                        >
                          <Header />
                        </Suspense>
                        <Suspense>
                          <main className="flex-1">{children}</main>
                        </Suspense>
                        <Footer
                          githubUrl={githubUrl}
                          versionInfo={versionInfo}
                        />
                      </div>
                    </SurveyProvider>
                  </AuthProvider>
                </QueryProvider>
              </ThemeProvider>
            </CustomThemeProvider>
            <ConsentBannerWrapper />
          </ConsentProviderWrapper>
        </AppRouterCacheProvider>
        {/* ABP Recovery Prompt - Only load if user is NOT a supporter */}
        <AdBlockRecovery isSupporter={!!isSupporter} />
      </body>
    </html>
  );
}
