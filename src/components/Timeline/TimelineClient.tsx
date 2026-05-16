"use client";

import TimelineHeader from "./TimelineHeader";
import TimelineContent from "./TimelineContent";
import { Changelog } from "@/utils/api/api";

interface TimelineClientProps {
  changelogs: Changelog[];
}

export default function TimelineClient({ changelogs }: TimelineClientProps) {
  return (
    <>
      <TimelineHeader changelogs={changelogs} />
      <TimelineContent changelogs={changelogs} />
    </>
  );
}
