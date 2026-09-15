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
  you (or Cloudflare) run a build. It's not saved in git.

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

## 3. Deploying to Cloudflare Pages

1. **Push this project to GitHub** as a repository (if it isn't already).
2. In the [Cloudflare dashboard](https://dash.cloudflare.com), go to
   **Workers & Pages → Create → Pages → Connect to Git**, and pick this
   repository.
3. When it asks for build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `_site`
   - Leave everything else as default.
4. Click **Save and Deploy**. The first build takes a couple of minutes.
   When it's done, Cloudflare gives you a URL like
   `https://walldrop-site.pages.dev` — that's your live site.
5. Every time `main` on GitHub changes (including when the CMS saves an
   edit), Cloudflare automatically rebuilds and redeploys — you don't have
   to trigger anything by hand.

## 4. Setting up the CMS (one-time)

This site's CMS logs in through GitHub directly, via a small piece of
middleware called an **OAuth proxy**. Cloudflare Pages doesn't include one
built in (Netlify used to provide this automatically — Cloudflare
doesn't), so it needs to be deployed once as its own small Cloudflare
Worker. This is the one genuinely technical step in this whole setup —
it's fine to get help with it if you're not comfortable with Workers.

1. Deploy a Decap/Netlify-CMS-compatible **GitHub OAuth Worker**. There
   are ready-made templates for this — search for "decap-cms-oauth
   Cloudflare Worker" — that you deploy with a couple of `wrangler`
   commands after creating a GitHub OAuth App for this repository.
2. Once it's deployed, you'll have a Worker URL like
   `https://walldrop4k-cms-auth.<your-subdomain>.workers.dev`.
3. Set `base_url` in `src/admin/config.yml` to that Worker URL. (This is
   already done for this site — it points at
   `https://walldrop4k-cms-auth.walldrop4k.workers.dev`. Only change it if
   you redeploy the OAuth Worker somewhere else.)
4. Go to `https://<your-site>.pages.dev/admin/` and log in with your
   GitHub account. Only people with write access to this repository can
   actually save changes.

You only ever have to do this once.

### Using the CMS day to day

1. Go to `https://<your-site>.pages.dev/admin/` and log in with GitHub.
2. You'll see three sections in the sidebar: **Wallpapers**, **Articles**,
   and **Site Settings**.
3. To add a wallpaper: click **Wallpapers → New Wallpaper**, fill in the
   form (title, whether it's Desktop or Mobile, the category, resolutions,
   tags, a short description, and — once you have a real image — upload it).
   Leaving the image field empty is fine for now; the page will show a
   placeholder color block instead.
4. Click **Save**. It publishes immediately — Cloudflare picks up the
   change and rebuilds the site within a minute or two. (If more than one
   person ever starts editing this site and you want a draft/review step
   before things go live, switch `publish_mode` back to
   `editorial_workflow` in `src/admin/config.yml`.)

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

## 5. Turning on Google Analytics

**Still a placeholder — not done yet.** Open `src/_data/site.json` and
replace `"G-XXXXXXXXXX"` with your real GA4 measurement ID (it looks like
`G-` followed by letters and numbers, found in your Google Analytics
property settings). That's the only change needed — every page already has
the tracking code in place.

---

## 6. Connecting your own domain, and the `url` field

`src/_data/site.json` currently has `"url": "https://walldrop-site.pages.dev"`
— the real `*.pages.dev` address this site deploys to. Every URL the site
generates — canonical links, `sitemap.xml`, `robots.txt`, the Open Graph
preview image/link used when a page is shared, the structured data on
wallpaper/article pages, and the contact form's post-submit redirect — is
built from this one field.

If you later connect a custom domain (in Cloudflare: open your Pages
project → **Custom domains → Set up a custom domain**, and follow the
prompts), update this one field to the new domain and everything above
updates on the next build — nothing else needs editing.

(The `site_url` / `display_url` lines near the top of
`src/admin/config.yml` are a separate, smaller thing — they only affect
the CMS's own "view live" links, and are already kept matching the same
URL. Update them too if you switch domains.)

---

## 7. The contact form (Formspree)

**Still a placeholder — not done yet.** The contact page's form posts to
**Formspree** — a free service that
emails you form submissions without needing any backend code of your own.
To turn it on:

1. Go to [formspree.io](https://formspree.io) and create a free account.
2. Create a new form there. It gives you an endpoint URL that looks like
   `https://formspree.io/f/xxxxxxxx`.
3. Open `src/contact.njk` and replace
   `REPLACE-WITH-YOUR-FORMSPREE-ID` in the form's `action=` with that
   endpoint (the full instructions are also in a comment right above the
   form in that file).

A visitor who submits the form lands on the "Message sent" thank-you
page, same as before. It also still has a hidden honeypot field (a trap
field real visitors never fill in) to catch basic spam bots — Formspree
recognizes it automatically since it's named the way Formspree expects.

---

## 8. A note on the design

The visual design (colors, spacing, glass effects, tabs, grids) lives
entirely in `src/style.css` and `src/script.js` — the same two files from
before this migration, just moved into `src/`. None of the content changes
you make through the CMS can affect the design; the templates in
`src/_includes/` control layout, and the stylesheet controls appearance.
