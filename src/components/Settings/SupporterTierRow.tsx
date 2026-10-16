import type { ReactNode } from "react";
import Image from "next/image";
import { Icon } from "@/components/ui/IconWrapper";
import { supporterBadgeUrl } from "@/utils/auth/supporterAccess";

/**
 * A supporter tier or gift: its badge, name and a detail line on the left,
 * its actions on the right, all centered on one line. On narrow screens the
 * actions drop below at full width.
 */
export function SupporterTierRow({
  level,
  name,
  detail,
  actions,
}: {
  level: number;
  name: string;
  detail?: ReactNode;
  actions?: ReactNode;
}) {
  const badge = supporterBadgeUrl(level);
  return (
    <div className="bg-tertiary-bg border-border-card flex flex-wrap items-center gap-x-4 gap-y-3 rounded-lg border p-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {badge ? (
          // The name beside it says which tier, so the badge is decorative.
          <Image
            src={badge}
            alt=""
            width={28}
            height={28}
            className="size-7 shrink-0 object-contain"
          />
        ) : (
          <Icon
            icon="material-symbols:person-rounded"
            aria-hidden="true"
            className="text-secondary-text size-7 shrink-0"
          />
        )}
        <div className="min-w-0">
          <p className="text-primary-text text-sm font-semibold">{name}</p>
          {detail && (
            <p className="text-secondary-text mt-0.5 text-sm">{detail}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex w-full gap-2 sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-none">
          {actions}
        </div>
      )}
    </div>
  );
}
