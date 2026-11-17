"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { IMAGE_PLACEHOLDER } from "@/utils/ui/imagePlaceholder";
import { Slot } from "radix-ui";
import { toast } from "sonner";

import { Icon } from "@/components/ui/IconWrapper";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ACTION_CLASS =
  "text-secondary-text hover:bg-tertiary-bg hover:text-primary-text focus-visible:outline-border-focus flex size-10 cursor-pointer items-center justify-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-50";

interface LightboxImage {
  src: string;
  alt: string;
}

interface ImageLightboxProps {
  src?: string;
  alt?: string;
  images?: LightboxImage[];
  initialIndex?: number;
  children: ReactNode;
  header?: ReactNode;
  className?: string;
  previewRadius?: string;
  compact?: boolean;
  showUrl?: boolean;
  triggerAsChild?: boolean;
  stopPropagation?: boolean;
  noReferrer?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ImageLightbox = ({
  src,
  alt,
  images,
  initialIndex = 0,
  children,
  header,
  className,
  previewRadius = "rounded-lg",
  compact = false,
  showUrl = false,
  triggerAsChild = false,
  stopPropagation = false,
  noReferrer = false,
  onOpenChange,
}: ImageLightboxProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [zoomSize, setZoomSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const zoomed = zoomSize !== null;
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    x: number;
    y: number;
    panX: number;
    panY: number;
    moved: boolean;
  } | null>(null);
  const detailsRequestRef = useRef<AbortController | null>(null);
  const [details, setDetails] = useState<{
    bytes: number | null;
    loading: boolean;
  } | null>(null);
  const lightboxImages = images?.length
    ? images
    : src
      ? [{ src, alt: alt ?? "Image preview" }]
      : [];
  const activeImage =
    activeIndex === null ? undefined : lightboxImages[activeIndex];

  const resetMedia = useCallback(() => {
    setZoomSize(null);
    setPan({ x: 0, y: 0 });
    dragRef.current = null;
    detailsRequestRef.current?.abort();
    detailsRequestRef.current = null;
    setDetails(null);
  }, []);

  const toggleZoom = (event?: React.MouseEvent) => {
    const image = imageRef.current;
    if (!image?.clientWidth || !image.clientHeight) return;
    setZoomSize((value) =>
      value ? null : { width: image.clientWidth, height: image.clientHeight },
    );
    if (!zoomed && event && event.detail > 0) {
      const rect = image.getBoundingClientRect();
      movePan(
        (rect.left + rect.width / 2 - event.clientX) * 2,
        (rect.top + rect.height / 2 - event.clientY) * 2,
        { width: window.innerWidth, height: window.innerHeight },
      );
    } else {
      setPan({ x: 0, y: 0 });
    }
    image.parentElement?.focus({ preventScroll: true });
    dragRef.current = null;
  };

  const movePan = (
    x: number,
    y: number,
    viewportSize?: { width: number; height: number },
  ) => {
    const image = imageRef.current;
    const viewport = viewportRef.current;
    if (!image || !viewport) return;
    const maxX = Math.max(
      0,
      (image.clientWidth * 2 - (viewportSize?.width ?? viewport.clientWidth)) /
        2,
    );
    const maxY = Math.max(
      0,
      (image.clientHeight * 2 -
        (viewportSize?.height ?? viewport.clientHeight)) /
        2,
    );
    setPan({
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    });
  };

  const showPrevious = useCallback(() => {
    resetMedia();
    setActiveIndex((index) =>
      index === null
        ? index
        : (index - 1 + lightboxImages.length) % lightboxImages.length,
    );
  }, [lightboxImages.length, resetMedia]);

  const showNext = useCallback(() => {
    resetMedia();
    setActiveIndex((index) =>
      index === null ? index : (index + 1) % lightboxImages.length,
    );
  }, [lightboxImages.length, resetMedia]);

  useEffect(() => setMounted(true), []);
  useEffect(
    () => () => {
      detailsRequestRef.current?.abort();
      detailsRequestRef.current = null;
    },
    [],
  );

  const isOpen = activeIndex !== null;
  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    if (activeIndex === null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === "Escape") {
        resetMedia();
        setActiveIndex(null);
      }
      if (event.key === "ArrowLeft" && lightboxImages.length > 1) {
        showPrevious();
      }
      if (event.key === "ArrowRight" && lightboxImages.length > 1) {
        showNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, lightboxImages.length, showNext, showPrevious, resetMedia]);

  const openLightbox = (event: React.MouseEvent) => {
    if (stopPropagation) event.stopPropagation();
    if (lightboxImages.length) {
      resetMedia();
      setActiveIndex(initialIndex);
    }
  };

  const loadDetails = async () => {
    if (!activeImage) return;
    detailsRequestRef.current?.abort();
    const controller = new AbortController();
    detailsRequestRef.current = controller;
    setDetails({ bytes: null, loading: true });
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(activeImage.src, {
        method: "HEAD",
        signal: controller.signal,
        referrerPolicy: noReferrer ? "no-referrer" : undefined,
      });
      if (!response.ok) throw new Error("Image details unavailable");
      const length = response.headers.get("content-length");
      const bytes =
        length !== null && /^\d+$/.test(length) ? Number(length) : null;
      if (detailsRequestRef.current === controller)
        setDetails({
          bytes: bytes !== null && Number.isSafeInteger(bytes) ? bytes : null,
          loading: false,
        });
    } catch {
      if (detailsRequestRef.current === controller)
        setDetails({ bytes: null, loading: false });
    } finally {
      clearTimeout(timeout);
    }
  };

  let filename = "Image";
  try {
    const name = new URL(activeImage?.src ?? "", window.location.href).pathname
      .split("/")
      .pop();
    if (name) filename = decodeURIComponent(name);
  } catch {}

  const copyLink = async () => {
    if (!activeImage) return;
    try {
      await navigator.clipboard.writeText(
        new URL(activeImage.src, window.location.href).href,
      );
      toast.success("Image link copied");
    } catch {
      toast.error("Couldn't copy the image link. Try opening it in a new tab.");
    }
  };

  const downloadImage = async () => {
    if (!activeImage || downloading) return;
    setDownloading(true);
    try {
      const response = await fetch(activeImage.src, {
        referrerPolicy: noReferrer ? "no-referrer" : undefined,
      });
      if (!response.ok) throw new Error("Image download failed");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download =
        new URL(activeImage.src, window.location.href).pathname
          .split("/")
          .pop() || "image";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast.error(
        "Couldn't download this image. Open it in a new tab to save it.",
      );
    } finally {
      setDownloading(false);
    }
  };

  const bytes = details?.bytes;
  const fileSize = details?.loading
    ? "Loading…"
    : bytes == null
      ? "size unavailable"
      : bytes < 1024
        ? `${bytes} B`
        : bytes < 1024 ** 2
          ? `${Number((bytes / 1024).toFixed(1))} KB`
          : `${Number((bytes / 1024 ** 2).toFixed(1))} MB`;

  const trigger = triggerAsChild ? (
    <Slot.Root onClick={openLightbox}>{children}</Slot.Root>
  ) : (
    <button
      type="button"
      aria-label={`Preview ${alt ?? "image"}`}
      onClick={openLightbox}
      className={cn(
        "group/lightbox relative block cursor-zoom-in overflow-hidden",
        previewRadius,
        className,
      )}
    >
      {children}
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover/lightbox:bg-black/25 group-hover/lightbox:opacity-100 group-focus-visible/lightbox:bg-black/25 group-focus-visible/lightbox:opacity-100",
          previewRadius,
        )}
      >
        <Icon
          icon="mdi:magnify-plus-outline"
          className="size-6 text-white drop-shadow"
        />
      </span>
    </button>
  );

  return (
    <>
      {trigger}

      {mounted &&
        activeImage &&
        createPortal(
          <div
            data-image-lightbox
            className={cn(
              "pointer-events-auto fixed inset-0 z-[10000] grid bg-black/90",
              zoomed
                ? "grid-rows-[minmax(0,1fr)]"
                : "grid-rows-[auto_minmax(0,1fr)_auto] gap-3 p-4",
            )}
            onContextMenu={(event) => event.stopPropagation()}
            onClick={(event) => {
              if (stopPropagation) event.stopPropagation();
              resetMedia();
              setActiveIndex(null);
            }}
          >
            <div
              className={
                zoomed
                  ? "absolute top-4 right-4 z-10"
                  : "flex min-w-0 flex-wrap items-center justify-between gap-3"
              }
            >
              {!zoomed && header && (
                <div
                  className="max-w-full min-w-0 grow basis-40"
                  onClick={(event) => event.stopPropagation()}
                >
                  {header}
                </div>
              )}
              <div
                data-lightbox-actions
                className="ml-auto flex shrink-0 items-center gap-2"
                onClick={(event) => event.stopPropagation()}
              >
                {!zoomed && (
                  <div className="border-border-card bg-secondary-bg flex items-center gap-1 rounded-lg border p-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label={zoomed ? "Zoom out" : "Zoom in"}
                          aria-pressed={zoomed}
                          onClick={() => toggleZoom()}
                          className={ACTION_CLASS}
                        >
                          <Icon
                            icon={zoomed ? "lucide:zoom-out" : "lucide:zoom-in"}
                            className="size-5"
                          />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        {zoomed ? "Zoom out" : "Zoom in"}
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={activeImage.src}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Open image in new tab"
                          className={ACTION_CLASS}
                        >
                          <Icon
                            icon="lucide:external-link"
                            className="size-5"
                          />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        Open image in new tab
                      </TooltipContent>
                    </Tooltip>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label="More image actions"
                          className={ACTION_CLASS}
                        >
                          <Icon
                            icon="heroicons:ellipsis-horizontal"
                            className="size-5"
                          />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="z-[10002]"
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <DropdownMenuItem
                          aria-label="Copy image link"
                          onClick={copyLink}
                        >
                          <Icon icon="lucide:link" className="size-4" />
                          Copy media link
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          aria-label="Download image"
                          onClick={downloadImage}
                          disabled={downloading}
                        >
                          <Icon icon="lucide:download" className="size-4" />
                          Download image
                        </DropdownMenuItem>
                        <DropdownMenuSub
                          onOpenChange={(open) => {
                            if (open) void loadDetails();
                          }}
                        >
                          <DropdownMenuSubTrigger>
                            View image details
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="z-[10003] max-w-72 p-3">
                            <dl className="grid gap-3 text-sm">
                              <div>
                                <dt className="text-primary-text font-medium">
                                  Filename
                                </dt>
                                <dd className="text-secondary-text break-all">
                                  {filename}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-primary-text font-medium">
                                  Size
                                </dt>
                                <dd className="text-secondary-text">{`${imageRef.current?.naturalWidth ? `${imageRef.current.naturalWidth} × ${imageRef.current.naturalHeight}` : "Dimensions unavailable"} (${fileSize})`}</dd>
                              </div>
                            </dl>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Close image preview"
                      onClick={() => {
                        resetMedia();
                        setActiveIndex(null);
                      }}
                      className={cn(
                        ACTION_CLASS,
                        "border-border-card bg-secondary-bg size-12 rounded-lg border",
                      )}
                    >
                      <Icon icon="mdi:close" className="size-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Close image preview
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            <div
              ref={viewportRef}
              className={cn(
                "relative flex min-h-0 items-center justify-center overflow-hidden",
                !zoomed && lightboxImages.length > 1 && "px-12 sm:px-16",
              )}
            >
              <button
                type="button"
                aria-label={zoomed ? "Zoom out of image" : "Zoom into image"}
                aria-pressed={zoomed}
                className={cn(
                  "group/zoom flex h-full min-h-0 max-w-full items-center justify-center select-none focus-visible:outline-border-focus focus-visible:outline-2",
                  zoomed
                    ? "cursor-zoom-out active:cursor-grabbing"
                    : "cursor-zoom-in",
                )}
                style={{ touchAction: zoomed ? "pinch-zoom" : "auto" }}
                onClick={(event) => {
                  event.stopPropagation();
                  if (dragRef.current?.moved) {
                    dragRef.current = null;
                    return;
                  }
                  toggleZoom(event);
                }}
                onPointerDown={(event) => {
                  if (!zoomed || event.button !== 0 || !event.isPrimary) return;
                  dragRef.current = {
                    x: event.clientX,
                    y: event.clientY,
                    panX: pan.x,
                    panY: pan.y,
                    moved: false,
                  };
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  const drag = dragRef.current;
                  if (
                    !drag ||
                    !event.currentTarget.hasPointerCapture(event.pointerId)
                  )
                    return;
                  const dx = event.clientX - drag.x;
                  const dy = event.clientY - drag.y;
                  if (Math.hypot(dx, dy) > 4) drag.moved = true;
                  if (drag.moved) movePan(drag.panX + dx, drag.panY + dy);
                }}
                onPointerCancel={() => {
                  dragRef.current = null;
                }}
                onKeyDown={(event) => {
                  if (
                    !zoomed ||
                    ![
                      "ArrowLeft",
                      "ArrowRight",
                      "ArrowUp",
                      "ArrowDown",
                    ].includes(event.key)
                  )
                    return;
                  event.preventDefault();
                  event.stopPropagation();
                  movePan(
                    pan.x +
                      (event.key === "ArrowLeft"
                        ? 40
                        : event.key === "ArrowRight"
                          ? -40
                          : 0),
                    pan.y +
                      (event.key === "ArrowUp"
                        ? 40
                        : event.key === "ArrowDown"
                          ? -40
                          : 0),
                  );
                }}
              >
                <Image
                  ref={imageRef}
                  placeholder={IMAGE_PLACEHOLDER}
                  src={activeImage.src}
                  alt={activeImage.alt}
                  width={0}
                  height={0}
                  sizes="100vw"
                  unoptimized
                  draggable={false}
                  referrerPolicy={noReferrer ? "no-referrer" : undefined}
                  style={{
                    ...(zoomSize
                      ? {
                          width: zoomSize.width,
                          height: zoomSize.height,
                          maxWidth: "none",
                          maxHeight: "none",
                        }
                      : {}),
                    transform: zoomed
                      ? `translate(${pan.x}px, ${pan.y}px) scale(2)`
                      : undefined,
                  }}
                  className={cn(
                    "max-h-full max-w-full object-contain transition-transform duration-200 ease-out motion-reduce:transition-none",
                    compact
                      ? "size-[min(80dvh,80vw)]"
                      : "h-auto w-auto max-w-[min(95vw,1400px)]",
                    zoomed ? "rounded-none" : previewRadius,
                  )}
                />
              </button>
              {!zoomed && lightboxImages.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={(event) => {
                      event.stopPropagation();
                      showPrevious();
                    }}
                    className={cn(
                      ACTION_CLASS,
                      "bg-secondary-bg absolute top-1/2 left-0 -translate-y-1/2",
                    )}
                  >
                    <Icon
                      icon="material-symbols:chevron-left-rounded"
                      className="size-5"
                    />
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={(event) => {
                      event.stopPropagation();
                      showNext();
                    }}
                    className={cn(
                      ACTION_CLASS,
                      "bg-secondary-bg absolute top-1/2 right-0 -translate-y-1/2",
                    )}
                  >
                    <Icon
                      icon="material-symbols:chevron-right-rounded"
                      className="size-5"
                    />
                  </button>
                </>
              )}
            </div>
            {!zoomed && (
              <div className="flex min-w-0 flex-col items-center gap-3">
                {lightboxImages.length > 1 && (
                  <div
                    aria-label="Image thumbnails"
                    role="group"
                    className="flex max-w-full gap-2 overflow-x-auto p-1"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {lightboxImages.map((image, index) => (
                      <button
                        key={`${image.src}-${index}`}
                        type="button"
                        aria-label={`Show image ${index + 1}: ${image.alt}`}
                        aria-pressed={activeIndex === index}
                        onClick={() => {
                          resetMedia();
                          setActiveIndex(index);
                        }}
                        className={cn(
                          "focus-visible:outline-border-focus size-14 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2",
                          activeIndex === index
                            ? "border-white"
                            : "border-transparent opacity-50 hover:opacity-100",
                        )}
                      >
                        <Image
                          src={image.src}
                          alt=""
                          width={56}
                          height={56}
                          unoptimized
                          loading="lazy"
                          referrerPolicy={
                            noReferrer ? "no-referrer" : undefined
                          }
                          className="size-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
                {showUrl && (
                  <a
                    href={activeImage.src}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className="w-full px-6 text-center font-mono text-xs break-all text-white/50 hover:text-white/80 hover:underline"
                  >
                    {activeImage.src}
                  </a>
                )}
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
};
