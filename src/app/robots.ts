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
          "/*?username=",
          "/*?sort=",
          "/api/",
          "/cdn-cgi/",
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
          "/*?username=",
          "/*?sort=",
          "/api/",
          "/cdn-cgi/",
          "/settings",
          "/trading/ad",
        ],
      },
    ],
    sitemap: [
      "https://jailbreakchangelogs.com/sitemap.xml",
      "https://jailbreakchangelogs.com/changelogs/sitemap.xml",
      "https://jailbreakchangelogs.com/seasons/sitemap.xml",
      "https://jailbreakchangelogs.com/values/sitemap.xml",
      "https://jailbreakchangelogs.com/values/changelogs/sitemap.xml",
    ],
  };
}
