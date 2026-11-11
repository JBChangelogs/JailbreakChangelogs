// Based on JailbreakChangelogsApp src/shared/tradeScan.ts, with PP-OCR label/name fixes
// (typeLabelRatio, no knownItemWords snapping, no all-caps rule) — keep the two in sync.
// Turns OCR detections from a trade screenshot into offering/requesting items.
// Port of the Python scanner (Scanner/services/scan.py, steps 3-10). Pure: no I/O, no Electron.

// Every tunable lives here. The original values were tuned for EasyOCR; retune against
// the golden screenshots for PP-OCR.
export const SCAN_TUNING = {
  maxWidth: 4000,
  maxHeight: 3000,
  maxDetections: 100,
  anchorWords: ["accept", "decline", "exit", "ready"],
  anchorMinConf: 0.5,
  // Only shown in the trade menu (not the inventory); auto scan requires one of them.
  tradeMenuWords: ["exit", "ready"],
  // The game allows at most this many items per side.
  maxItemsPerSide: 8,
  minConf: 0.1,
  minTextLength: 3,
  // What the game prints above each item name. Body colors show as "COLOR".
  typeLabels: [
    "body color",
    "color",
    "vehicle",
    "furniture",
    "spoiler",
    "tire style",
    "hyperchrome",
    "texture",
    "horn",
    "weapon skin",
    "rim",
    "drift",
    "tire sticker",
  ],
  // No catalog name scores above ~74 against a label (FreeStyle vs "tire style"); at 60,
  // names like Shogun/Cobra/Python were read as labels. 80 still allows one misread letter.
  typeLabelRatio: 80,
  dedupeDistance: 40,
  kmeansIterations: 20,
  singleRowSpread: 2,
  requestingRowMaxDistance: 16,
  uiBlocklist: [
    "accept",
    "decline",
    "trade",
    "trade chat",
    "lf",
    "tr",
    "wfl",
    "or",
    "for",
    "any",
    "pm",
  ],
  maxHorizontalLabelWidths: 3,
  maxAboveLabelHeights: 1.5,
  maxBelowLabelHeights: 3,
  verticalWeight: 1.5,
  horizontalWeight: 0.5,
  lookupMinRatio: 50,
  // Compared against normalised type keys. The Python version compares raw names, so it never skips anything.
  skipTypes: [
    "suspensionheight",
    "engine",
    "consumable",
    "safe",
    "brakes",
    "windowtint",
  ],
};

export interface OcrDetection {
  // Axis-aligned box in image pixels.
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  text: string;
  conf: number;
}
export interface ScanCatalogItem {
  id: number;
  name: string;
  type: string;
}

export interface ScannedItem {
  name: string;
  type: string;
  id: number;
  score: number;
}

export interface TradeScanResult {
  offering: ScannedItem[];
  requesting: ScannedItem[];
  // An "Exit" or "Ready" button was read, so this is the trade menu rather than e.g. the inventory.
  inTradeMenu: boolean;
}

export type TradeScanErrorCode = "too_many_text_regions";

export class TradeScanError extends Error {
  code: TradeScanErrorCode;

  constructor(code: TradeScanErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

// rapidfuzz fuzz.ratio: normalised Indel similarity, 0-100.
export function fuzzRatio(a: string, b: string): number {
  if (a.length + b.length === 0) return 100;
  let prev = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    const row = new Array<number>(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j++) {
      row[j] =
        a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], row[j - 1]);
    }
    prev = row;
  }
  return (200 * prev[b.length]) / (a.length + b.length);
}

const cx = (d: OcrDetection): number => (d.x0 + d.x1) / 2;
const cy = (d: OcrDetection): number => (d.y0 + d.y1) / 2;
const normaliseKey = (s: string): string =>
  s.toLowerCase().replace(/[\s\-.]/g, "");

function bestMatch(
  text: string,
  choices: readonly string[],
): { choice: string; score: number } {
  let best = { choice: "", score: 0 };
  for (const choice of choices) {
    const score = fuzzRatio(text, choice);
    if (score > best.score) best = { choice, score };
  }
  return best;
}

// Step 8: 1D k-means (k=2) on label centre-y; top cluster is offering.
function assignSides(
  labels: OcrDetection[],
  imageHeight: number,
  anchors: OcrDetection[],
): ("offering" | "requesting")[] {
  const ys = labels.map(cy);
  const byHalf = (): ("offering" | "requesting")[] =>
    ys.map((y) => (y < imageHeight / 2 ? "offering" : "requesting"));
  if (labels.length === 0) return [];

  const heights = labels.map((l) => l.y1 - l.y0).sort((a, b) => a - b);
  const unit = Math.max(1, heights[Math.floor(heights.length / 2)]);
  if (Math.max(...ys) - Math.min(...ys) < SCAN_TUNING.singleRowSpread * unit) {
    if (anchors.length === 0) return byHalf();
    const rowY = ys.reduce((a, b) => a + b, 0) / ys.length;
    const buttonsY = Math.max(...anchors.map(cy));
    const side =
      buttonsY - rowY < SCAN_TUNING.requestingRowMaxDistance * unit
        ? "requesting"
        : "offering";
    return ys.map(() => side);
  }

  let centers = [Math.min(...ys), Math.max(...ys)];
  if (centers[0] === centers[1]) return byHalf();
  let assignment: number[] = [];
  for (let iter = 0; iter < SCAN_TUNING.kmeansIterations; iter++) {
    assignment = ys.map((y) =>
      Math.abs(y - centers[0]) <= Math.abs(y - centers[1]) ? 0 : 1,
    );
    const next = [0, 1].map((k) => {
      const members = ys.filter((_, i) => assignment[i] === k);
      return members.length
        ? members.reduce((a, b) => a + b, 0) / members.length
        : NaN;
    });
    if (next.some(Number.isNaN)) return byHalf();
    if (next[0] === centers[0] && next[1] === centers[1]) break;
    centers = next;
  }
  const top = centers[0] <= centers[1] ? 0 : 1;
  return assignment.map((k) => (k === top ? "offering" : "requesting"));
}

function lookupItem(
  name: string,
  catalog: ScanCatalogItem[],
): ScannedItem | null {
  const query = normaliseKey(name);
  const skip = new Set(SCAN_TUNING.skipTypes);
  let best: ScannedItem | null = null;
  for (const item of catalog) {
    if (skip.has(normaliseKey(item.type))) continue;
    const score = fuzzRatio(query, normaliseKey(item.name));
    if (score >= SCAN_TUNING.lookupMinRatio && (!best || score > best.score)) {
      best = { name: item.name, type: item.type, id: item.id, score };
    }
  }
  return best;
}

export function parseTradeScan(
  raw: OcrDetection[],
  imageHeight: number,
  catalog: ScanCatalogItem[],
): TradeScanResult {
  const t = SCAN_TUNING;

  // Step 3: split "a | b" into separate detections sharing the box.
  let detections = raw.flatMap((d) =>
    d.text.includes("|")
      ? d.text
          .split("|")
          .map((part) => part.trim())
          .filter(Boolean)
          .map((text) => ({ ...d, text }))
      : [d],
  );

  // Step 4
  if (detections.length > t.maxDetections) {
    throw new TradeScanError(
      "too_many_text_regions",
      "Too much text in the image to read a trade.",
    );
  }

  // Step 5: keep everything above the bottom of the trade window's buttons.
  const anchorWord = (d: OcrDetection): string =>
    d.text.toLowerCase().split("(")[0].trim();
  const anchors = detections.filter(
    (d) => d.conf > t.anchorMinConf && t.anchorWords.includes(anchorWord(d)),
  );
  const inTradeMenu = anchors.some((a) =>
    t.tradeMenuWords.includes(anchorWord(a)),
  );
  if (anchors.length > 0) {
    const bottom = Math.max(...anchors.map((a) => a.y1));
    detections = detections.filter((d) => cy(d) >= 0 && cy(d) <= bottom);
  }

  // Step 6: classify.
  const labels: OcrDetection[] = [];
  let candidates: OcrDetection[] = [];
  for (const d of detections) {
    const text = d.text.trim();
    if (d.conf < t.minConf || text.length < t.minTextLength) continue;
    const lower = text.toLowerCase();
    if (bestMatch(lower, t.typeLabels).score >= t.typeLabelRatio) {
      labels.push({ ...d, text });
    } else {
      candidates.push({ ...d, text });
    }
  }

  // OCR boxes come sorted by top edge, so a label 1px higher jumps the queue.
  // Each side is one row, so left-to-right matches the in-game order.
  labels.sort((a, b) => a.x0 - b.x0);

  // Step 7: dedupe candidates.
  candidates = candidates.filter(
    (d, i) =>
      !candidates
        .slice(0, i)
        .some(
          (o) =>
            o.text.toLowerCase() === d.text.toLowerCase() &&
            Math.hypot(cx(o) - cx(d), cy(o) - cy(d)) < t.dedupeDistance,
        ),
  );

  // Step 8
  const sides = assignSides(labels, imageHeight, anchors);

  // Step 9: pair each label with the closest valid item name.
  const labelSet = new Set(t.typeLabels);
  const blocklist = new Set(t.uiBlocklist);
  const used = new Set<OcrDetection>();
  const result: TradeScanResult = { offering: [], requesting: [], inTradeMenu };
  labels.forEach((label, i) => {
    const width = label.x1 - label.x0;
    const height = label.y1 - label.y0;
    let best: { cand: OcrDetection; score: number } | null = null;
    for (const cand of candidates) {
      if (used.has(cand)) continue;
      const lower = cand.text.toLowerCase();
      if (labelSet.has(lower) || blocklist.has(lower)) continue;
      // No all-caps check: PP-OCR sometimes returns names in mixed case ("Javelin").
      if (cand.text.length < 3 || !/[A-Za-z]/.test(cand.text)) continue;
      const hDiff = Math.abs(cx(cand) - cx(label));
      const vDiff = cy(cand) - cy(label);
      if (hDiff > width * t.maxHorizontalLabelWidths) continue;
      if (
        vDiff < -height * t.maxAboveLabelHeights ||
        vDiff > height * t.maxBelowLabelHeights
      )
        continue;
      const score =
        Math.abs(vDiff) * t.verticalWeight + hDiff * t.horizontalWeight;
      if (!best || score < best.score) best = { cand, score };
    }
    if (!best) return;
    used.add(best.cand);
    // Step 10: unmatched names drop out, as on the server.
    const item = lookupItem(best.cand.text, catalog);
    if (item) result[sides[i]].push(item);
  });

  return result;
}
