import type { Metadata } from "next";
import ExperimentsClient from "./ExperimentsClient";

export const metadata: Metadata = {
  title: "Experiments",
  description: "Preview experiments with your tester account.",
  robots: { index: false, follow: false },
};

export default function ExperimentsPage() {
  return <ExperimentsClient />;
}
