"use client";

import { Tabs, Tab, Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";

interface UserTypeTabsProps {
  userType: "discord" | "roblox";
  onUserTypeChange: (type: "discord" | "roblox") => void;
}

const StyledTabs = styled(Tabs)(() => ({
  minHeight: "unset",
  "& .MuiTabs-indicator": {
    backgroundColor: "var(--color-button-info)",
    height: "2px",
  },
}));

const StyledTab = styled(Tab)(() => ({
  textTransform: "none",
  color: "var(--color-secondary-text)",
  minHeight: "unset",
  padding: "6px 12px",
  fontSize: "0.875rem",
  "&.Mui-selected": {
    color: "var(--color-primary-text)",
  },
  "& .MuiSvgIcon-root": {
    marginRight: "4px",
    fontSize: "1rem",
  },
}));

export default function UserTypeTabs({
  userType,
  onUserTypeChange,
}: UserTypeTabsProps) {
  const handleChange = (
    _: React.SyntheticEvent,
    newValue: "discord" | "roblox",
  ) => {
    onUserTypeChange(newValue);
  };

  return (
    <Box sx={{ display: "inline-flex" }}>
      <StyledTabs
        value={userType}
        onChange={handleChange}
        aria-label="user type tabs"
        variant="standard"
      >
        <StyledTab
          value="discord"
          label="Discord"
          icon={<DiscordIcon className="h-4 w-4" />}
          iconPosition="start"
        />
        <StyledTab
          value="roblox"
          label="Roblox"
          icon={<RobloxIcon className="h-4 w-4" />}
          iconPosition="start"
        />
      </StyledTabs>
    </Box>
  );
}
