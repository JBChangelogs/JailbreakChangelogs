"use client";

import dynamic from "next/dynamic";
const Skeleton = dynamic(() => import("@mui/material/Skeleton"), {
  ssr: false,
});
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { FilterSort } from "@/types";

interface User {
  id: string;
  username: string;
  global_name: string;
}

interface BreadcrumbProps {
  userData?: User | null;
  loading?: boolean;
}

interface BreadcrumbItem {
  label: string;
  href: string;
  isHome?: boolean;
}

// Mapping of singular item types to their plural filter sort values
const itemTypeToFilterSort: Record<string, FilterSort> = {
  vehicle: "name-vehicles",
  spoiler: "name-spoilers",
  rim: "name-rims",
  "body color": "name-body-colors",
  hyperchrome: "name-hyperchromes",
  texture: "name-textures",
  "tire sticker": "name-tire-stickers",
  "tire style": "name-tire-styles",
  drift: "name-drifts",
  furniture: "name-furnitures",
  horn: "name-horns",
  "weapon skin": "name-weapon-skins",
};

export default function Breadcrumb({ userData, loading }: BreadcrumbProps) {
  const pathname = usePathname();
  const [username, setUsername] = useState<string | null>(null);

  // Check if we're on a user profile page
  const isUserProfilePage =
    pathname.startsWith("/users/") && pathname.split("/").length === 3;
  const userId = isUserProfilePage ? pathname.split("/")[2] : null;

  // Set username if we're on a user profile page and have user data
  useEffect(() => {
    if (userId && userData) {
      setUsername(
        userData.global_name && userData.global_name !== "None"
          ? `@${userData.global_name}`
          : `@${userData.username}`,
      );
    }
  }, [userId, userData]);

  // Split the pathname and create breadcrumb items
  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Home", href: "/", isHome: true },
    ...pathSegments.map((segment, index) => {
      // Special handling for user profile pages
      if (index === 1 && isUserProfilePage && username) {
        return {
          label: username,
          href: `/${pathSegments.slice(0, index + 1).join("/")}`,
        };
      }

      // Special handling for changelog pages
      if (
        index === 1 &&
        pathSegments[0] === "changelogs" &&
        pathSegments.length === 2
      ) {
        return {
          label: `Changelog ${segment}`,
          href: `/${pathSegments.slice(0, index + 1).join("/")}`,
        };
      }

      // Special handling for season pages
      if (
        index === 1 &&
        pathSegments[0] === "seasons" &&
        pathSegments.length === 2
      ) {
        // Special case for will-i-make-it page
        if (segment === "will-i-make-it") {
          return {
            label: "Will I Make It?",
            href: `/${pathSegments.slice(0, index + 1).join("/")}`,
          };
        }
        return {
          label: `Season ${segment}`,
          href: `/${pathSegments.slice(0, index + 1).join("/")}`,
        };
      }

      // Special handling for item pages
      if (pathSegments[0] === "item") {
        if (index === 0) {
          return {
            label: "Values",
            href: "/values",
          };
        }
        if (index === 1) {
          const itemType = decodeURIComponent(segment).replace(/-/g, " ");
          const filterSort = itemTypeToFilterSort[itemType] || "name-all-items";
          return {
            label: itemType
              .split(" ")
              .map(
                (word) =>
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
              )
              .join(" "),
            href: `/values?filterSort=${filterSort}&valueSort=cash-desc`,
          };
        }
        if (index === 2) {
          return {
            label: decodeURIComponent(segment).replace(/-/g, " "),
            href: "#",
          };
        }
      }

      // Special handling for trading routes
      if (pathSegments[0] === "trading") {
        if (index === 0) {
          return {
            label: "Trading",
            href: "/trading",
          };
        }
        if (index === 1 && segment === "ad") {
          return {
            label: "Ad",
            href: "/trading",
          };
        }
        if (index === 2) {
          return {
            label: segment,
            href: `/${pathSegments.slice(0, index + 1).join("/")}`,
          };
        }
      }

      // Special handling for inventories route
      if (pathSegments[0] === "inventories") {
        if (index === 0) {
          return {
            label: "Inventory Checker",
            href: "/inventories",
          };
        }
        if (index === 1) {
          // Special handling for networth segment
          if (segment === "networth") {
            return {
              label: "Networth",
              href: `/${pathSegments.slice(0, index + 1).join("/")}`,
            };
          }
          return {
            label: segment,
            href: `/${pathSegments.slice(0, index + 1).join("/")}`,
          };
        }
      }

      // Special handling for inventory-checker route (legacy)
      if (pathSegments[0] === "inventory-checker") {
        if (index === 0) {
          return {
            label: "Inventory Checker",
            href: "/inventories",
          };
        }
      }

      // Special handling for OG route
      if (pathSegments[0] === "og") {
        if (index === 0) {
          return {
            label: "OG Finder",
            href: "/og",
          };
        }
        if (index === 1) {
          return {
            label: segment,
            href: `/${pathSegments.slice(0, index + 1).join("/")}`,
          };
        }
      }

      // Special handling for supporting route
      if (pathSegments[0] === "supporting") {
        if (index === 0) {
          return {
            label: "Supporting",
            href: "/supporting",
          };
        }
      }

      return {
        label: segment.charAt(0).toUpperCase() + segment.slice(1),
        href: `/${pathSegments.slice(0, index + 1).join("/")}`,
      };
    }),
  ];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-4">
        <div className="text-secondary-text flex min-w-0 flex-wrap items-center">
          <div className="flex items-center">
            <Skeleton
              variant="circular"
              width={20}
              height={20}
              className="bg-secondary-bg"
            />
          </div>
          <div className="flex items-center">
            <span className="text-secondary-text mx-2">
              <svg
                className="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <Skeleton
              variant="rounded"
              width={120}
              height={24}
              className="bg-secondary-bg"
            />
          </div>
          <div className="flex items-center">
            <span className="text-secondary-text mx-2">
              <svg
                className="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <Skeleton
              variant="rounded"
              width={160}
              height={24}
              className="bg-secondary-bg"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;

            if (index === 0) {
              return (
                <li
                  key={`${index}-${item.href}`}
                  className="inline-flex items-center"
                >
                  {isLast ? (
                    <span className="inline-flex items-center text-sm font-medium text-secondary-text">
                      <svg
                        className="w-3 h-3 mr-2.5"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
                      </svg>
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className="inline-flex items-center text-sm font-medium text-secondary-text hover:text-link-hover"
                    >
                      <svg
                        className="w-3 h-3 mr-2.5"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
                      </svg>
                      {item.label}
                    </Link>
                  )}
                </li>
              );
            }

            return (
              <li
                key={`${index}-${item.href}`}
                aria-current={isLast ? "page" : undefined}
              >
                <div className="flex items-center">
                  <svg
                    className="w-3 h-3 text-secondary-text mx-1"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 6 10"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 9 4-4-4-4"
                    />
                  </svg>
                  {isLast ? (
                    <span className="ml-1 text-sm font-medium text-secondary-text md:ml-2">
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className="ml-1 text-sm font-medium text-secondary-text hover:text-link-hover md:ml-2"
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
