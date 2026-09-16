module.exports = function (eleventyConfig) {
  // ============ Passthrough copy — static files ship to _site untouched ============
  eleventyConfig.addPassthroughCopy("src/style.css");
  eleventyConfig.addPassthroughCopy("src/script.js");
  eleventyConfig.addPassthroughCopy("src/favicon.svg");
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/admin");
  // Cloudflare Pages reads this from the build output root.
  eleventyConfig.addPassthroughCopy("src/_headers");

  // Decap CMS's admin/index.html is a static app shell (loads the CMS
  // script itself), not an Eleventy template — don't run it through the
  // HTML template engine, just ship it as-is via the passthrough above.
  eleventyConfig.ignores.add("src/admin/index.html");

  // ============ Filters ============

  // Look up a category object by its slug — this is what keeps the nav,
  // footer, and every wallpaper's "tag" pill in sync with categories.json
  // automatically, instead of hand-typing category names in templates.
  eleventyConfig.addFilter("findBySlug", (list, slug) => {
    return (list || []).find((item) => item.slug === slug);
  });

  // "Sep 3, 2026" — used for the "Added" row on wallpaper/article pages.
  // A missing/unparsable date (e.g. a CMS entry saved without one) falls
  // back to "" instead of rendering "Invalid Date" to a visitor.
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    const d = new Date(dateObj);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  });

  // "2026-09-03" — used in sitemap.xml and JSON-LD, where dates must be ISO.
  // new Date(undefined).toISOString() throws (RangeError: Invalid time
  // value), which would otherwise take down the whole build over one
  // wallpaper/article missing its date — fall back to "" instead.
  eleventyConfig.addFilter("isoDate", (dateObj) => {
    const d = new Date(dateObj);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  });

  // Strip markdown/HTML down to a plain-text excerpt for meta descriptions
  // and JSON-LD, capped at `length` characters.
  eleventyConfig.addFilter("plainText", (content, length = 160) => {
    const text = String(content || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/[#*_>`]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return text.length > length ? text.slice(0, length).trim() + "…" : text;
  });

  // Pull the leading number out of a "3840 × 2160" style string, for
  // JSON-LD ImageObject width/height.
  eleventyConfig.addFilter("dimension", (str, which) => {
    const match = String(str || "").match(/(\d+)\s*[×x]\s*(\d+)/i);
    if (!match) return "";
    return which === "height" ? match[2] : match[1];
  });

  // JSON-safe string escaping for inline JSON-LD blocks (Nunjucks has no
  // built-in tojson/dump filter).
  eleventyConfig.addFilter("jsonify", (val) => JSON.stringify(val));

  // "https://example.com" -> "example.com", for mentioning the site's
  // own domain in body copy (e.g. the privacy policy) without the
  // scheme reading awkwardly.
  eleventyConfig.addFilter("bareDomain", (url) => String(url || "").replace(/^https?:\/\//, ""));

  // Same wallpaper/mobile collection minus the current page, for "Related
  // wallpapers" — avoids relying on for-loop counters, which Nunjucks
  // doesn't reliably persist across iterations.
  eleventyConfig.addFilter("excludeSlug", (list, slug) =>
    (list || []).filter((item) => item.data.slug !== slug)
  );

  // Wallpapers matching one category/subcategory pair — used by
  // category.njk. Plain JS filtering instead of Nunjucks' inline
  // `{% for x in y if ... %}`, which doesn't reliably evaluate
  // multi-condition expressions.
  eleventyConfig.addFilter("byCategory", (list, category, subcategory) =>
    (list || []).filter(
      (item) => item.data.category === category && item.data.subcategory === subcategory
    )
  );

  // ============ Collections ============
  // Wallpapers are split by category (desktop/mobile) and by trending
  // status up front, since Nunjucks has no selectattr filter — this keeps
  // every template a plain {% for %} loop instead of inline filtering logic.

  const byNewestFirst = (a, b) => b.date - a.date;

  eleventyConfig.addCollection("desktopWallpapers", (api) =>
    api
      .getFilteredByGlob("src/wallpapers/*.md")
      .filter((item) => item.data.category === "desktop")
      .sort(byNewestFirst)
  );

  eleventyConfig.addCollection("mobileWallpapers", (api) =>
    api
      .getFilteredByGlob("src/wallpapers/*.md")
      .filter((item) => item.data.category === "mobile")
      .sort(byNewestFirst)
  );

  eleventyConfig.addCollection("trendingDesktop", (api) =>
    api
      .getFilteredByGlob("src/wallpapers/*.md")
      .filter((item) => item.data.category === "desktop" && item.data.trending)
      .sort(byNewestFirst)
  );

  eleventyConfig.addCollection("trendingMobile", (api) =>
    api
      .getFilteredByGlob("src/wallpapers/*.md")
      .filter((item) => item.data.category === "mobile" && item.data.trending)
      .sort(byNewestFirst)
  );

  eleventyConfig.addCollection("allWallpapers", (api) =>
    api.getFilteredByGlob("src/wallpapers/*.md").sort(byNewestFirst)
  );

  eleventyConfig.addCollection("allArticles", (api) =>
    api.getFilteredByGlob("src/articles/*.md").sort(byNewestFirst)
  );

  // Flat, plain-object index consumed by /search-index.json — the data
  // behind the site's real client-side search (title/category/tags for
  // wallpapers, title/category/excerpt for articles).
  eleventyConfig.addCollection("searchIndex", (api) => {
    const wallpapers = api
      .getFilteredByGlob("src/wallpapers/*.md")
      .sort(byNewestFirst)
      .map((item) => ({
        type: "wallpaper",
        title: item.data.title,
        category: item.data.category,
        subcategory: item.data.subcategory,
        tags: item.data.tags || [],
        url: item.url,
        image: item.data.image || null,
        thumbnail: item.data.cardImage || null,
        gradientClass: item.data.gradientClass || null,
        resolution:
          item.data.resolutions && item.data.resolutions.length
            ? item.data.resolutions[0].dimensions
            : "",
      }));

    const articles = api
      .getFilteredByGlob("src/articles/*.md")
      .sort(byNewestFirst)
      .map((item) => ({
        type: "article",
        title: item.data.title,
        category: item.data.category,
        excerpt: item.data.excerpt || "",
        tags: [],
        url: item.url,
        image: item.data.image || null,
        gradientClass: item.data.gradientClass || null,
      }));

    return wallpapers.concat(articles);
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"],
  };
};
