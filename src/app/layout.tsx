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
import NitroAdsNavigationHandler from "@/components/Layout/NitroAdsNavigationHandler";
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
    user?.premiumtype && user.premiumtype >= 1 && user.premiumtype <= 3;

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
                  'ad_user_data': '${defaultConsent.ad_user_data}',
                  'ad_personalization': '${defaultConsent.ad_personalization}',
                  'ad_storage': '${defaultConsent.ad_storage}',
                  'analytics_storage': '${defaultConsent.analytics_storage}',
                  'wait_for_update': 500
                });
              `,
            }}
          />
          {/* Google Analytics */}
          <GoogleAnalytics gaId="G-729QSV9S7B" />
          {/* Nitro Pay Ads - Only load if user is NOT a supporter */}
          {!isSupporter && (
            <>
              <Script
                id="nitropay-init"
                strategy="afterInteractive"
                data-cfasync="false"
                dangerouslySetInnerHTML={{
                  __html: `window.nitroAds=window.nitroAds||{createAd:function(){return new Promise(e=>{window.nitroAds.queue.push(["createAd",arguments,e])})},addUserToken:function(){window.nitroAds.queue.push(["addUserToken",arguments])},queue:[]};`,
                }}
              />
              <Script
                async
                src="https://s.nitropay.com/ads-2263.js"
                strategy="afterInteractive"
                data-cfasync="false"
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
                        <Suspense>
                          <NitroAdsNavigationHandler />
                        </Suspense>
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
          <Script
            id="microsoft-clarity-analytics"
            strategy="afterInteractive"
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
          {/* ABP Recovery Prompt - Only load if user is NOT a supporter */}
          {!isSupporter && (
            <Script
              id="nitropay-abp-recovery-prompt"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `(function(){let a={bgColor:"#fff",fgColor:"#1b1b1b",linkBgColor:"#0069c0",linkFgColor:"#fff",logo:"",dismissable:!1,interval:3600,delay:0,sponsorUrl:"",sponsorButton:"Purchase a Subscription",callout:"Please disable your browser's ad-blocker",appeal:\`Without advertising, this website wouldn't exist.\`};a={logo:"https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Transparent_Christmas.png",bgColor:"#fff",fgColor:"#1b1b1b",linkBgColor:"#0069c0",linkFgColor:"#fff",dismissable:!1,delay:0,interval:20,sponsorUrl:"https://jailbreakchangelogs.xyz/supporting",sponsorButton:"Become A Supporter",callout:"Support the JBCL Project",appeal:"Please whitelist our site in your ad blocker, or become a supporter to browse ad‑free and unlock extra perks."};var b=new function(){function a(){if(window.nitroAds&&!0===window.nitroAds.abp)return void e();var b=new Image;b.onerror=()=>{d++,3>d?setTimeout(a,250):c()},b.onload=()=>{const a=document.createElement("canvas");a.style.pointerEvents="none";let d=document.body.appendChild(a).getContext("2d");if(d){d.drawImage(b,0,0);const f=d.getImageData(0,0,1,1);if(data=f.data,a.remove(),255!=data[0])return void c();e()}},b.crossOrigin="anonymous",b.src="https://s.nitropay.com/2.gif?"+Math.random()+"&adslot="}function c(){b.blocking=!0;try{localStorage.setItem("np.lastBlocked",new Date().getTime())}catch(a){}document.dispatchEvent&&window.CustomEvent&&document.dispatchEvent(new CustomEvent("np.detect",{detail:{blocking:b.blocking}}))}this.blocking=!1;var d=0,e=function(){try{var a=localStorage.getItem("np.lastBlocked");a&&(localStorage.removeItem("np.lastBlocked"),localStorage.setItem("np.unblocked",new Date().getTime()-+a))}catch(a){}};setTimeout(a,5e3)};let c=null;const d=()=>{const b=\`; \${document.cookie}\`,d=b.split(\`; npabp=\`);if(2===d.length&&a.dismissable)return;let e="";if(a.interval){const b=new Date;b.setTime(b.getTime()+1e3*a.interval),e=\`expires=\${b.toGMTString()};\`}document.cookie=\`npabp=1; \${e} path=/;\`;const f=window.matchMedia("(max-width: 768px)").matches;c=document.createElement("div"),c.style.background="rgba(78, 78, 78, 0.6)",c.style.position="fixed",c.style.display="flex",c.style.alignItems="center",c.style.justifyContent="center",c.style.top=0,c.style.left=0,c.style.right=0,c.style.bottom=0,c.style.zIndex=2147483647,a.dismissable&&c.addEventListener("click",a=>{c&&a.target==c&&c.parentNode&&c.parentNode.removeChild(c)});const g=document.createElement("div");g.style.width=f?"300px":"720px",g.style.boxShadow="0px 0px 8px 0px rgba(52, 52, 52, 0.6)",g.style.borderRadius="2px",g.style.overflow="hidden",g.style.fontSize="0",g.style.display="flex",c.appendChild(g);const h=document.createElement("div");if(h.style.background=a.bgColor,h.style.width=f?"300px":"720px",h.style.flex=f?"0 0 300px":"0 0 720px",h.style.display="inline-block",h.style.textAlign="center",h.style.padding=f?"15px":"30px 0",h.style.boxSizing="border-box",h.style.position="relative",g.appendChild(h),a.dismissable){const b=document.createElement("div");b.innerHTML=\`<svg style=\"fill:\${a.linkBgColor};\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\"><path d=\"M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z\"/></svg>\`,b.style.position="absolute",b.style.width="24px",b.style.height="24px",b.style.top="10px",b.style.right="10px",b.style.cursor="pointer",h.appendChild(b),b.addEventListener("click",()=>{c&&c.parentNode&&c.parentNode.removeChild(c)})}if(a.logo){const b=document.createElement("img");b.style.display="inline-block",b.style.maxHeight="50px",b.style.maxWidth="600px",b.style.marginBottom=f?"6px":"15px",b.src=a.logo,h.appendChild(b)}const i=document.createElement("span");i.style.display="block",i.style.fontSize=f?"16px":"20px",i.style.fontWeight="bold",i.style.fontFamily="\\"Roboto\\", Helvetica, sans-serif",i.style.marginBottom=f?"6px":"15px",i.style.color=a.fgColor,i.innerText=a.callout,h.appendChild(i);const j=document.createElement("span");j.style.display="block",j.style.fontSize=f?"14px":"16px",j.style.fontWeight="400",j.style.fontFamily="\\"Roboto\\", Helvetica, sans-serif",j.style.marginBottom=f?"15px":"30px",j.style.color=a.fgColor,j.innerText=a.appeal,h.appendChild(j);const k=document.createElement("div");if(k.style.display="flex",k.style.justifyContent="center",k.style.alignItems="center",h.appendChild(k),a.sponsorUrl){const b=document.createElement("span");b.style.display="inline-block",b.style.cursor="pointer",b.style.borderRadius="2px",b.style.fontSize=f?"14px":"16px",b.style.fontWeight="500",b.style.fontFamily="\\"Roboto\\", Helvetica, sans-serif",b.style.padding=f?"5px 10px":"10px 18px",b.style.marginRight=f?"5px":"20px",b.style.backgroundColor=a.linkBgColor,b.style.color=a.linkFgColor,b.innerText=a.sponsorButton,b.addEventListener("click",b=>{b.preventDefault(),window.location=a.sponsorUrl}),k.appendChild(b)}const l=document.createElement("span");l.style.display="inline-block",l.style.cursor="pointer",l.style.borderRadius="2px",l.style.fontSize=f?"14px":"16px",l.style.fontWeight="500",l.style.fontFamily="\\"Roboto\\", Helvetica, sans-serif",l.style.padding=f?"5px 10px":"10px 18px",a.sponsorUrl&&(l.style.marginLeft=f?"5px":"20px"),l.style.backgroundColor=a.linkBgColor,l.style.color=a.linkFgColor,l.innerText="Need Help?",k.appendChild(l);const m=b=>{if(p.innerHTML="",b.gif){const a=document.createElement("img");a.src=\`https://storage.googleapis.com/np-assets/\${b.id}.gif\`,a.style.width=f?"100px":"200px",a.style.float="right",a.style.border="1px solid rgba(134, 134, 134, 0.31)",a.style.borderRadius="4px",a.style.margin="0 0 10px 15px",p.appendChild(a)}const c=document.createElement("span");c.style.display="block",c.style.fontSize="16px",c.style.fontWeight="bold",c.style.fontFamily="\\"Roboto\\", Helvetica, sans-serif",c.style.marginBottom="15px",c.style.color=a.fgColor,c.innerText=b.name,p.appendChild(c),b.steps.forEach(b=>{const c=document.createElement("span");c.style.display="block",c.style.fontSize="14px",c.style.fontWeight="regular",c.style.fontFamily="\\"Roboto\\", Helvetica, sans-serif",c.style.marginBottom="3px",c.style.color=a.fgColor,c.innerText=\`- \${b}\`,p.appendChild(c)});const d=document.createElement("span");d.style.display="inline-block",d.style.cursor="pointer",d.style.borderRadius="2px",d.style.fontSize="14px",d.style.fontWeight="500",d.style.fontFamily="\\"Roboto\\", Helvetica, sans-serif",d.style.padding="6px 10px",d.style.marginTop="30px",d.style.marginRight="5px",d.style.backgroundColor=a.linkBgColor,d.style.color=a.linkFgColor,d.innerText="Refresh Page",d.addEventListener("click",a=>{a.preventDefault(),window.location.reload()}),p.appendChild(d);const e=document.createElement("span");e.style.display="inline-block",e.style.cursor="pointer",e.style.borderRadius="2px",e.style.fontSize="14px",e.style.fontWeight="500",e.style.fontFamily="\\"Roboto\\", Helvetica, sans-serif",e.style.padding="6px 10px",e.style.marginTop="6px",e.style.backgroundColor=a.linkBgColor,e.style.color=a.linkFgColor,e.innerText="Back to Main",e.addEventListener("click",a=>{a.preventDefault(),h.style.marginLeft="0",g.style.height="auto",n.style.height="0"}),p.appendChild(e)};l.addEventListener("click",b=>{b.preventDefault(),h.style.marginLeft=f?"-300px":"-720px",g.style.height=f?"80vh":"420px",n.style.height=f?"80vh":"420px",fetch(\`https://storage.googleapis.com/np-assets/manifest.json?v=b2\`).then(a=>a.json()).then(c=>{o.innerHTML="";const d=document.createElement("span");if(d.style.display="block",d.style.fontSize="15px",d.style.fontWeight="bold",d.style.fontFamily="\\"Roboto\\", Helvetica, sans-serif",d.style.marginBottom=f?"6px":"15px",d.style.color=a.linkFgColor,d.innerText="Which ad blocker do you use?",o.appendChild(d),f){const a=document.createElement("select");a.style.fontSize="14px",a.addEventListener("change",a=>{const d=a.target.options[a.target.selectedIndex].value,e=c.find(a=>a.id==d);m(e)}),o.appendChild(a),c.forEach(b=>{const c=document.createElement("option");c.value=b.id,c.textContent=b.name,a.appendChild(c)})}else c.forEach(b=>{const c=document.createElement("span");c.style.display="block",c.style.cursor="pointer",c.style.fontSize="14px",c.style.fontWeight="regular",c.style.fontFamily="\\"Roboto\\", Helvetica, sans-serif",c.style.padding="4px 0px",c.style.backgroundColor=a.linkBgColor,c.style.color=a.linkFgColor,c.style.opacity="0.8",c.style.borderBottom="1px solid rgba(218, 218, 218, 0.14)",c.innerText=b.name,o.appendChild(c),c.addEventListener("click",a=>{a.preventDefault(),m(b)})});0<c.length&&m(c[0])})});const n=document.createElement("div");n.style.background=a.bgColor,n.style.display="flex",n.style.width=f?"300px":"720px",n.style.height="50px",n.style.flex=f?"300px":"0 0 720px",n.style.textAlign="left",n.style.padding="0",n.style.whiteSpace="normal",f&&(n.style.flexDirection="column"),g.appendChild(n);const o=document.createElement("div");o.style.background=a.linkBgColor,o.style.flex=f?"0 0 110px":"0 0 200px",o.style.textAlign="left",o.style.padding=f?"15px":"30px",o.style.overflow="auto",n.appendChild(o);const p=document.createElement("div");p.style.background=a.bgColor,p.style.flex="1",p.style.textAlign="left",p.style.padding=f?"15px":"30px",p.style.overflow="auto",n.appendChild(p),null!==document.body&&document.body.appendChild(c)};document.addEventListener("np.detect",b=>{b.detail.blocking?setTimeout(d,a.delay):c&&c.parentNode&&c.parentNode.removeChild(c)})})();`,
              }}
            />
          )}
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
                'ad_user_data': '${defaultConsent.ad_user_data}',
                'ad_personalization': '${defaultConsent.ad_personalization}',
                'ad_storage': '${defaultConsent.ad_storage}',
                'analytics_storage': '${defaultConsent.analytics_storage}',
                'wait_for_update': 500
              });
            `,
          }}
        />
        {/* Google Analytics */}
        <GoogleAnalytics gaId="G-729QSV9S7B" />
        {/* Nitro Pay Ads - Only load if user is NOT a supporter */}
        {!isSupporter && (
          <>
            <Script
              id="nitropay-init"
              strategy="afterInteractive"
              data-cfasync="false"
              dangerouslySetInnerHTML={{
                __html: `window.nitroAds=window.nitroAds||{createAd:function(){return new Promise(e=>{window.nitroAds.queue.push(["createAd",arguments,e])})},addUserToken:function(){window.nitroAds.queue.push(["addUserToken",arguments])},queue:[]};`,
              }}
            />
            <Script
              async
              src="https://s.nitropay.com/ads-2263.js"
              strategy="afterInteractive"
              data-cfasync="false"
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
                    <Suspense>
                      <NitroAdsNavigationHandler />
                    </Suspense>
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
        <Script
          id="microsoft-clarity-analytics"
          strategy="afterInteractive"
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
        {/* ABP Recovery Prompt - Only load if user is NOT a supporter */}
        {!isSupporter && (
          <Script
            id="nitropay-abp-recovery-prompt"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(){let a={bgColor:"#fff",fgColor:"#1b1b1b",linkBgColor:"#0069c0",linkFgColor:"#fff",logo:"",dismissable:!1,interval:3600,delay:0,sponsorUrl:"",sponsorButton:"Purchase a Subscription",callout:"Please disable your browser's ad-blocker",appeal:\`Without advertising, this website wouldn't exist.\`};a={logo:"https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Transparent_Christmas.png",bgColor:"#fff",fgColor:"#1b1b1b",linkBgColor:"#0069c0",linkFgColor:"#fff",dismissable:!1,delay:0,interval:20,sponsorUrl:"https://jailbreakchangelogs.xyz/supporting",sponsorButton:"Become A Supporter",callout:"Support the JBCL Project",appeal:"Please whitelist our site in your ad blocker, or become a supporter to browse ad‑free and unlock extra perks."};var b=new function(){function a(){if(window.nitroAds&&!0===window.nitroAds.abp)return void e();var b=new Image;b.onerror=()=>{d++,3>d?setTimeout(a,250):c()},b.onload=()=>{const a=document.createElement("canvas");a.style.pointerEvents="none";let d=document.body.appendChild(a).getContext("2d");if(d){d.drawImage(b,0,0);const f=d.getImageData(0,0,1,1);if(data=f.data,a.remove(),255!=data[0])return void c();e()}},b.crossOrigin="anonymous",b.src="https://s.nitropay.com/2.gif?"+Math.random()+"&adslot="}function c(){b.blocking=!0;try{localStorage.setItem("np.lastBlocked",new Date().getTime())}catch(a){}document.dispatchEvent&&window.CustomEvent&&document.dispatchEvent(new CustomEvent("np.detect",{detail:{blocking:b.blocking}}))}this.blocking=!1;var d=0,e=function(){try{var a=localStorage.getItem("np.lastBlocked");a&&(localStorage.removeItem("np.lastBlocked"),localStorage.setItem("np.unblocked",new Date().getTime()-+a))}catch(a){}};setTimeout(a,5e3)};let c=null;const d=()=>{const b=\`; \${document.cookie}\`,d=b.split(\`; npabp=\`);if(2===d.length&&a.dismissable)return;let e="";if(a.interval){const b=new Date;b.setTime(b.getTime()+1e3*a.interval),e=\`expires=\${b.toGMTString()};\`}document.cookie=\`npabp=1; \${e} path=/;\`;const f=window.matchMedia("(max-width: 768px)").matches;c=document.createElement("div"),c.style.background="rgba(78, 78, 78, 0.6)",c.style.position="fixed",c.style.display="flex",c.style.alignItems="center",c.style.justifyContent="center",c.style.top=0,c.style.left=0,c.style.right=0,c.style.bottom=0,c.style.zIndex=2147483647,a.dismissable&&c.addEventListener("click",a=>{c&&a.target==c&&c.parentNode&&c.parentNode.removeChild(c)});const g=document.createElement("div");g.style.width=f?"300px":"720px",g.style.boxShadow="0px 0px 8px 0px rgba(52, 52, 52, 0.6)",g.style.borderRadius="2px",g.style.overflow="hidden",g.style.fontSize="0",g.style.display="flex",c.appendChild(g);const h=document.createElement("div");if(h.style.background=a.bgColor,h.style.width=f?"300px":"720px",h.style.flex=f?"0 0 300px":"0 0 720px",h.style.display="inline-block",h.style.textAlign="center",h.style.padding=f?"15px":"30px 0",h.style.boxSizing="border-box",h.style.position="relative",g.appendChild(h),a.dismissable){const b=document.createElement("div");b.innerHTML=\`<svg style=\"fill:\${a.linkBgColor};\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\"><path d=\"M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z\"/></svg>\`,b.style.position="absolute",b.style.width="24px",b.style.height="24px",b.style.top="10px",b.style.right="10px",b.style.cursor="pointer",h.appendChild(b),b.addEventListener("click",()=>{c&&c.parentNode&&c.parentNode.removeChild(c)})}if(a.logo){const b=document.createElement("img");b.style.display="inline-block",b.style.maxHeight="50px",b.style.maxWidth="600px",b.style.marginBottom=f?"6px":"15px",b.src=a.logo,h.appendChild(b)}const i=document.createElement("span");i.style.display="block",i.style.fontSize=f?"16px":"20px",i.style.fontWeight="bold",i.style.fontFamily="\\"Roboto\\", Helvetica, sans-serif",i.style.marginBottom=f?"6px":"15px",i.style.color=a.fgColor,i.innerText=a.callout,h.appendChild(i);const j=document.createElement("span");j.style.display="block",j.style.fontSize=f?"14px":"16px",j.style.fontWeight="400",j.style.fontFamily="\\"Roboto\\", Helvetica, sans-serif",j.style.marginBottom=f?"15px":"30px",j.style.color=a.fgColor,j.innerText=a.appeal,h.appendChild(j);const k=document.createElement("div");if(k.style.display="flex",k.style.justifyContent="center",k.style.alignItems="center",h.appendChild(k),a.sponsorUrl){const b=document.createElement("span");b.style.display="inline-block",b.style.cursor="pointer",b.style.borderRadius="2px",b.style.fontSize=f?"14px":"16px",b.style.fontWeight="500",b.style.fontFamily="\\"Roboto\\", Helvetica, sans-serif",b.style.padding=f?"5px 10px":"10px 18px",b.style.marginRight=f?"5px":"20px",b.style.backgroundColor=a.linkBgColor,b.style.color=a.linkFgColor,b.innerText=a.sponsorButton,b.addEventListener("click",b=>{b.preventDefault(),window.location=a.sponsorUrl}),k.appendChild(b)}const l=document.createElement("span");l.style.display="inline-block",l.style.cursor="pointer",l.style.borderRadius="2px",l.style.fontSize=f?"14px":"16px",l.style.fontWeight="500",l.style.fontFamily="\\"Roboto\\", Helvetica, sans-serif",l.style.padding=f?"5px 10px":"10px 18px",a.sponsorUrl&&(l.style.marginLeft=f?"5px":"20px"),l.style.backgroundColor=a.linkBgColor,l.style.color=a.linkFgColor,l.innerText="Need Help?",k.appendChild(l);const m=b=>{if(p.innerHTML="",b.gif){const a=document.createElement("img");a.src=\`https://storage.googleapis.com/np-assets/\${b.id}.gif\`,a.style.width=f?"100px":"200px",a.style.float="right",a.style.border="1px solid rgba(134, 134, 134, 0.31)",a.style.borderRadius="4px",a.style.margin="0 0 10px 15px",p.appendChild(a)}const c=document.createElement("span");c.style.display="block",c.style.fontSize="16px",c.style.fontWeight="bold",c.style.fontFamily="\\"Roboto\\", Helvetica, sans-serif",c.style.marginBottom="15px",c.style.color=a.fgColor,c.innerText=b.name,p.appendChild(c),b.steps.forEach(b=>{const c=document.createElement("span");c.style.display="block",c.style.fontSize="14px",c.style.fontWeight="regular",c.style.fontFamily="\\"Roboto\\", Helvetica, sans-serif",c.style.marginBottom="3px",c.style.color=a.fgColor,c.innerText=\`- \${b}\`,p.appendChild(c)});const d=document.createElement("span");d.style.display="inline-block",d.style.cursor="pointer",d.style.borderRadius="2px",d.style.fontSize="14px",d.style.fontWeight="500",d.style.fontFamily="\\"Roboto\\", Helvetica, sans-serif",d.style.padding="6px 10px",d.style.marginTop="30px",d.style.marginRight="5px",d.style.backgroundColor=a.linkBgColor,d.style.color=a.linkFgColor,d.innerText="Refresh Page",d.addEventListener("click",a=>{a.preventDefault(),window.location.reload()}),p.appendChild(d);const e=document.createElement("span");e.style.display="inline-block",e.style.cursor="pointer",e.style.borderRadius="2px",e.style.fontSize="14px",e.style.fontWeight="500",e.style.fontFamily="\\"Roboto\\", Helvetica, sans-serif",e.style.padding="6px 10px",e.style.marginTop="6px",e.style.backgroundColor=a.linkBgColor,e.style.color=a.linkFgColor,e.innerText="Back to Main",e.addEventListener("click",a=>{a.preventDefault(),h.style.marginLeft="0",g.style.height="auto",n.style.height="0"}),p.appendChild(e)};l.addEventListener("click",b=>{b.preventDefault(),h.style.marginLeft=f?"-300px":"-720px",g.style.height=f?"80vh":"420px",n.style.height=f?"80vh":"420px",fetch(\`https://storage.googleapis.com/np-assets/manifest.json?v=b2\`).then(a=>a.json()).then(c=>{o.innerHTML="";const d=document.createElement("span");if(d.style.display="block",d.style.fontSize="15px",d.style.fontWeight="bold",d.style.fontFamily="\\"Roboto\\", Helvetica, sans-serif",d.style.marginBottom=f?"6px":"15px",d.style.color=a.linkFgColor,d.innerText="Which ad blocker do you use?",o.appendChild(d),f){const a=document.createElement("select");a.style.fontSize="14px",a.addEventListener("change",a=>{const d=a.target.options[a.target.selectedIndex].value,e=c.find(a=>a.id==d);m(e)}),o.appendChild(a),c.forEach(b=>{const c=document.createElement("option");c.value=b.id,c.textContent=b.name,a.appendChild(c)})}else c.forEach(b=>{const c=document.createElement("span");c.style.display="block",c.style.cursor="pointer",c.style.fontSize="14px",c.style.fontWeight="regular",c.style.fontFamily="\\"Roboto\\", Helvetica, sans-serif",c.style.padding="4px 0px",c.style.backgroundColor=a.linkBgColor,c.style.color=a.linkFgColor,c.style.opacity="0.8",c.style.borderBottom="1px solid rgba(218, 218, 218, 0.14)",c.innerText=b.name,o.appendChild(c),c.addEventListener("click",a=>{a.preventDefault(),m(b)})});0<c.length&&m(c[0])})});const n=document.createElement("div");n.style.background=a.bgColor,n.style.display="flex",n.style.width=f?"300px":"720px",n.style.height="50px",n.style.flex=f?"300px":"0 0 720px",n.style.textAlign="left",n.style.padding="0",n.style.whiteSpace="normal",f&&(n.style.flexDirection="column"),g.appendChild(n);const o=document.createElement("div");o.style.background=a.linkBgColor,o.style.flex=f?"0 0 110px":"0 0 200px",o.style.textAlign="left",o.style.padding=f?"15px":"30px",o.style.overflow="auto",n.appendChild(o);const p=document.createElement("div");p.style.background=a.bgColor,p.style.flex="1",p.style.textAlign="left",p.style.padding=f?"15px":"30px",p.style.overflow="auto",n.appendChild(p),null!==document.body&&document.body.appendChild(c)};document.addEventListener("np.detect",b=>{b.detail.blocking?setTimeout(d,a.delay):c&&c.parentNode&&c.parentNode.removeChild(c)})})();`,
            }}
          />
        )}
      </body>
    </html>
  );
}
