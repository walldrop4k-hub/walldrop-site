// Global data: which category/subcategory combos actually have at least
// one wallpaper. Scans src/wallpapers/*.md front matter directly (not via
// Eleventy collections, which aren't available yet when global data runs)
// so nav.njk, footer.njk, index.njk's "Popular" pills, and sitemap.njk can
// all hide links to categories that would otherwise show an empty page —
// without deleting anything from categories.json or touching category
// generation itself.
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

module.exports = () => {
  const occupied = {};
  const dir = path.join(__dirname, "..", "wallpapers");

  try {
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
    files.forEach((file) => {
      try {
        const { data } = matter.read(path.join(dir, file));
        if (data.category && data.subcategory) {
          occupied[`${data.category}/${data.subcategory}`] = true;
        }
      } catch (err) {
        console.warn(`[occupiedCategories] Skipping unreadable ${file}: ${err.message}`);
      }
    });
  } catch (err) {
    // If the scan fails outright, fail open — show every category rather
    // than accidentally hiding all of them from the nav.
    console.warn(`[occupiedCategories] Scan failed, showing all categories: ${err.message}`);
    return new Proxy({}, { get: () => true });
  }

  return occupied;
};
