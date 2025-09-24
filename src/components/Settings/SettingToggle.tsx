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
                color: "var(--color-button-info)",
              },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                backgroundColor: "var(--color-button-info)",
              },
              "& .MuiSwitch-track": {
                backgroundColor: "var(--color-primary-bg)",
                border: "1px solid var(--color-border-primary)",
              },
              "&.Mui-disabled": {
                color: "var(--color-primary-text)",
                "& + .MuiSwitch-track": {},
              },
            }}
          />
        }
        label={
          <Box>
            <Typography
              variant="subtitle1"
              component="div"
              sx={{ color: "var(--color-primary-text)" }}
            >
              {config.displayName}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "var(--color-secondary-text)" }}
            >
              {config.description}
            </Typography>
          </Box>
        }
      />
    </Box>
  );
};
