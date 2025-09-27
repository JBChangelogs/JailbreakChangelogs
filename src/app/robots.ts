import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/values", "/values/*", "/item/*", "/changelogs", "/seasons"],
        disallow: [
          "/*?page=",
          "/*?filter=",
          "/api/",
          "/cdn-cgi/",
          "/dupes/calculator",
          "/settings",
          "/trading/ad",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/values", "/values/*", "/item/*", "/changelogs", "/seasons"],
        disallow: [
          "/*?page=",
          "/*?filter=",
          "/api/",
          "/cdn-cgi/",
          "/dupes/calculator",
          "/settings",
          "/trading/ad",
        ],
      },
    ],
    sitemap: [
      "https://jailbreakchangelogs.xyz/sitemap.xml",
      "https://jailbreakchangelogs.xyz/changelogs/sitemap.xml",
      "https://jailbreakchangelogs.xyz/seasons/sitemap.xml",
      "https://jailbreakchangelogs.xyz/values/sitemap.xml",
    ],
    host: "https://jailbreakchangelogs.xyz",
  };
}
