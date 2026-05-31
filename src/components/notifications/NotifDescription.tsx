"use client";

import { TwemojiText } from "@/components/ui/TwemojiText";
import { renderNotifDescription } from "@/utils/notifications/notifMarkdown";

type NotifDescriptionProps = {
  text: string;
  className?: string;
};

export function NotifDescription({
  text,
  className = "text-muted-foreground text-sm leading-relaxed",
}: NotifDescriptionProps) {
  return (
    <TwemojiText tag="div" className={className}>
      {renderNotifDescription(text)}
    </TwemojiText>
  );
}
