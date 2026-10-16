import { CopyLinkButton } from "./CopyLinkButton";

interface SettingsSubsectionHeadingProps {
  title: string;
  onCopyLink?: () => void;
}

export function SettingsSubsectionHeading({
  title,
  onCopyLink,
}: SettingsSubsectionHeadingProps) {
  return (
    <div className="group/setting mb-1 flex items-center gap-2">
      <h3 className="text-primary-text text-lg font-semibold">{title}</h3>
      {onCopyLink && (
        <CopyLinkButton
          label={`Copy link to ${title}`}
          onClick={onCopyLink}
          scope="setting"
        />
      )}
    </div>
  );
}
