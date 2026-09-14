import type { Area } from "react-easy-crop";

const loadImage = (source: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Could not read the selected image"));
    image.src = source;
  });

async function cropImageToPng(
  source: string,
  crop: Area,
  rotation: number,
  maxWidth: number,
  maxHeight: number,
  fileName: string,
): Promise<File> {
  const image = await loadImage(source);
  const outputScale = Math.min(
    1,
    maxWidth / crop.width,
    maxHeight / crop.height,
  );
  const outputWidth = Math.max(1, Math.round(crop.width * outputScale));
  const outputHeight = Math.max(1, Math.round(crop.height * outputScale));
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Image cropping is not supported by this browser");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  const radians = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const rotatedWidth = image.naturalWidth * cos + image.naturalHeight * sin;
  const rotatedHeight = image.naturalWidth * sin + image.naturalHeight * cos;
  context.scale(outputScale, outputScale);
  context.translate(-crop.x, -crop.y);
  context.translate(rotatedWidth / 2, rotatedHeight / 2);
  context.rotate(radians);
  context.translate(-image.naturalWidth / 2, -image.naturalHeight / 2);
  context.drawImage(image, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) =>
        value ? resolve(value) : reject(new Error("Could not crop the image")),
      "image/png",
    );
  });

  return new File([blob], fileName, { type: "image/png" });
}

export const cropAvatarToPng = (source: string, crop: Area, rotation = 0) =>
  cropImageToPng(source, crop, rotation, 1024, 1024, "avatar.png");

export const cropBannerToPng = (source: string, crop: Area, rotation = 0) =>
  cropImageToPng(source, crop, rotation, 1500, 500, "banner.png");
