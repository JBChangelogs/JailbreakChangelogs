import icons from "@/lib/robbery-icons.generated.json";

const normalize = (name: string) => name.toLowerCase().replace(/[\s_-]/g, "");
const iconsByName = new Map(
  icons.map((icon) => [normalize(icon.file.replace(/\.[^.]+$/, "")), icon]),
);

export default function RobberyMarkerIcon({
  markerName,
  name,
  className,
}: {
  markerName: string;
  name: string;
  className: string;
}) {
  const icon =
    iconsByName.get(normalize(markerName)) ?? iconsByName.get(normalize(name));
  if (!icon) return null;

  return (
    <span
      aria-hidden="true"
      className={`robbery-marker-icon shrink-0 ${className}`}
      style={{
        maskImage: `url("/robbery_icons/${encodeURIComponent(icon.file)}")`,
        maskMode: icon.maskMode === "luminance" ? "luminance" : "alpha",
      }}
    />
  );
}
