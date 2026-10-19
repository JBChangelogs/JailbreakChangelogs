import React, { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Icon } from "@/components/ui/IconWrapper";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ChangelogFilterProps {
  changelogList: Array<{ id: number; title: string }>;
  selectedId: string;
  onChangelogSelect: (id: string) => void;
}

const ROW_HEIGHT = 36;

// Virtualized: a Radix menu mounting 400+ items took ~600ms to open
const ChangelogFilter: React.FC<ChangelogFilterProps> = ({
  changelogList,
  selectedId,
  onChangelogSelect,
}) => {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [listEl, setListEl] = useState<HTMLDivElement | null>(null);
  const typeahead = useRef({ text: "", at: 0 });

  const sorted = useMemo(
    () => [...changelogList].sort((a, b) => b.id - a.id),
    [changelogList],
  );
  const selectedIndex = sorted.findIndex(
    (item) => item.id.toString() === selectedId,
  );
  const selectedLabel = sorted[selectedIndex]?.title ?? "";

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: sorted.length,
    getScrollElement: () => listEl,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  // -1: nothing highlighted until hover or arrow keys, like the Radix menus
  useEffect(() => {
    if (!open || !listEl) return;
    setHighlighted(-1);
    virtualizer.scrollToIndex(Math.max(selectedIndex, 0), { align: "center" });
    listEl.focus();
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [open, listEl]);

  const move = (index: number) => {
    const next = Math.min(Math.max(index, 0), sorted.length - 1);
    setHighlighted(next);
    virtualizer.scrollToIndex(next);
  };

  const pick = (index: number) => {
    const item = sorted[index];
    if (!item) return;
    setOpen(false);
    onChangelogSelect(item.id.toString());
  };

  // Typing "300" jumps to #300, typing letters matches the title
  const jumpTo = (char: string) => {
    const now = Date.now();
    const t = typeahead.current;
    t.text = now - t.at > 700 ? char : t.text + char;
    t.at = now;
    const query = t.text.toLowerCase();
    const index = sorted.findIndex(
      (item) =>
        item.id.toString().startsWith(query) ||
        item.title.toLowerCase().startsWith(query),
    );
    if (index !== -1) move(index);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // First arrow press lands on the current changelog
    const from = highlighted === -1 ? Math.max(selectedIndex, 0) : highlighted;
    const step = highlighted === -1 ? 0 : 1;
    const keys: Record<string, () => void> = {
      ArrowDown: () => move(from + step),
      ArrowUp: () => move(from - step),
      Home: () => move(0),
      End: () => move(sorted.length - 1),
      PageDown: () => move(from + 8),
      PageUp: () => move(from - 8),
      Enter: () => pick(highlighted),
      " ": () => pick(highlighted),
    };
    if (keys[e.key]) {
      e.preventDefault();
      keys[e.key]();
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      jumpTo(e.key);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-10 w-full shrink-0 items-center justify-between gap-2 rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none sm:w-72"
          aria-label="Select a changelog"
          aria-haspopup="listbox"
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
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="bg-secondary-bg w-(--radix-popover-trigger-width) rounded-xl p-1"
      >
        <div
          ref={setListEl}
          role="listbox"
          aria-label="Changelogs"
          aria-activedescendant={
            highlighted >= 0
              ? `changelog-option-${sorted[highlighted]?.id}`
              : undefined
          }
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onMouseLeave={() => setHighlighted(-1)}
          className="max-h-80 scrollbar-thin overflow-x-hidden overflow-y-auto outline-none"
        >
          <div
            className="relative w-full"
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualizer.getVirtualItems().map(({ index, start }) => {
              const item = sorted[index];
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  id={`changelog-option-${item.id}`}
                  role="option"
                  aria-selected={isSelected}
                  title={`#${item.id} - ${item.title}`}
                  onClick={() => pick(index)}
                  onMouseMove={() => setHighlighted(index)}
                  className={`absolute top-0 left-0 flex w-full cursor-pointer items-center rounded-lg px-3 pr-8 text-sm transition-colors select-none ${
                    index === highlighted ? "bg-quaternary-bg" : ""
                  }`}
                  style={{
                    height: ROW_HEIGHT,
                    transform: `translateY(${start}px)`,
                  }}
                >
                  <span className="truncate">
                    #{item.id} - {item.title}
                  </span>
                  {isSelected && (
                    <Icon
                      icon="lucide:check"
                      className="absolute right-2 h-4 w-4"
                      inline={true}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ChangelogFilter;
