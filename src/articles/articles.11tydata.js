const path = require("path");
const { toWebpFeaturedImage, toJpegSocialImage } = require("../_11ty/image-helpers.js");

module.exports = {
  layout: "article.njk",
  permalink: "/article/{{ page.fileSlug }}/index.html",

  eleventyComputed: {
    // <title>/og:title override — the on-page H1 always stays the plain
    // "title" field; this only affects what search/social show.
    seoTitle: (data) => (data.seo && data.seo.title) || data.title,

    // Meta description — CMS override, else the article's own excerpt
    // (already a short plain-text field, no need to re-read the body).
    metaDescription: (data) => (data.seo && data.seo.description) || data.excerpt || "",

    // The image every article card AND the detail page's own featured
    // image actually display — a compressed WebP generated once at build
    // time from the raw CMS upload, same as wallpapers.11tydata.js's
    // cardImage. This runs on every build regardless of when the source
    // image was uploaded, so already-existing articles get compressed
    // too, not just new ones. og:image stays on the untouched original
    // (via toJpegSocialImage below, reading data.image directly) since
    // social platforms want their own normalized size/format.
    featuredImage: async (data) => {
      if (!data.image) return null;
      try {
        return await toWebpFeaturedImage(path.join("src", data.image));
      } catch (err) {
        console.warn(`[featuredImage] Falling back to original image for ${data.image}: ${err.message}`);
        return data.image;
      }
    },

    // og:image / twitter:image — CMS override, else this article's own
    // image normalized to a JPEG (never WebP/SVG), else the sitewide
    // default.
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
