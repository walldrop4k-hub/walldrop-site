# walldrop4k-cms-auth

A tiny Cloudflare Worker that lets Decap CMS's "Login with GitHub" button
work, since Cloudflare Pages doesn't include the OAuth handling Netlify
used to provide for free.

Two routes:

- **`GET /auth`** — only accepts requests coming from `SITE_URL` (the
  admin page), then sends the browser to GitHub to approve access.
- **`GET /callback`** — GitHub redirects here with a `code`; this trades
  it for a real access token, confirms the logged-in GitHub account can
  actually push to `GITHUB_REPO`, and hands the token back to the Decap
  admin page via the `postMessage` handshake Decap expects.

Full step-by-step setup instructions (installing Wrangler, logging in,
setting secrets, deploying, and wiring up the GitHub OAuth App + this
site's `config.yml`) are in the main project's `README.md`.

Config:

| Name                   | Kind              | Where it's set                         |
| ---------------------- | ----------------- | --------------------------------------- |
| `GITHUB_CLIENT_ID`     | secret            | `wrangler secret put GITHUB_CLIENT_ID`     |
| `GITHUB_CLIENT_SECRET` | secret            | `wrangler secret put GITHUB_CLIENT_SECRET` |
| `SITE_URL`             | plain var         | `wrangler.toml` → `[vars]`              |
| `GITHUB_REPO`          | plain var         | `wrangler.toml` → `[vars]`              |
