import { Box, Typography, Divider, Chip, Skeleton } from "@mui/material";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatRelativeDate, formatCustomDate } from "@/utils/timestamp";
import Link from "next/link";
import Image from "next/image";
import {
  getItemImagePath,
  isVideoItem,
  handleImageError,
  getVideoPath,
} from "@/utils/images";
import { getCategoryColor } from "@/utils/categoryIcons";
import { ItemDetails } from "@/types";
import { convertUrlsToLinks } from "@/utils/urlConverter";

interface CommentProps {
  id: number;
  author: string;
  content: string;
  date: string;
  item_id: number;
  item_type: string;
  user_id: string;
  edited_at: number | null;
  owner?: string;
  parent_id?: number | null;
  parentComment?: {
    id: number;
    author: string;
    content: string;
  } | null;
  changelogDetails?: unknown;
  itemDetails?: unknown;
  seasonDetails?: unknown;
  tradeDetails?: unknown;
  isLoading?: boolean;
}

interface ChangelogDetails {
  id: number;
  title: string;
}

interface SeasonDetails {
  season: number;
  title: string;
}

export default function Comment({
  content,
  date,
  item_type,
  item_id,
  edited_at,
  parent_id,
  parentComment,
  changelogDetails: propChangelogDetails,
  itemDetails: propItemDetails,
  seasonDetails: propSeasonDetails,
  isLoading: propIsLoading,
}: CommentProps) {
  // Derive state from props directly
  const itemDetails = (propItemDetails as ItemDetails) || null;
  const changelogDetails = (propChangelogDetails as ChangelogDetails) || null;
  const seasonDetails = (propSeasonDetails as SeasonDetails) || null;
  const isLoading = propIsLoading || false;

  const formattedDate = formatRelativeDate(parseInt(date));
  const contentType = item_type.charAt(0).toUpperCase() + item_type.slice(1);

  const renderThumbnail = () => {
    if (item_type.toLowerCase() === "changelog") {
      return (
        <div className="relative mr-3 h-16 w-16 shrink-0 overflow-hidden rounded-md md:h-[4.5rem] md:w-32">
          <Image
            src={`https://assets.jailbreakchangelogs.xyz/assets/images/changelogs/${item_id}.webp`}
            alt={`Changelog ${item_id}`}
            fill
            className="object-cover"
            onError={handleImageError}
          />
        </div>
      );
    }

    if (item_type.toLowerCase() === "season") {
      return (
        <div className="relative mr-3 h-16 w-16 shrink-0 overflow-hidden rounded-md md:h-[4.5rem] md:w-32">
          <Image
            src={`https://assets.jailbreakchangelogs.xyz/assets/images/seasons/${item_id}/10.webp`}
            alt={`Season ${item_id}`}
            fill
            className="object-cover"
            onError={handleImageError}
          />
        </div>
      );
    }

    if (item_type.toLowerCase() === "trade") {
      return (
        <div className="relative mr-3 h-16 w-16 shrink-0 overflow-hidden rounded-md md:h-[4.5rem] md:w-32">
          <Image
            src="https://assets.jailbreakchangelogs.xyz/assets/logos/collab/JBCL_X_TC_Logo_Long_Light_Background.webp"
            alt="Trade Ad"
            fill
            className="object-cover"
            onError={handleImageError}
          />
        </div>
      );
    }

    if (item_type.toLowerCase() === "inventory") {
      return (
        <div className="relative mr-3 h-16 w-16 shrink-0 overflow-hidden rounded-md md:h-[4.5rem] md:w-32">
          <Image
            src={`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${item_id}&size=150x150&format=Png&isCircular=false`}
            alt={`User ${item_id}'s inventory`}
            fill
            className="object-cover"
            onError={handleImageError}
          />
        </div>
      );
    }

    // Handle item types that need item details (vehicle, weapon skin, etc.)
    const itemTypes = [
      "vehicle",
      "spoiler",
      "rim",
      "body color",
      "hyperchrome",
      "texture",
      "tire sticker",
      "tire style",
      "drift",
      "furniture",
      "horn",
      "weapon skin",
    ];

    if (itemTypes.includes(item_type.toLowerCase()) && itemDetails?.name) {
      // Use the same image utility as the values page, with light background for horns
      const imagePath = getItemImagePath(
        itemDetails.type,
        itemDetails.name,
        true,
        false,
      );

      // Special case for video items
      if (isVideoItem(itemDetails.name)) {
        return (
          <div className="relative mr-3 h-16 w-16 shrink-0 overflow-hidden rounded-md md:h-[4.5rem] md:w-32">
            <video
              src={getVideoPath(itemDetails.type, itemDetails.name)}
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
              onError={(e) => {
                console.error(
                  `Failed to load video: ${getVideoPath(itemDetails.type, itemDetails.name)}`,
                );
                // Use a simple image replacement since handleImageError expects an img element
                const videoEl = e.target as HTMLVideoElement;
                const parentEl = videoEl.parentElement;
                if (parentEl) {
                  const img = document.createElement("img");
                  img.src = "/assets/images/Placeholder.webp";
                  img.className = "object-cover h-full w-full";
                  parentEl.replaceChild(img, videoEl);
                }
              }}
            />
          </div>
        );
      }

      return (
        <div className="relative mr-3 h-16 w-16 shrink-0 overflow-hidden rounded-md md:h-[4.5rem] md:w-32">
          <Image
            src={imagePath}
            alt={`${item_type} ${itemDetails.name}`}
            fill
            className="object-cover"
            onError={handleImageError}
          />
        </div>
      );
    }

    // Show loading placeholder while fetching item details
    if (isLoading) {
      return (
        <div className="relative mr-3 h-16 w-16 shrink-0 animate-pulse overflow-hidden rounded-md md:h-[4.5rem] md:w-32"></div>
      );
    }

    return null;
  };

  // Get the item name to display
  const getItemName = () => {
    if (item_type.toLowerCase() === "changelog" && changelogDetails?.title) {
      return changelogDetails.title;
    }

    if (item_type.toLowerCase() === "season") {
      if (seasonDetails?.title) {
        return `Season ${item_id} / ${seasonDetails.title}`;
      }
      return `Season ${item_id}`;
    }

    if (item_type.toLowerCase() === "trade") {
      return `Trade #${item_id}`;
    }

    if (item_type.toLowerCase() === "inventory") {
      return `Inventory #${item_id}`;
    }

    if (itemDetails?.name) {
      return itemDetails.name;
    }

    // Show skeleton loading for item types that need details
    const itemTypesNeedingDetails = [
      "vehicle",
      "spoiler",
      "rim",
      "body color",
      "hyperchrome",
      "texture",
      "tire sticker",
      "tire style",
      "drift",
      "furniture",
      "horn",
      "weapon skin",
    ];

    if (
      itemTypesNeedingDetails.includes(item_type.toLowerCase()) &&
      isLoading
    ) {
      return null; // Will be handled by skeleton in render
    }

    return `${contentType} #${item_id}`;
  };

  return (
    <Link
      href={
        item_type.toLowerCase() === "changelog"
          ? `/changelogs/${item_id}`
          : item_type.toLowerCase() === "season"
            ? `/seasons/${item_id}`
            : item_type.toLowerCase() === "trade"
              ? `/trading/ad/${item_id}`
              : item_type.toLowerCase() === "inventory"
                ? `/inventories/${item_id}`
                : `/item/${item_type.toLowerCase()}/${itemDetails?.name}`
      }
      prefetch={false}
      className="group block"
    >
      <Box className="border-border-card bg-tertiary-bg rounded-lg border p-3 shadow-sm transition-colors">
        <div className="mb-2 flex">
          {renderThumbnail()}
          <div className="min-w-0 flex-1">
            {/* Item Title/Name First */}
            {getItemName() ? (
              <Typography
                variant="body2"
                className="text-primary-text group-hover:text-link mb-1 font-medium transition-colors"
                sx={{
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {getItemName()}
              </Typography>
            ) : (
              <Skeleton variant="text" width="80%" height={20} sx={{ mb: 1 }} />
            )}

            {/* Badge Second */}
            <div className="mb-2">
              <Chip
                label={contentType}
                size="small"
                variant="outlined"
                sx={{
                  backgroundColor: getCategoryColor(item_type) + "20", // Add 20% opacity
                  borderColor: getCategoryColor(item_type),
                  color: "var(--color-primary-text)",
                  fontSize: "0.65rem",
                  height: "20px",
                  fontWeight: "medium",
                  "&:hover": {
                    borderColor: getCategoryColor(item_type),
                    backgroundColor: getCategoryColor(item_type) + "30", // Slightly more opacity on hover
                  },
                }}
              />
            </div>

            {/* Comment Content Third */}
            {typeof parent_id === "number" && (
              <div className="bg-primary-bg/40 border-border-card mb-2 rounded-md border px-2 py-1">
                <Typography
                  variant="caption"
                  className="text-secondary-text block truncate text-[11px] font-medium"
                >
                  Reply to{" "}
                  {parentComment?.author
                    ? `@${parentComment.author}`
                    : `comment #${parent_id}`}
                </Typography>
                {parentComment?.content && (
                  <Typography
                    variant="caption"
                    className="text-secondary-text/80 block truncate text-[11px]"
                  >
                    {parentComment.content}
                  </Typography>
                )}
              </div>
            )}
            <Typography
              variant="body2"
              className="text-secondary-text wrap-break-word whitespace-pre-wrap"
              sx={{
                overflowWrap: "break-word",
                wordBreak: "break-word",
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
              }}
            >
              {convertUrlsToLinks(content, true)}
            </Typography>
          </div>
        </div>

        <Divider
          sx={{ my: 1, backgroundColor: "var(--color-border-primary)" }}
        />

        <div className="flex items-center justify-start text-xs">
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Typography
                  variant="caption"
                  className="text-secondary-text cursor-help"
                >
                  Posted {formattedDate}
                </Typography>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-primary-bg text-secondary-text border-none shadow-[var(--color-card-shadow)]"
              >
                <p>
                  {edited_at
                    ? formatCustomDate(edited_at)
                    : formatCustomDate(parseInt(date))}
                </p>
              </TooltipContent>
            </Tooltip>
            {edited_at && (
              <Typography variant="caption" className="text-secondary-text">
                (edited)
              </Typography>
            )}
          </div>
        </div>
      </Box>
    </Link>
  );
}
