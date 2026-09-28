import ItemPageClient from "@/components/Items/ItemPageClient";
import NitroRailAd from "@/components/Ads/NitroRailAd";

interface Props {
  params: Promise<{
    type: string;
    name: string;
  }>;
}

export const revalidate = 0;

export default async function ItemDetailsPage({ params }: Props) {
  const { type, name } = await params;

  return (
    <>
      <NitroRailAd adIdSmall="np-item-rail" adIdWide="np-item-rail-wide" />
      <NitroRailAd
        adIdSmall="np-item-rail-right"
        adIdWide="np-item-rail-right-wide"
        side="right"
      />
      <ItemPageClient type={type} name={name} />
    </>
  );
}
