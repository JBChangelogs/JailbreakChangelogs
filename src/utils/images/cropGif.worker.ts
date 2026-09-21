import { decode, decodeFrames, encode } from "modern-gif";

interface CropGifRequest {
  source: ArrayBuffer;
  crop: { x: number; y: number; width: number; height: number };
  rotation: number;
  maxWidth: number;
  maxHeight: number;
  maxBytes: number;
}

interface WorkerScope {
  addEventListener(
    type: "message",
    listener: (event: MessageEvent<CropGifRequest>) => void,
  ): void;
  postMessage(message: unknown, transfer?: Transferable[]): void;
}

const workerScope = globalThis as unknown as WorkerScope;
const FULL_PALETTE_COLORS = 255;
const COMPACT_PALETTE_COLORS = 128;
const FALLBACK_PALETTE_COLORS = 64;
const COMPACT_PALETTE_THRESHOLD = 0.8;

workerScope.addEventListener("message", (event) => {
  void processGif(event.data);
});

async function processGif({
  source,
  crop,
  rotation,
  maxWidth,
  maxHeight,
  maxBytes,
}: CropGifRequest) {
  try {
    const gif = decode(source);
    const frames = decodeFrames(source, { gif });
    if (frames.length === 0) {
      throw new Error("The selected GIF does not contain any readable frames");
    }

    const scale = Math.min(1, maxWidth / crop.width, maxHeight / crop.height);
    let width = Math.max(1, Math.round(crop.width * scale));
    let height = Math.max(1, Math.round(crop.height * scale));
    const estimatedBytes =
      source.byteLength * ((width * height) / (gif.width * gif.height)) * 2;
    const initialMaxColors =
      estimatedBytes >= maxBytes * COMPACT_PALETTE_THRESHOLD
        ? COMPACT_PALETTE_COLORS
        : FULL_PALETTE_COLORS;
    if (estimatedBytes > maxBytes) {
      const estimatedScale = Math.max(
        0.5,
        Math.min(1, Math.sqrt((maxBytes * 0.9) / estimatedBytes)),
      );
      width = Math.max(1, Math.floor(width * estimatedScale));
      height = Math.max(1, Math.floor(height * estimatedScale));
    }
    const sourceCanvas = new OffscreenCanvas(gif.width, gif.height);
    const outputCanvas = new OffscreenCanvas(width, height);
    const sourceContext = sourceCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    const outputContext = outputCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    if (!sourceContext || !outputContext) {
      throw new Error("GIF cropping is not supported by this browser");
    }

    outputContext.imageSmoothingEnabled = true;
    outputContext.imageSmoothingQuality = "high";
    const radians = (rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(radians));
    const cos = Math.abs(Math.cos(radians));
    const rotatedWidth = gif.width * cos + gif.height * sin;
    const rotatedHeight = gif.width * sin + gif.height * cos;
    let croppedFrames = frames.map((frame) => {
      sourceContext.putImageData(
        new ImageData(
          frame.data as Uint8ClampedArray<ArrayBuffer>,
          frame.width,
          frame.height,
        ),
        0,
        0,
      );
      outputContext.clearRect(0, 0, width, height);
      outputContext.save();
      outputContext.scale(scale, scale);
      outputContext.translate(-crop.x, -crop.y);
      outputContext.translate(rotatedWidth / 2, rotatedHeight / 2);
      outputContext.rotate(radians);
      outputContext.translate(-gif.width / 2, -gif.height / 2);
      outputContext.drawImage(sourceCanvas, 0, 0);
      outputContext.restore();

      return {
        width,
        height,
        delay: frame.delay,
        data: outputContext.getImageData(0, 0, width, height).data,
      };
    });

    const ditherTransparency = rotation % 90 !== 0;
    const encodeFrames = (maxColors: number) =>
      encode({
        width,
        height,
        frames: croppedFrames,
        looped: gif.looped ?? frames.length > 1,
        loopCount: gif.loopCount ?? 0,
        maxColors,
        ditherTransparency: ditherTransparency ? "floyd-steinberg" : undefined,
        format: "arrayBuffer",
      });
    let output = await encodeFrames(initialMaxColors);

    if (output.byteLength > maxBytes) {
      const resizeScale = Math.min(
        0.9,
        Math.max(0.4, Math.sqrt((maxBytes * 0.85) / output.byteLength)),
      );
      const nextWidth = Math.max(1, Math.floor(width * resizeScale));
      const nextHeight = Math.max(1, Math.floor(height * resizeScale));
      const frameCanvas = new OffscreenCanvas(width, height);
      const resizedCanvas = new OffscreenCanvas(nextWidth, nextHeight);
      const frameContext = frameCanvas.getContext("2d", {
        willReadFrequently: true,
      });
      const resizedContext = resizedCanvas.getContext("2d", {
        willReadFrequently: true,
      });
      if (!frameContext || !resizedContext) {
        throw new Error("GIF resizing is not supported by this browser");
      }

      resizedContext.imageSmoothingEnabled = true;
      resizedContext.imageSmoothingQuality = "high";
      croppedFrames = croppedFrames.map((frame) => {
        frameContext.putImageData(
          new ImageData(
            frame.data as Uint8ClampedArray<ArrayBuffer>,
            frame.width ?? width,
            frame.height ?? height,
          ),
          0,
          0,
        );
        resizedContext.clearRect(0, 0, nextWidth, nextHeight);
        resizedContext.drawImage(
          frameCanvas,
          0,
          0,
          width,
          height,
          0,
          0,
          nextWidth,
          nextHeight,
        );
        return {
          width: nextWidth,
          height: nextHeight,
          delay: frame.delay,
          data: resizedContext.getImageData(0, 0, nextWidth, nextHeight).data,
        };
      });
      width = nextWidth;
      height = nextHeight;
      output = await encodeFrames(FALLBACK_PALETTE_COLORS);
    }

    if (output.byteLength > maxBytes) {
      throw new Error(
        `The processed GIF is larger than ${Math.floor(maxBytes / 1024 / 1024)}MB`,
      );
    }
    workerScope.postMessage({ output }, [output]);
  } catch (error) {
    workerScope.postMessage({
      error: error instanceof Error ? error.message : "Could not crop the GIF",
    });
  }
}
