"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { bangers } from "@/app/fonts";
import { IMAGE_PLACEHOLDER } from "@/utils/ui/imagePlaceholder";
import {
  getItemImagePath,
  isVideoItem,
  isDriftItem,
  getDriftVideoPath,
  getVideoPath,
  handleImageError,
} from "@/utils/ui/images";
import { getCategoryIcon, getCategoryColor } from "@/utils/items/categoryIcons";
import ItemSignatures from "@/components/Items/ItemSignatures";

export default function InventoryItemAppearance({
  title,
  categoryTitle,
  signs,
  children,
}: {
  title: string;
  categoryTitle: string;
  signs?: string[] | null;
  children?: ReactNode;
}) {
  return (
    <>
      <div className="mb-4 text-left">
        <h2
          className={`${bangers.className} text-primary-text mb-1 text-2xl tracking-wide wrap-break-word`}
        >
          <Link
            href={`/item/${encodeURIComponent(categoryTitle)}/${encodeURIComponent(title)}`}
            onClick={(e) => e.stopPropagation()}
            className="hover:text-link-hover transition-colors"
            prefetch={false}
          >
            {title}
          </Link>
        </h2>
        <div className="flex items-center gap-2">
          <span
            className="text-primary-text bg-tertiary-bg/40 flex h-6 items-center gap-1.5 rounded-md border px-2.5 text-xs leading-none font-medium backdrop-blur-xl"
            style={{
              borderColor: getCategoryColor(categoryTitle),
              backgroundColor: `${getCategoryColor(categoryTitle)}22`,
            }}
          >
            {(() => {
              const categoryIcon = getCategoryIcon(categoryTitle);
              return categoryIcon ? (
                <categoryIcon.Icon
                  className="h-3 w-3"
                  style={{ color: getCategoryColor(categoryTitle) }}
                />
              ) : null;
            })()}
            {categoryTitle}
          </span>
        </div>
      </div>

      <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-lg">
        {children}
        {!["Brakes"].includes(categoryTitle) ? (
          isVideoItem(title) ? (
            <video
              src={getVideoPath(categoryTitle, title)}
              className="h-full w-full object-cover"
              muted
              playsInline
              loop
              autoPlay
            />
          ) : isDriftItem(categoryTitle) ? (
            <div className="relative h-full w-full">
              <Image
                placeholder={IMAGE_PLACEHOLDER}
                src={getItemImagePath(categoryTitle, title, true)}
                alt={title}
                fill
                className="object-cover"
                onError={handleImageError}
              />
              <video
                src={getDriftVideoPath(title, true)}
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 hover:opacity-100"
                muted
                playsInline
                loop
              />
            </div>
          ) : (
            <Image
              placeholder={IMAGE_PLACEHOLDER}
              src={getItemImagePath(categoryTitle, title, true)}
              alt={title}
              fill
              className="object-cover"
              onError={handleImageError}
            />
          )
        ) : (
          <Image
            placeholder={IMAGE_PLACEHOLDER}
            src={getItemImagePath(categoryTitle, title, true)}
            alt={title}
            fill
            className="object-cover"
            onError={handleImageError}
          />
        )}
        <ItemSignatures signs={signs} />
      </div>
    </>
  );
}
