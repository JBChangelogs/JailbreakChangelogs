"use client";

import { useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import CustomThemeEditor from "@/components/Settings/CustomThemeEditor";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  closeThemeEditor,
  getThemeEditor,
  subscribeThemeEditor,
} from "@/utils/ui/themeEditor";

const THEMES_SETTINGS = "/settings?highlight=themes#themes";

/**
 * Shows the custom theme editor while it's open, on any page, so the user
 * can browse the site with their draft applied. The editor asks about
 * unsaved changes itself; closing it after a save away from settings shows
 * a short toast with a way back there.
 */
export default function ThemeEditorHost() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const editor = useSyncExternalStore(
    subscribeThemeEditor,
    getThemeEditor,
    () => null,
  );

  if (!editor) return null;
  return (
    <CustomThemeEditor
      key={editor.theme?.id ?? "new"}
      theme={editor.theme}
      open
      onClose={(reason) => {
        closeThemeEditor();
        if (reason === "cancelled-to-settings") router.push(THEMES_SETTINGS);
        else if (reason === "saved" && pathname !== "/settings") {
          // Saving already said so; this only offers the way back.
          toast("Theme editor closed", {
            duration: 6000,
            action: {
              label: "Back to settings",
              onClick: () => router.push(THEMES_SETTINGS),
            },
          });
        }
      }}
      onSaved={() =>
        void queryClient.invalidateQueries({
          queryKey: ["my-themes", user?.id],
        })
      }
    />
  );
}
