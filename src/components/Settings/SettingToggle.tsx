import { Switch, Field, Label, Description } from "@headlessui/react";
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
    <div className="mb-2">
      <Field disabled={disabled}>
        <Label className="text-primary-text text-base font-medium">
          {config.displayName}
        </Label>
        <Description className="text-secondary-text text-sm">
          {config.description}
        </Description>
        <Switch
          checked={value === 1}
          onChange={(checked) => onChange(name, checked ? 1 : 0)}
          className="group inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-primary-bg border border-border-primary transition data-checked:bg-button-info data-disabled:cursor-not-allowed data-disabled:opacity-50 cursor-pointer"
        >
          <span className="size-4 translate-x-1 rounded-full bg-white dark:bg-gray-200 transition group-data-checked:translate-x-6" />
        </Switch>
      </Field>
    </div>
  );
};
