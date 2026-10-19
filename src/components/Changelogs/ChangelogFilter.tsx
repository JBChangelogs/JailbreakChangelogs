import React from "react";
import { Icon } from "@/components/ui/IconWrapper";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChangelogFilterProps {
  changelogList: Array<{ id: number; title: string }>;
  selectedId: string;
  onChangelogSelect: (id: string) => void;
}

const ChangelogFilter: React.FC<ChangelogFilterProps> = ({
  changelogList,
  selectedId,
  onChangelogSelect,
}) => {
  const sortedChangelogs = [...changelogList].sort((a, b) => b.id - a.id);
  const selectedLabel =
    sortedChangelogs.find((item) => item.id.toString() === selectedId)?.title ??
    "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-10 w-full shrink-0 items-center justify-between gap-2 rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none sm:w-72"
          aria-label="Select a changelog"
        >
          <span className="truncate">
            {selectedId
              ? `#${selectedId} - ${selectedLabel}`
              : "Select a changelog"}
          </span>
          <Icon
            icon="heroicons:chevron-down"
            className="text-secondary-text h-5 w-5"
            inline={true}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="border-border-card bg-secondary-bg text-primary-text max-h-80 w-(--radix-popper-anchor-width) min-w-(--radix-popper-anchor-width) scrollbar-thin overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
      >
        <DropdownMenuRadioGroup
          value={selectedId}
          onValueChange={onChangelogSelect}
        >
          {sortedChangelogs.map((item) => (
            <DropdownMenuRadioItem
              key={item.id}
              value={item.id.toString()}
              className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
            >
              #{item.id} - {item.title}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ChangelogFilter;
