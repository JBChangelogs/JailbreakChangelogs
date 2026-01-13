"use client";

import { ThemeProvider } from "@mui/material";
import { darkTheme } from "@/theme/darkTheme";
import TimelineHeader from "./TimelineHeader";
import TimelineContent from "./TimelineContent";
import { Changelog } from "@/utils/api";

interface TimelineClientProps {
  changelogs: Changelog[];
}

export default function TimelineClient({ changelogs }: TimelineClientProps) {
  return (
    <ThemeProvider theme={darkTheme}>
      <TimelineHeader changelogs={changelogs} />
      <TimelineContent changelogs={changelogs} />
    </ThemeProvider>
  );
}
