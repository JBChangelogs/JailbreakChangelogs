import { Switch, Field, Label, Description } from "@headlessui/react";

export type NotificationPreferenceToggleProps = {
  title: string;
  enabled: boolean;
  onChange: (nextEnabled: boolean) => void;
  description?: string;
  disabled?: boolean;
};

function humanizeTitle(title: string) {
  return title
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function NotificationPreferenceToggle({
  title,
  enabled,
  onChange,
  description,
  disabled,
}: NotificationPreferenceToggleProps) {
  return (
    <div className="mb-2">
      <Field disabled={disabled}>
        <Label className="text-primary-text text-base font-medium">
          {humanizeTitle(title)}
        </Label>
        <Description className="text-secondary-text text-sm">
          {description ?? "Manage this notification type"}
        </Description>
        <Switch
          checked={enabled}
          onChange={(checked) => onChange(checked)}
          className="data-checked:bg-button-info group border-border-primary dark:bg-primary-bg inline-flex h-6 w-11 cursor-pointer items-center rounded-full border bg-gray-200 transition data-disabled:cursor-not-allowed data-disabled:opacity-50"
        >
          <span className="size-4 translate-x-1 rounded-full bg-white transition group-data-checked:translate-x-6 dark:bg-gray-200" />
        </Switch>
      </Field>
    </div>
  );
}
