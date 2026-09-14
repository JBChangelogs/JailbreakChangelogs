import type { Area } from "react-easy-crop";

const MAX_AVATAR_DIMENSION = 1024;

const loadImage = (source: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Could not read the selected image"));
    image.src = source;
  });

export async function cropAvatarToPng(
  source: string,
  crop: Area,
  rotation = 0,
): Promise<File> {
  const image = await loadImage(source);
  const outputSize = Math.max(
    1,
    Math.min(MAX_AVATAR_DIMENSION, crop.width, crop.height),
  );
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;

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
  const outputScale = outputSize / crop.width;

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

  return new File([blob], "avatar.png", { type: "image/png" });
}
