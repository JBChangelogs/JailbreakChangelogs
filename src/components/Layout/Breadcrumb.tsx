"use client";

import { Skeleton } from "@mui/material";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { FilterSort } from "@/types";
import { HomeIcon } from "@heroicons/react/24/solid";

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
  'vehicle': 'name-vehicles',
  'spoiler': 'name-spoilers',
  'rim': 'name-rims',
  'body color': 'name-body-colors',
  'hyperchrome': 'name-hyperchromes',
  'texture': 'name-textures',
  'tire sticker': 'name-tire-stickers',
  'tire style': 'name-tire-styles',
  'drift': 'name-drifts',
  'furniture': 'name-furnitures',
  'horn': 'name-horns',
  'weapon skin': 'name-weapon-skins'
};

export default function Breadcrumb({ userData, loading }: BreadcrumbProps) {
  const pathname = usePathname();
  const [username, setUsername] = useState<string | null>(null);
  
  // Check if we're on a user profile page
  const isUserProfilePage = pathname.startsWith('/users/') && pathname.split('/').length === 3;
  const userId = isUserProfilePage ? pathname.split('/')[2] : null;
  
  // Set username if we're on a user profile page and have user data
  useEffect(() => {
    if (userId && userData) {
      setUsername(userData.global_name && userData.global_name !== "None" 
        ? `@${userData.global_name}` 
        : `@${userData.username}`);
    }
  }, [userId, userData]);
  
  // Split the pathname and create breadcrumb items
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "", href: "/", isHome: true },
    ...pathSegments.map((segment, index) => {
      // Special handling for user profile pages
      if (index === 1 && isUserProfilePage && username) {
        return {
          label: username,
          href: `/${pathSegments.slice(0, index + 1).join('/')}`
        };
      }
      
      // Special handling for changelog pages
      if (index === 1 && pathSegments[0] === 'changelogs' && pathSegments.length === 2) {
        return {
          label: `Changelog ${segment}`,
          href: `/${pathSegments.slice(0, index + 1).join('/')}`
        };
      }
      
      // Special handling for season pages
      if (index === 1 && pathSegments[0] === 'seasons' && pathSegments.length === 2) {
        // Special case for will-i-make-it page
        if (segment === 'will-i-make-it') {
          return {
            label: 'Will I Make It?',
            href: `/${pathSegments.slice(0, index + 1).join('/')}`
          };
        }
        return {
          label: `Season ${segment}`,
          href: `/${pathSegments.slice(0, index + 1).join('/')}`
        };
      }
      
      // Special handling for item pages
      if (pathSegments[0] === 'item') {
        if (index === 0) {
          return {
            label: "Values",
            href: "/values"
          };
        }
        if (index === 1) {
          const itemType = decodeURIComponent(segment).replace(/-/g, ' ');
          const filterSort = itemTypeToFilterSort[itemType] || 'name-all-items';
          return {
            label: itemType.split(' ').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' '),
            href: `/values?filterSort=${filterSort}&valueSort=cash-desc`
          };
        }
        if (index === 2) {
          return {
            label: decodeURIComponent(segment).replace(/-/g, ' '),
            href: '#'
          };
        }
      }

      // Special handling for trading routes
      if (pathSegments[0] === 'trading') {
        if (index === 0) {
          return {
            label: "Trading",
            href: "/trading"
          };
        }
        if (index === 1 && segment === 'ad') {
          return {
            label: "Ad",
            href: "/trading"
          };
        }
        if (index === 2) {
          return {
            label: segment,
            href: `/${pathSegments.slice(0, index + 1).join('/')}`
          };
        }
      }

      // Special handling for inventories route
      if (pathSegments[0] === 'inventories') {
        if (index === 0) {
          return {
            label: "Inventory Checker",
            href: "/inventories"
          };
        }
        if (index === 1) {
          return {
            label: `User ${segment}`,
            href: `/${pathSegments.slice(0, index + 1).join('/')}`
          };
        }
      }
      
      // Special handling for inventory-checker route (legacy)
      if (pathSegments[0] === 'inventory-checker') {
        if (index === 0) {
          return {
            label: "Inventory Checker",
            href: "/inventories"
          };
        }
      }
      
      // Special handling for OG route
      if (pathSegments[0] === 'og') {
        if (index === 0) {
          return {
            label: "OG Finder",
            href: "/og"
          };
        }
        if (index === 1) {
          return {
            label: `User ${segment}`,
            href: `/${pathSegments.slice(0, index + 1).join('/')}`
          };
        }
      }
      
      return {
        label: segment.charAt(0).toUpperCase() + segment.slice(1),
        href: `/${pathSegments.slice(0, index + 1).join('/')}`
      };
    })
  ];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-4">
        <div className="text-muted flex flex-wrap items-center min-w-0">
          <div className="flex items-center">
            <Skeleton variant="circular" width={20} height={20} sx={{ bgcolor: '#212A31' }} />
          </div>
          <div className="flex items-center">
            <span className="mx-2 text-muted">
              <svg
                className="w-4 h-4"
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
            <Skeleton variant="rounded" width={120} height={24} sx={{ bgcolor: '#212A31' }} />
          </div>
          <div className="flex items-center">
            <span className="mx-2 text-muted">
              <svg
                className="w-4 h-4"
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
            <Skeleton variant="rounded" width={160} height={24} sx={{ bgcolor: '#212A31' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="text-muted flex flex-wrap items-center min-w-0 text-xs sm:text-sm">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          
          return (
            <div key={`${index}-${item.href}`} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 text-muted">
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4"
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
              )}
              
              {isLast ? (
                <span 
                  className="px-2 py-0.5 rounded-full bg-[#212a31] text-blue-300 text-xs sm:text-sm font-medium max-w-[200px] sm:max-w-[300px] truncate"
                >
                  {item.isHome ? (
                    <HomeIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  ) : (
                    item.label
                  )}
                </span>
              ) : (
                <Link 
                  href={item.href}
                  className="text-muted hover:text-muted text-xs sm:text-sm max-w-[200px] sm:max-w-[300px] truncate"
                >
                  {item.isHome ? (
                    <HomeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    item.label
                  )}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 