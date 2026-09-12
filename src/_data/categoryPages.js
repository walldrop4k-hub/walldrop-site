// Flattens categories.json's desktop/mobile lists into one array, each
// item tagged with its `type` — this is what category.njk paginates over
// to generate one page per category (e.g. /category/desktop/4k/).
const categories = require("./categories.json");

module.exports = () => {
  const desktop = categories.desktop.map((cat) => ({ ...cat, type: "desktop" }));
  const mobile = categories.mobile.map((cat) => ({ ...cat, type: "mobile" }));
  return [...desktop, ...mobile];
};
