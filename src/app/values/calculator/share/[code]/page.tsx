import type { Metadata } from "next";
import { withDiscordEmbed } from "@/lib/discord-embed";
import { CALCULATOR_SHARE_CODE } from "@/components/Values/Calculator/calculatorShareCode";
import { pageMetadata } from "../../layout";

// The proxy rewrites /values/calculator?share=CODE here so each share gets its
// own OG image while staying ISR. The browser URL keeps ?share= for the client.
export { default } from "../../page";
export const revalidate = 120;
export const generateStaticParams = () => [];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const code = (await params).code.toUpperCase();
  return withDiscordEmbed(
    pageMetadata,
    CALCULATOR_SHARE_CODE.test(code)
      ? `/values/calculator?share=${code}`
      : "/values/calculator",
  );
}
