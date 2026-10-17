import type { ReactNode } from "react";
import { CopyLinkButton } from "./CopyLinkButton";
import { SETTING_HIGHLIGHT } from "./SettingsCard";

/**
 * One setting: its title and description on the left, its action (a button
 * or switch) on the right. On narrow screens a button drops below at full
 * width, while a switch stays beside the text. The same text sizes as every
 * other setting row.
 */
export function SettingRow({
  title,
  description,
  action,
  onCopyLink,
  highlight = false,
  children,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  /** Owners get a copy-link button beside the title. */
  onCopyLink?: () => void;
  /** Highlight on hover, for rows whose action is a switch. */
  highlight?: boolean;
  /** Extra content under the row, such as a connected account. */
  children?: ReactNode;
}) {
  return (
    <div className={`group/setting ${highlight ? SETTING_HIGHLIGHT : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-primary-text text-base font-medium">{title}</h3>
            {onCopyLink && (
              <CopyLinkButton
                label={`Copy link to ${title}`}
                onClick={onCopyLink}
                scope="setting"
              />
            )}
          </div>
          {description && (
            <p className="text-secondary-text mt-1 text-sm">{description}</p>
          )}
        </div>
        {action && (
          <div className="flex w-full shrink-0 gap-2 has-[>[role=switch]]:w-auto sm:w-auto sm:[&>*]:flex-none [&>*:not([role=switch])]:flex-1">
            {action}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
