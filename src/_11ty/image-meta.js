// Build-time image details for a wallpaper, read straight from its uploaded
// file — so the CMS only needs the image itself. Nothing here is typed by
// hand: width, height, file size, format, and the resolution label all come
// from the file on disk.
const fs = require("fs");
const sharp = require("sharp");

// Label from the longer side, so a phone wallpaper (tall) and a desktop one
// (wide) are judged by the same scale. The tiers match the site's
// resolution labels: SD, HD, Full HD, 2K, 4K, 8K.
function resolutionLabel(longSide) {
  if (longSide >= 7680) return "8K";
  if (longSide >= 3840) return "4K";
  if (longSide >= 2560) return "2K";
  if (longSide >= 1920) return "Full HD";
  if (longSide >= 1280) return "HD";
  return "SD";
}

// "1.8 MB" above one megabyte, "800 KB" below it (binary units, as Windows
// and most download dialogs show them).
function formatFileSize(bytes) {
  const mb = 1024 * 1024;
  if (bytes >= mb) return `${(bytes / mb).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

const FORMAT_NAMES = { jpeg: "JPG", jpg: "JPG", png: "PNG", webp: "WEBP", gif: "GIF", avif: "AVIF" };

// The color used for a wallpaper's glow on cards and its detail page. A plain
// average goes grey or muddy on dark images, so each pixel is weighted by
// how saturated and bright it is — the vivid parts of the picture decide the
// color. Very dark or colorless images fall back to the site's accent violet.
async function dominantColor(filePath) {
  const { data, info } = await sharp(filePath)
    .rotate()
    .resize(48, 48, { fit: "inside" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let r = 0;
  let g = 0;
  let b = 0;
  let total = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const R = data[i];
    const G = data[i + 1];
    const B = data[i + 2];
    const max = Math.max(R, G, B);
    const min = Math.min(R, G, B);
    const saturation = max === 0 ? 0 : (max - min) / max;
    const weight = 0.1 + saturation * saturation * (max / 255);
    r += R * weight;
    g += G * weight;
    b += B * weight;
    total += weight;
  }

  const [R, G, B] = [r / total, g / total, b / total].map(Math.round);
  const luminance = (0.2126 * R + 0.7152 * G + 0.0722 * B) / 255;
  if (luminance < 0.08) return "#8b7bff";
  return `#${[R, G, B].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

async function readImageMeta(filePath) {
  const meta = await sharp(filePath).metadata();

  // EXIF orientations 5–8 mean the stored pixels are rotated 90°, so the
  // width and height the visitor sees are the other way round.
  const rotated = meta.orientation >= 5;
  const width = rotated ? meta.height : meta.width;
  const height = rotated ? meta.width : meta.height;

  const format = FORMAT_NAMES[meta.format] || String(meta.format).toUpperCase();

  return {
    width,
    height,
    dimensions: `${width} × ${height}`,
    label: resolutionLabel(Math.max(width, height)),
    fileSize: formatFileSize(fs.statSync(filePath).size),
    format,
    ext: format.toLowerCase(),
    dominantColor: await dominantColor(filePath),
  };
}

module.exports = { readImageMeta, resolutionLabel, formatFileSize };
