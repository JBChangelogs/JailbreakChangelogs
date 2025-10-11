import { Icon } from "../UI/IconWrapper";

export const RobloxIcon = ({ className }: { className?: string }) => (
  <Icon
    icon="simple-icons:roblox"
    className={`text-primary-text ${className || ""}`}
    inline={true}
  />
);
