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
}: SettingToggleProps) => {
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
          </Box>
        }
      />
    </Box>
  );
};
