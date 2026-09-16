const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { toWebpThumbnail, toJpegSocialImage } = require("../_11ty/image-helpers.js");
const { plainText } = require("../_11ty/text-helpers.js");

module.exports = {
  layout: "wallpaper.njk",
  permalink: "/wallpaper/{{ page.fileSlug }}/index.html",

  eleventyComputed: {
    // <title>/og:title override — the on-page H1 always stays the plain
    // "title" field; this only affects what search/social show.
    seoTitle: (data) => (data.seo && data.seo.title) || data.title,

    // Meta description — CMS override, else auto-generated from this
    // wallpaper's own write-up (re-read directly since eleventyComputed
    // doesn't have access to the rendered markdown body).
    metaDescription: (data) => {
      if (data.seo && data.seo.description) return data.seo.description;
      try {
        const raw = fs.readFileSync(data.page.inputPath, "utf8");
        return plainText(matter(raw).content, 160);
      } catch (err) {
        console.warn(`[metaDescription] Falling back to site description for ${data.page.inputPath}: ${err.message}`);
        return (data.settings && data.settings.description) || "";
      }
    },

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
      try {
        return await toWebpThumbnail(path.join("src", data.image));
      } catch (err) {
        console.warn(`[cardImage] Falling back to full image for ${data.image}: ${err.message}`);
        return data.image;
      }
    },

    // og:image / twitter:image — CMS override, else this wallpaper's own
    // image normalized to a JPEG (never WebP/SVG, which social platforms
    // don't reliably render), else the sitewide default.
    ogImage: async (data) => {
      const source = (data.seo && data.seo.ogImage) || data.image;
      if (!source) return data.defaultOgImage;
      try {
        return await toJpegSocialImage(path.join("src", source));
      } catch (err) {
        console.warn(`[ogImage] Falling back to default share image for ${source}: ${err.message}`);
        return data.defaultOgImage;
      }
    },
  },
};
