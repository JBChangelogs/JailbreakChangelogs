"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import CustomThemeEditor from "@/components/Settings/CustomThemeEditor";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  closeThemeEditor,
  getThemeEditor,
  subscribeThemeEditor,
} from "@/utils/ui/themeEditor";

const THEMES_SETTINGS = "/settings?highlight=themes#themes";

/**
 * Shows the custom theme editor while it's open, on any page, so the user
 * can browse the site with their draft applied. Cancelling asks first, so
 * they can keep editing; after a save away from settings, it asks whether
 * to go back there.
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
  // The editor closes the same way after a save as on cancel; this tells them apart.
  const savedRef = useRef(false);
  const [askDiscard, setAskDiscard] = useState(false);
  const [askBack, setAskBack] = useState(false);
  const onSettings = pathname === "/settings";

  const discard = (goToSettings: boolean) => {
    setAskDiscard(false);
    closeThemeEditor();
    if (goToSettings) router.push(THEMES_SETTINGS);
  };

  return (
    <>
      {editor && (
        <CustomThemeEditor
          key={editor.theme?.id ?? "new"}
          theme={editor.theme}
          open
          onOpenChange={(open) => {
            if (open) return;
            if (!savedRef.current) {
              // Cancel or Escape: the draft stays until they choose.
              setAskDiscard(true);
              return;
            }
            savedRef.current = false;
            closeThemeEditor();
            if (!onSettings) setAskBack(true);
          }}
          onSaved={() => {
            savedRef.current = true;
            void queryClient.invalidateQueries({
              queryKey: ["my-themes", user?.id],
            });
          }}
        />
      )}

      <Dialog open={askDiscard} onOpenChange={setAskDiscard}>
        <DialogContent className="max-w-md rounded-lg p-6" showClose>
          <DialogHeader>
            <DialogTitle>Discard your changes?</DialogTitle>
            <DialogDescription>
              Your theme hasn&apos;t been saved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => discard(false)}>
              Discard
            </Button>
            {!onSettings && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => discard(true)}
              >
                Discard and go to settings
              </Button>
            )}
            <Button size="sm" onClick={() => setAskDiscard(false)}>
              Keep editing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={askBack}
        onClose={() => setAskBack(false)}
        onConfirm={() => router.push(THEMES_SETTINGS)}
        title="Back to settings?"
        message="Your theme is saved. Go back to your theme settings, or stay on this page."
        confirmText="Back to settings"
        confirmVariant="default"
        cancelText="Stay here"
      />
    </>
  );
}
