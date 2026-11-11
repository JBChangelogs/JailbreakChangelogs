// Browser PaddleOCR (PP-OCRv3 det + English rec) via onnxruntime-web.
// Port of JailbreakChangelogsApp src-tauri/src/ocr.rs (CPU path: batch 1, exact widths).
import type { InferenceSession } from "onnxruntime-web";
import { SCAN_TUNING, type OcrDetection } from "./tradeScan";

// Apache-2.0 models, pinned to a commit so they can't change under us.
// ponytail: served from Hugging Face; move to assets.jailbreakchangelogs.com if HF becomes a problem.
const MODEL_BASE =
  "https://huggingface.co/monkt/paddleocr-onnx/resolve/7b02d0a30a07ba2b92ad1ff5a8941ae2c633de65/";

const DET_MAX_SIDE = 960;
const DET_BINARY_THRESHOLD = 0.3;
const DET_BOX_THRESHOLD = 0.6;
const DET_UNCLIP_RATIO = 1.5;
const DET_MIN_SIDE = 3;
const REC_HEIGHT = 48;
const REC_MAX_WIDTH = 1920;

type Triple = readonly [number, number, number];
const DET_MEAN: Triple = [0.485, 0.456, 0.406];
const DET_STD: Triple = [0.229, 0.224, 0.225];
const REC_MEAN: Triple = [0.5, 0.5, 0.5];
const REC_STD: Triple = [0.5, 0.5, 0.5];
const BGR: Triple = [2, 1, 0];

interface Crop {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Img {
  rgba: Uint8ClampedArray;
  width: number;
  height: number;
}

type Ort = typeof import("onnxruntime-web");
interface Ocr {
  ort: Ort;
  det: InferenceSession;
  rec: InferenceSession;
  dict: string[];
}

let ocrPromise: Promise<Ocr> | null = null;

// Lazy: the runtime (~10 MB wasm) and models (~10 MB) only download on the first scan.
function loadOcr(): Promise<Ocr> {
  ocrPromise ??= (async () => {
    const ort = await import("onnxruntime-web");
    ort.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ort.env.versions.web}/dist/`;
    const [det, rec, dict] = await Promise.all([
      ort.InferenceSession.create(`${MODEL_BASE}detection/v3/det.onnx`),
      ort.InferenceSession.create(`${MODEL_BASE}languages/english/rec.onnx`),
      fetch(`${MODEL_BASE}languages/english/dict.txt`)
        .then((r) => {
          if (!r.ok) throw new Error(`OCR dictionary failed (${r.status})`);
          return r.text();
        })
        .then((t) => t.split(/\r?\n/).filter(Boolean)),
    ]);
    return { ort, det, rec, dict };
  })().catch((error: unknown) => {
    ocrPromise = null; // let the next scan retry
    throw error;
  });
  return ocrPromise;
}

// Bilinear resize of `crop` to out_w x out_h, RGBA -> normalised BGR CHW.
function toChw(
  img: Img,
  crop: Crop,
  outW: number,
  outH: number,
  mean: Triple,
  std: Triple,
): Float32Array {
  const plane = outW * outH;
  const data = new Float32Array(3 * plane);
  const sx = crop.w / outW;
  const sy = crop.h / outH;
  const maxX = crop.x + crop.w - 1;
  const maxY = crop.y + crop.h - 1;
  for (let y = 0; y < outH; y++) {
    const fy = Math.min(crop.y + (y + 0.5) * sy - 0.5, maxY);
    const y0 = Math.max(Math.floor(fy), crop.y);
    const y1 = Math.min(y0 + 1, maxY);
    const wy = Math.max(fy - y0, 0);
    for (let x = 0; x < outW; x++) {
      const fx = Math.min(crop.x + (x + 0.5) * sx - 0.5, maxX);
      const x0 = Math.max(Math.floor(fx), crop.x);
      const x1 = Math.min(x0 + 1, maxX);
      const wx = Math.max(fx - x0, 0);
      const i00 = (y0 * img.width + x0) * 4;
      const i01 = (y0 * img.width + x1) * 4;
      const i10 = (y1 * img.width + x0) * 4;
      const i11 = (y1 * img.width + x1) * 4;
      for (let c = 0; c < 3; c++) {
        const s = BGR[c];
        const top = img.rgba[i00 + s] * (1 - wx) + img.rgba[i01 + s] * wx;
        const bottom = img.rgba[i10 + s] * (1 - wx) + img.rgba[i11 + s] * wx;
        const v = (top * (1 - wy) + bottom * wy) / 255;
        data[c * plane + y * outW + x] = (v - mean[c]) / std[c];
      }
    }
  }
  return data;
}

const roundTo32 = (n: number): number => Math.max(Math.round(n / 32) * 32, 32);

async function detect({ ort, det }: Ocr, img: Img): Promise<Crop[]> {
  const { width, height } = img;
  const scale = Math.min(DET_MAX_SIDE / Math.max(width, height), 1);
  const dw = roundTo32(width * scale);
  const dh = roundTo32(height * scale);
  const input = toChw(
    img,
    { x: 0, y: 0, w: width, h: height },
    dw,
    dh,
    DET_MEAN,
    DET_STD,
  );
  const out = await det.run({
    [det.inputNames[0]]: new ort.Tensor("float32", input, [1, 3, dh, dw]),
  });
  const prob = out[det.outputNames[0]].data as Float32Array;

  // 4-connected components on the binarised probability map.
  const seen = new Uint8Array(dw * dh);
  const boxes: Crop[] = [];
  const stack: number[] = [];
  const fw = width / dw;
  const fh = height / dh;
  for (let start = 0; start < Math.min(prob.length, dw * dh); start++) {
    if (seen[start] || prob[start] <= DET_BINARY_THRESHOLD) continue;
    let minX = dw;
    let minY = dh;
    let maxX = 0;
    let maxY = 0;
    let sum = 0;
    let count = 0;
    seen[start] = 1;
    stack.push(start);
    while (stack.length) {
      const i = stack.pop()!;
      const x = i % dw;
      const y = (i - x) / dw;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      sum += prob[i];
      count++;
      const neighbours = [
        x > 0 ? i - 1 : -1,
        x < dw - 1 ? i + 1 : -1,
        y > 0 ? i - dw : -1,
        y < dh - 1 ? i + dw : -1,
      ];
      for (const n of neighbours) {
        if (n >= 0 && !seen[n] && prob[n] > DET_BINARY_THRESHOLD) {
          seen[n] = 1;
          stack.push(n);
        }
      }
    }
    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;
    if (Math.min(bw, bh) < DET_MIN_SIDE || sum / count < DET_BOX_THRESHOLD)
      continue;
    const grow = (bw * bh * DET_UNCLIP_RATIO) / (2 * (bw + bh));
    const x0 = Math.max(Math.floor((minX - grow) * fw), 0);
    const y0 = Math.max(Math.floor((minY - grow) * fh), 0);
    const x1 = Math.min(Math.ceil((maxX + 1 + grow) * fw), width);
    const y1 = Math.min(Math.ceil((maxY + 1 + grow) * fh), height);
    if (x1 - x0 >= 2 && y1 - y0 >= 2) {
      boxes.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
    }
  }
  return boxes.sort((a, b) => a.y - b.y || a.x - b.x);
}

// CTC greedy decode.
function decode(
  dict: string[],
  data: Float32Array,
  steps: number,
  classes: number,
): { text: string; conf: number } {
  let text = "";
  let confSum = 0;
  let kept = 0;
  let prev = 0;
  for (let t = 0; t < steps; t++) {
    let best = 0;
    let bestP = -Infinity;
    for (let c = 0; c < classes; c++) {
      const p = data[t * classes + c];
      if (p > bestP) {
        best = c;
        bestP = p;
      }
    }
    if (best !== 0 && best !== prev) {
      text += dict[best - 1] ?? " ";
      confSum += bestP;
      kept++;
    }
    prev = best;
  }
  return { text: text.trim(), conf: kept > 0 ? confSum / kept : 0 };
}

async function recognize(
  { ort, rec, dict }: Ocr,
  img: Img,
  box: Crop,
): Promise<{ text: string; conf: number }> {
  const h = REC_HEIGHT;
  const w = Math.max(
    Math.min(Math.ceil((h * box.w) / box.h / 8) * 8, REC_MAX_WIDTH),
    8,
  );
  const out = await rec.run({
    [rec.inputNames[0]]: new ort.Tensor(
      "float32",
      toChw(img, box, w, h, REC_MEAN, REC_STD),
      [1, 3, h, w],
    ),
  });
  const logits = out[rec.outputNames[0]];
  const [, steps, classes] = logits.dims;
  return decode(dict, logits.data as Float32Array, steps, classes);
}

async function decodeImage(file: File): Promise<Img> {
  const bitmap = await createImageBitmap(file);
  // Same size cap the server scanner applied.
  const scale = Math.min(
    1,
    SCAN_TUNING.maxWidth / bitmap.width,
    SCAN_TUNING.maxHeight / bitmap.height,
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = new OffscreenCanvas(width, height).getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return { rgba: ctx.getImageData(0, 0, width, height).data, width, height };
}

// Runs inside tradeScanOcr.worker.ts so OCR never blocks the page.
export interface TradeScreenshotRead {
  detections: OcrDetection[];
  height: number;
  // Same fields the app reports; excludes the one-time model download.
  timings: { ocr_ms: number; det_ms: number; rec_ms: number };
}

export async function readTradeScreenshot(
  file: File,
): Promise<TradeScreenshotRead> {
  const [ocr, img] = await Promise.all([loadOcr(), decodeImage(file)]);
  const started = performance.now();
  const boxes = await detect(ocr, img);
  const detected = performance.now();
  const detections: OcrDetection[] = [];
  for (const box of boxes) {
    const { text, conf } = await recognize(ocr, img, box);
    if (text) {
      detections.push({
        x0: box.x,
        y0: box.y,
        x1: box.x + box.w,
        y1: box.y + box.h,
        text,
        conf,
      });
    }
  }
  const done = performance.now();
  return {
    detections,
    height: img.height,
    timings: {
      ocr_ms: Math.round(done - started),
      det_ms: Math.round(detected - started),
      rec_ms: Math.round(done - detected),
    },
  };
}
