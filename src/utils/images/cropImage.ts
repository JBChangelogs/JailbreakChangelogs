import type { Area } from "react-easy-crop";

const loadImage = (source: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Could not read the selected image"));
    image.src = source;
  });

interface CropOptions {
  crop: Area;
  rotation: number;
  maxWidth: number;
  maxHeight: number;
  maxBytes: number;
}

const getOutputDimensions = ({ crop, maxWidth, maxHeight }: CropOptions) => {
  const scale = Math.min(1, maxWidth / crop.width, maxHeight / crop.height);

  return {
    scale,
    width: Math.max(1, Math.round(crop.width * scale)),
    height: Math.max(1, Math.round(crop.height * scale)),
  };
};

const createCanvas = (width: number, height: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Image cropping is not supported by this browser");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  return { canvas, context };
};

const drawCroppedImage = (
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  options: CropOptions,
) => {
  const { crop, rotation } = options;
  const { scale } = getOutputDimensions(options);
  const radians = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const rotatedWidth = sourceWidth * cos + sourceHeight * sin;
  const rotatedHeight = sourceWidth * sin + sourceHeight * cos;

  context.save();
  context.scale(scale, scale);
  context.translate(-crop.x, -crop.y);
  context.translate(rotatedWidth / 2, rotatedHeight / 2);
  context.rotate(radians);
  context.translate(-sourceWidth / 2, -sourceHeight / 2);
  context.drawImage(image, 0, 0);
  context.restore();
};

const canvasToPng = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (value) =>
        value ? resolve(value) : reject(new Error("Could not crop the image")),
      "image/png",
    );
  });

async function cropStaticImage(
  source: string,
  options: CropOptions,
  fileName: string,
): Promise<File> {
  const image = await loadImage(source);
  const { width, height } = getOutputDimensions(options);
  const { canvas, context } = createCanvas(width, height);
  drawCroppedImage(
    context,
    image,
    image.naturalWidth,
    image.naturalHeight,
    options,
  );

  return new File([await canvasToPng(canvas)], fileName, {
    type: "image/png",
  });
}

async function cropAnimatedGif(
  file: File,
  options: CropOptions,
  fileName: string,
): Promise<File> {
  if (typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined") {
    return cropAnimatedGifInWorker(file, options, fileName);
  }

  return cropAnimatedGifOnMainThread(file, options, fileName);
}

async function cropAnimatedGifInWorker(
  file: File,
  options: CropOptions,
  fileName: string,
): Promise<File> {
  const source = await file.arrayBuffer();
  const worker = new Worker(new URL("./cropGif.worker.ts", import.meta.url), {
    type: "module",
  });

  return new Promise((resolve, reject) => {
    worker.onmessage = (
      event: MessageEvent<{ output?: ArrayBuffer; error?: string }>,
    ) => {
      worker.terminate();
      if (event.data.error || !event.data.output) {
        reject(new Error(event.data.error ?? "Could not crop the GIF"));
        return;
      }
      resolve(
        new File([event.data.output], fileName, {
          type: "image/gif",
        }),
      );
    };
    worker.onerror = () => {
      worker.terminate();
      reject(new Error("Could not process the GIF in the background"));
    };
    worker.postMessage({ source, ...options }, [source]);
  });
}

async function cropAnimatedGifOnMainThread(
  file: File,
  options: CropOptions,
  fileName: string,
): Promise<File> {
  const { decode, decodeFrames, encode } = await import("modern-gif");
  const source = await file.arrayBuffer();
  const gif = decode(source);
  const frames = decodeFrames(source, { gif });
  if (frames.length === 0) {
    throw new Error("The selected GIF does not contain any readable frames");
  }

  const { width, height } = getOutputDimensions(options);
  const estimatedBytes =
    source.byteLength * ((width * height) / (gif.width * gif.height)) * 2;
  const { canvas: sourceCanvas, context: sourceContext } = createCanvas(
    gif.width,
    gif.height,
  );
  const { context: outputContext } = createCanvas(width, height);
  const croppedFrames = frames.map((frame) => {
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
    drawCroppedImage(
      outputContext,
      sourceCanvas,
      gif.width,
      gif.height,
      options,
    );

    return {
      width,
      height,
      delay: frame.delay,
      data: outputContext.getImageData(0, 0, width, height).data,
    };
  });

  const croppedGif = await encode({
    width,
    height,
    frames: croppedFrames,
    looped: gif.looped ?? frames.length > 1,
    loopCount: gif.loopCount ?? 0,
    maxColors: estimatedBytes >= options.maxBytes * 0.8 ? 128 : 255,
    ditherTransparency:
      options.rotation % 90 !== 0 ? "floyd-steinberg" : undefined,
    format: "arrayBuffer",
  });

  return new File([croppedGif], fileName, { type: "image/gif" });
}

async function cropImage(
  file: File,
  source: string,
  crop: Area,
  rotation: number,
  maxWidth: number,
  maxHeight: number,
  maxBytes: number,
  baseName: string,
): Promise<File> {
  const options = { crop, rotation, maxWidth, maxHeight, maxBytes };
  return file.type === "image/gif"
    ? cropAnimatedGif(file, options, `${baseName}.gif`)
    : cropStaticImage(source, options, `${baseName}.png`);
}

export const cropAvatarImage = (
  file: File,
  source: string,
  crop: Area,
  rotation = 0,
) =>
  cropImage(
    file,
    source,
    crop,
    rotation,
    1024,
    1024,
    8 * 1024 * 1024,
    "avatar",
  );

export const cropBannerImage = (
  file: File,
  source: string,
  crop: Area,
  rotation = 0,
) =>
  cropImage(
    file,
    source,
    crop,
    rotation,
    1500,
    500,
    10 * 1024 * 1024,
    "banner",
  );
