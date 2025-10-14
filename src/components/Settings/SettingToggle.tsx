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
          className="group dark:bg-primary-bg border-border-primary data-checked:bg-button-info inline-flex h-6 w-11 cursor-pointer items-center rounded-full border bg-gray-200 transition data-disabled:cursor-not-allowed data-disabled:opacity-50"
        >
          <span className="size-4 translate-x-1 rounded-full bg-white transition group-data-checked:translate-x-6 dark:bg-gray-200" />
        </Switch>
      </Field>
    </div>
  );
};
