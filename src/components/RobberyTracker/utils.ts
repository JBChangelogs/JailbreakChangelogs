export function formatServerTime(serverTime: number): string {
  const hours24 = Math.floor(serverTime);
  const minutes = Math.floor((serverTime % 1) * 60);
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function getStatusBadgeClass(status: number): string {
  switch (status) {
    case 1:
      return "text-primary-text border-status-success/30 bg-status-success/20";
    case 2:
      return "text-primary-text border-status-warning/30 bg-status-warning/20";
    default:
      return "text-primary-text border-border-card bg-tertiary-bg";
  }
}

export function isValidCasinoCode(code: string | null | undefined): boolean {
  return typeof code === "string" && /^\d+$/.test(code.trim());
}

export function robberyMarkerToImageName(markerName: string): string {
  return markerName === "MoneyTruck" ? "Bank Truck" : markerName;
}

export function robberyMarkerToDisplayName(
  markerName: string,
  apiName: string,
): string {
  return markerName === "MoneyTruck" ? "Bank Truck" : apiName;
}

export const ROBBERY_IMAGE_PRIORITY: readonly string[] = [
  "Jewelry",
  "TrainCargo",
  "PowerPlant",
  "Museum",
  "Casino",
  "Tomb",
  "MoneyTruck",
  "TrainPassenger",
  "CargoPlane",
  "Bank",
  "OilRig",
];

export const ROBBERY_PRIORITY_MAP: ReadonlyMap<string, number> = new Map(
  ROBBERY_IMAGE_PRIORITY.map((marker, i) => [marker, i]),
);
