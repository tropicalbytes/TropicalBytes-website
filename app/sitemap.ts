import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/about",
    "/menu",
    "/menu/request",
    "/plans",
    "/plans/subscribe",
    "/party-request",
    "/faq",
    "/contact",
    "/privacy-policy",
    "/terms-of-service",
  ];

  return routes.map((route) => ({
    url: `https://mealshome.in${route}`,
    lastModified: new Date(),
  }));
}
