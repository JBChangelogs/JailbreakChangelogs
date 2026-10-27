import icons from "@/lib/robbery-icons.generated.json";

const normalize = (name: string) => name.toLowerCase().replace(/[\s_-]/g, "");
const iconsByName = new Map(
  icons.map((file) => [normalize(file.replace(/\.[^.]+$/, "")), file]),
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
  const file =
    iconsByName.get(normalize(markerName)) ?? iconsByName.get(normalize(name));
  if (!file) return null;

  return (
    <span
      aria-hidden="true"
      className={`robbery-marker-icon shrink-0 ${className}`}
      style={{ maskImage: `url("/robbery_icons/${encodeURIComponent(file)}")` }}
    />
  );
}
