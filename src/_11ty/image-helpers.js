// Shared build-time image processing, used by wallpapers.11tydata.js and
// articles.11tydata.js so the same logic isn't duplicated in both places.
const Image = require("@11ty/eleventy-img");

// Small compressed WebP used by every grid card (homepage, category
// pages, related wallpapers, search results).
async function toWebpThumbnail(inputPath) {
  const stats = await Image(inputPath, {
    widths: [480],
    formats: ["webp"],
    sharpWebpOptions: { quality: 75 },
    outputDir: "./_site/assets/generated/",
    urlPath: "/assets/generated/",
  });
  return stats.webp[0].url;
}

// A compressed WebP for article featured images — used everywhere the
// image appears (article cards AND the detail page's larger hero), since
// unlike wallpapers there's no "download the original" use case pulling
// against a single shared size. 1200px covers the detail page's ~750px
// readable-column width at retina density with room to spare, and is
// equally generous for the smaller card thumbnails.
async function toWebpFeaturedImage(inputPath) {
  const stats = await Image(inputPath, {
    widths: [1200],
    formats: ["webp"],
    sharpWebpOptions: { quality: 78 },
    outputDir: "./_site/assets/generated/",
    urlPath: "/assets/generated/",
  });
  return stats.webp[0].url;
}

// A 1200px-wide JPEG for og:image / twitter:image — social platforms
// don't reliably render WebP (or SVG), so every source gets normalized
// to JPEG here regardless of what format was actually uploaded.
async function toJpegSocialImage(inputPath) {
  const stats = await Image(inputPath, {
    widths: [1200],
    formats: ["jpeg"],
    sharpJpegOptions: { quality: 80 },
    outputDir: "./_site/assets/generated/",
    urlPath: "/assets/generated/",
  });
  return stats.jpeg[0].url;
}

module.exports = { toWebpThumbnail, toWebpFeaturedImage, toJpegSocialImage };
