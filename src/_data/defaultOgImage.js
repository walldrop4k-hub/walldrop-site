// The og:image used by the homepage, category pages, articles, and any
// wallpaper with no image of its own. Generated once at build time (dark
// background + the site logo) via sharp — already installed transitively
// through @11ty/eleventy-img — so there's a real preview image instead of
// the SVG favicon (which social platforms won't render), with no new
// asset required.
//
// Drop a real designed banner at src/assets/og-default.jpg and it's used
// as-is instead — this only generates one if that file doesn't exist.
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const customPath = path.join(__dirname, "..", "assets", "og-default.jpg");
const outputDir = path.join(__dirname, "..", "..", "_site", "assets", "generated");
const outputPath = path.join(outputDir, "og-default.jpg");
const logoPath = path.join(__dirname, "..", "favicon.svg");

module.exports = async () => {
  if (fs.existsSync(customPath)) {
    return "/assets/og-default.jpg";
  }

  try {
    fs.mkdirSync(outputDir, { recursive: true });
    const logo = await sharp(logoPath).resize(220).toBuffer();
    await sharp({
      create: { width: 1200, height: 630, channels: 3, background: "#14141a" },
    })
      .composite([{ input: logo, gravity: "center" }])
      .jpeg({ quality: 82 })
      .toFile(outputPath);
    return "/assets/generated/og-default.jpg";
  } catch (err) {
    // Never let a broken logo/sharp failure take down the whole build —
    // fall back to the favicon exactly like before this file existed.
    console.warn(`[defaultOgImage] Falling back to favicon.svg: ${err.message}`);
    return "/favicon.svg";
  }
};
