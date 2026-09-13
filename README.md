# WallDrop4K

This site is built with **Eleventy** (a static site generator) and edited through
**Decap CMS** (a free content editor that runs in your browser at `/admin`).
You never hand-write HTML pages anymore — you fill in a form, and the page
gets built for you automatically.

If you're new to all of this, read this file top to bottom once. It's written
for a beginner, not a developer.

---

## 1. How the pieces fit together

- **`src/`** — everything the site is built from: templates, page content,
  and the wallpaper/article data files.
- **`src/wallpapers/`** — one file per wallpaper. Each file is the *data* for
  that wallpaper (title, category, resolutions, tags, description...).
  Eleventy turns every one of these into a real page automatically.
- **`src/articles/`** — same idea, one file per journal article.
- **`src/_data/categories.json`** — the list of categories (4K, Gaming,
  iPhone, etc). The nav menu, the footer, and the category pages are all
  generated from this one file — edit a category here and it updates
  everywhere at once.
- **`src/admin/`** — the CMS. This is the form-based editor you'll actually
  use day to day, instead of touching files directly.
- **`_site/`** — the finished website, built automatically from everything
  above. You never edit this folder by hand — it gets regenerated every time
  you (or Netlify) run a build. It's not saved in git.

---

## 2. Preview the site on your own computer

You only need to do the install step once.

**One-time setup:**

1. Install [Node.js](https://nodejs.org) (the LTS version) if you don't have
   it already.
2. Open a terminal in this project folder and run:
   ```
   npm install
   ```
   This downloads Eleventy and its dependencies into a `node_modules`
   folder. It can take a minute.

**Every time you want to preview the site:**

```
npm start
```

This builds the site and opens a local server. Open the address it prints
(usually `http://localhost:8080`) in your browser. Leave the terminal
running — as you or anyone else edits a file, the page refreshes itself
automatically. Press `Ctrl+C` in the terminal to stop it.

If you just want to build the site once without previewing it (this is what
happens automatically when you deploy), run:

```
npm run build
```

The finished site appears in the `_site` folder.

---

## 3. Adding content through the CMS (the normal way)

You won't use the CMS on your own computer — it needs to be connected to a
live site on Netlify and a GitHub repository, because that's what it saves
your changes to. Here's the one-time setup, then the day-to-day workflow.

### One-time setup (do this once, with help if needed)

1. **Push this project to GitHub** as a repository (if it isn't already).
2. **Create a Netlify site** from that GitHub repository
   ([netlify.com](https://netlify.com) → "Add new site" → "Import an
   existing project"). Netlify will read `netlify.toml` automatically and
   know how to build the site — you don't need to configure anything.
3. In your new Netlify site's dashboard, go to **Site configuration →
   Identity** and click **Enable Identity**.
4. Still under Identity, go to **Services** and click **Enable Git Gateway**.
   This is what lets the CMS save changes back to your GitHub repo on your
   behalf.
5. Under Identity → **Registration**, you can set it to "Invite only" so
   random people can't sign up.
6. Invite yourself as a user (Identity tab → "Invite users" → your email).
   You'll get an email — click the link, set a password.

You only ever have to do this once.

### Using the CMS day to day

1. Go to `your-site-url.netlify.app/admin/` and log in with the account you
   just created.
2. You'll see three sections in the sidebar: **Wallpapers**, **Articles**,
   and **Site Settings**.
3. To add a wallpaper: click **Wallpapers → New Wallpaper**, fill in the
   form (title, whether it's Desktop or Mobile, the category, resolutions,
   tags, a short description, and — once you have a real image — upload it).
   Leaving the image field empty is fine for now; the page will show a
   placeholder color block instead.
4. Click **Save**. It publishes immediately — Netlify picks up the change
   and rebuilds the site within a minute or two. (If more than one person
   ever starts editing this site and you want a draft/review step before
   things go live, switch `publish_mode` back to `editorial_workflow` in
   `src/admin/config.yml`.)

### What happens automatically when you add a wallpaper

You don't need to touch any other file. Adding one wallpaper through the CMS
automatically:

- Creates its own page at `/wallpaper/<its-name>/`
- Shows up on its category page (matched by the "Format" + "Subcategory"
  fields you picked)
- Appears in "Latest drops" on the homepage (newest first)
- Appears in "Trending now" on the homepage, if you switched on the
  "Trending" toggle
- Gets added to `sitemap.xml` automatically, with an image sitemap entry
- Gets a small piece of invisible "ImageObject" metadata (JSON-LD) that
  helps Google understand it's a wallpaper

Adding a category is the one thing that still means editing a file directly
— open `src/_data/categories.json` and add an entry to the `desktop` or
`mobile` list. Everything that reads from it (nav, footer, category pages)
will pick it up automatically the next time the site builds.

---

## 4. Turning on Google Analytics

Open `src/_data/site.json` and replace `"G-XXXXXXXXXX"` with your real GA4
measurement ID (it looks like `G-` followed by letters and numbers, found in
your Google Analytics property settings). That's the only change needed —
every page already has the tracking code in place.

---

## 5. Moving to your real domain

Right now `src/_data/site.json` has `"url": "https://rococo-gumdrop-51c976.netlify.app"`
— that's the temporary Netlify address the site is running on. Every URL the
site generates (canonical links, `sitemap.xml`, `robots.txt`, the Open Graph
preview image/link used when a page is shared, and the structured data on
wallpaper/article pages) is built from this one field. **When you connect a
real domain, change just this one value** and everything updates on the next
build — nothing else needs editing.

---

## 6. The contact form

The contact page's form is wired up to **Netlify Forms** — no code or extra
setup needed once the site is deployed on Netlify; it detects the form
automatically from the page's HTML the first time it builds. Submissions
show up in your Netlify dashboard under **Forms**, and a visitor who submits
it lands on a "Message sent" thank-you page. It also has a hidden honeypot
field to catch basic spam bots.

---

## 7. A note on the design

The visual design (colors, spacing, glass effects, tabs, grids) lives
entirely in `src/style.css` and `src/script.js` — the same two files from
before this migration, just moved into `src/`. None of the content changes
you make through the CMS can affect the design; the templates in
`src/_includes/` control layout, and the stylesheet controls appearance.
