"use client";

import { lazy, Suspense, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import {
  fetchMessageLinkEmbed,
  type EmbedComponent,
} from "@/services/messageLinkEmbedsService";
import { safeEmbedUrl, siteLinksIn } from "@/utils/messages/siteLinks";

const Markdown = lazy(() => import("react-markdown"));
const LINK_BUTTON =
  "h-7! gap-1! rounded-md! px-2.5! text-[13px]! font-medium [&_svg]:size-3!";

function PreviewImage({
  src,
  alt = "Link preview",
  thumbnail = false,
  spoiler = false,
  square = false,
  header,
}: {
  src?: string | null;
  alt?: string;
  thumbnail?: boolean;
  spoiler?: boolean;
  square?: boolean;
  header?: ReactNode;
}) {
  const url = safeEmbedUrl(src);
  if (!url) return null;
  return (
    <ImageLightbox
      src={url}
      alt={alt}
      className={thumbnail ? "shrink-0 self-start" : "w-full"}
      stopPropagation
      noReferrer
      header={header}
    >
      {/* oxlint-disable-next-line next/no-img-element */}
      <img
        src={url}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        className={`${thumbnail ? "size-[85px]" : square ? "aspect-square w-full" : "max-h-[300px] w-full"} rounded-lg object-cover ${spoiler ? "blur-xl" : ""}`}
      />
    </ImageLightbox>
  );
}

function Component({
  node,
  depth = 0,
  header,
}: {
  node: EmbedComponent;
  depth?: number;
  header?: ReactNode;
}) {
  if (depth > 8) return null;
  const children = node.components?.map((child, index) => (
    <Component key={index} node={child} depth={depth + 1} header={header} />
  ));
  switch (node.type) {
    case 10:
      return node.content ? (
        <div className="text-primary-text text-sm wrap-break-word [&_h1]:mt-0 [&_h1]:mb-1 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:mt-0 [&_h2]:mb-1 [&_h2]:text-lg [&_h2]:font-bold [&_h3]:mt-0 [&_h3]:mb-1 [&_h3]:text-base [&_h3]:font-bold [&_p]:my-0 [&_p]:leading-[1.75]">
          <Suspense
            fallback={<p className="whitespace-pre-line">{node.content}</p>}
          >
            <Markdown
              skipHtml
              components={{
                a: ({ href, children }) => {
                  const url = safeEmbedUrl(href);
                  return url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-link hover:text-link-hover underline transition-colors"
                    >
                      {children}
                    </a>
                  ) : (
                    <>{children}</>
                  );
                },
                img: () => null,
              }}
            >
              {node.content}
            </Markdown>
          </Suspense>
        </div>
      ) : null;
    case 9:
      return (
        <div className="flex gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">{children}</div>
          {node.accessory && (
            <Component
              node={node.accessory}
              depth={depth + 1}
              header={header}
            />
          )}
        </div>
      );
    case 11:
      return (
        <PreviewImage
          src={node.media?.url}
          alt={node.description}
          thumbnail
          header={header}
        />
      );
    case 12:
      return (
        <div
          className={`grid gap-1 ${(node.items?.length ?? 0) > 1 ? "grid-cols-2" : ""}`}
        >
          {node.items?.slice(0, 10).map((item, index) => (
            <PreviewImage
              key={index}
              src={item.media?.url}
              alt={item.description}
              spoiler={item.spoiler}
              square={(node.items?.length ?? 0) > 1}
              header={header}
            />
          ))}
        </div>
      );
    case 14:
      return node.divider === false ? (
        <div className={node.spacing === 2 ? "h-4" : "h-1"} />
      ) : (
        <hr
          className={`border-border-primary ${node.spacing === 2 ? "my-2" : "my-0.5"}`}
        />
      );
    case 1:
      return <div className="flex flex-wrap gap-1.5">{children}</div>;
    case 2: {
      const url = safeEmbedUrl(node.url);
      if (node.style !== 5 || !url || !node.label) return null;
      if (node.disabled)
        return (
          <Button
            size="sm"
            variant="secondary"
            className={LINK_BUTTON}
            disabled
          >
            {node.label}
          </Button>
        );
      return (
        <Button asChild size="sm" variant="secondary" className={LINK_BUTTON}>
          <a href={url} target="_blank" rel="noopener noreferrer">
            {node.emoji?.id && /^\d+$/.test(node.emoji.id) ? (
              /* oxlint-disable-next-line next/no-img-element */
              <img
                src={`https://cdn.discordapp.com/emojis/${node.emoji.id}.${node.emoji.animated ? "gif" : "webp"}?size=44`}
                alt={node.emoji.name ?? ""}
                className="size-4"
                loading="lazy"
              />
            ) : (
              node.emoji?.name
            )}
            {node.label}
            <Icon
              icon="heroicons:arrow-top-right-on-square"
              className="size-3"
            />
          </a>
        </Button>
      );
    }
    default:
      return null;
  }
}

function LinkPreview({ url, header }: { url: string; header?: ReactNode }) {
  const { data: embed } = useQuery({
    queryKey: ["message-link-embed", url],
    queryFn: ({ signal }) => fetchMessageLinkEmbed(url, signal),
    staleTime: 5 * 60_000,
    retry: false,
  });
  if (
    !embed ||
    !(embed.component?.type === 17 || embed.title || embed.description)
  )
    return null;
  const container = embed.component?.type === 17 ? embed.component : null;
  const accent =
    typeof container?.accent_color === "number" &&
    container.accent_color >= 0 &&
    container.accent_color <= 0xffffff
      ? `#${container.accent_color.toString(16).padStart(6, "0")}`
      : embed.theme_color;
  const href = safeEmbedUrl(embed.url);
  return (
    <article
      className={`border-border-card bg-tertiary-bg lg:group-hover/message:bg-secondary-bg flex w-full ${container ? "max-w-[560px]" : "max-w-[432px]"} min-w-0 flex-col gap-2 overflow-hidden rounded-[4px] border-l-4 p-3 text-sm whitespace-normal transition-colors`}
      style={
        accent && /^#[\da-f]{6}$/i.test(accent)
          ? { borderLeftColor: accent }
          : undefined
      }
    >
      {container ? (
        container.components?.map((node, index) => (
          <Component key={index} node={node} header={header} />
        ))
      ) : (
        <>
          {embed.site_name && (
            <p className="text-secondary-text text-xs">{embed.site_name}</p>
          )}
          {embed.title && (
            <h3 className="text-link text-base font-semibold wrap-break-word">
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link hover:text-link-hover transition-colors hover:underline"
                >
                  {embed.title}
                </a>
              ) : (
                embed.title
              )}
            </h3>
          )}
          {embed.description && (
            <p className="text-secondary-text line-clamp-4 wrap-break-word whitespace-pre-line">
              {embed.description}
            </p>
          )}
          <PreviewImage src={embed.image} header={header} />
        </>
      )}
    </article>
  );
}

export function MessageLinkEmbeds({
  text,
  header,
}: {
  text: string;
  header?: ReactNode;
}) {
  const links = siteLinksIn(text);
  if (!links.length) return null;
  return (
    <div className="mt-1 flex flex-col gap-1">
      {links.map((url) => (
        <LinkPreview key={url} url={url} header={header} />
      ))}
    </div>
  );
}
