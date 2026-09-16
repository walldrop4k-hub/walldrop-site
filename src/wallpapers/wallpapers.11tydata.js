const path = require("path");
const Image = require("@11ty/eleventy-img");

module.exports = {
  layout: "wallpaper.njk",
  permalink: "/wallpaper/{{ page.fileSlug }}/index.html",

  eleventyComputed: {
    // The image every grid card (homepage, category pages, related
    // wallpapers, search results) actually loads. A manual CMS "thumbnail"
    // always wins, used exactly as uploaded. Otherwise the full "image" —
    // which can be several MB straight out of the CMS — is auto-compressed
    // once at build time into a small WebP, cached on this wallpaper's own
    // data so every place it's referenced reuses the same result instead
    // of reprocessing. wallpaper.njk's big preview and Download button
    // always link to the original "image" field directly, never this one.
    cardImage: async (data) => {
      if (data.thumbnail) return data.thumbnail;
      if (!data.image) return null;

      const inputPath = path.join("src", data.image);
      try {
        const stats = await Image(inputPath, {
          widths: [480],
          formats: ["webp"],
          sharpWebpOptions: { quality: 75 },
          outputDir: "./_site/assets/generated/",
          urlPath: "/assets/generated/",
        });
        return stats.webp[0].url;
      } catch (err) {
        // A missing/corrupt source file shouldn't take down the whole
        // build — fall back to the original full image, same as before
        // this field existed.
        console.warn(`[cardImage] Falling back to full image for ${data.image}: ${err.message}`);
        return data.image;
      }
    },
  },
};
