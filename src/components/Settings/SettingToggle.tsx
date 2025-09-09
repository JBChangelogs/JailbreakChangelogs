import { Switch, FormControlLabel, Box, Typography } from "@mui/material";
import { SettingConfigItem } from "@/config/settings";
import { UserSettings } from "@/types/auth";

interface SettingToggleProps {
  name: keyof UserSettings;
  value: number;
  config: SettingConfigItem;
  onChange: (name: keyof UserSettings, value: number) => void;
  disabled?: boolean;
  userData?: {
    premiumtype?: number;
  };
}

export const SettingToggle = ({
  name,
  value,
  config,
  onChange,
  disabled,
  userData,
}: SettingToggleProps) => {
  const isPremiumFeature =
    name === "banner_discord" || name === "avatar_discord";
  const premiumRequired =
    isPremiumFeature && (!userData?.premiumtype || userData.premiumtype === 0);
  const premiumTier = name === "banner_discord" ? 2 : 1;

  return (
    <Box sx={{ mb: 2 }}>
      <FormControlLabel
        control={
          <Switch
            checked={value === 1}
            onChange={(e) => onChange(name, e.target.checked ? 1 : 0)}
            name={name}
            disabled={disabled}
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked": {
                color: "#1d7da3",
              },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                backgroundColor: "#1d7da3",
              },
              "&.Mui-disabled": {
                color: "#FFFFFF",
                "& + .MuiSwitch-track": {
                  backgroundColor: "#2E3944",
                },
              },
            }}
          />
        }
        label={
          <Box>
            <Typography
              variant="subtitle1"
              component="div"
              sx={{ color: "#D3D9D4" }}
            >
              {config.displayName}
            </Typography>
            <Typography variant="body2" sx={{ color: "#FFFFFF" }}>
              {config.description}
            </Typography>
            {premiumRequired && (
              <Typography
                variant="body2"
                sx={{
                  color: "#FF6B6B",
                  mt: 0.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                🔒 Upgrade to Premium Tier {premiumTier} to unlock custom{" "}
                {name === "banner_discord" ? "banners" : "avatars"}
              </Typography>
            )}
          </Box>
        }
      />
    </Box>
  );
};
