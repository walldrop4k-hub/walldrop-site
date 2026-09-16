// Strip markdown/HTML down to a plain-text excerpt, capped at `length`
// characters — shared by the .eleventy.js "plainText" filter (used in
// JSON-LD) and by wallpapers.11tydata.js's auto-generated meta
// description, so both stay in sync with one implementation.
function plainText(content, length = 160) {
  const text = String(content || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_>`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > length ? text.slice(0, length).trim() + "…" : text;
}

module.exports = { plainText };
