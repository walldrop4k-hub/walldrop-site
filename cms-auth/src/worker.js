// WallDrop4K — Decap CMS GitHub OAuth proxy
//
// This is the piece Netlify used to provide for free (Identity + Git
// Gateway) that Cloudflare has no built-in equivalent for. It does exactly
// two things:
//   GET /auth      — sends the browser to GitHub to approve access
//   GET /callback   — GitHub sends the browser back here with a `code`;
//                     this exchanges that code for a real access token and
//                     hands it back to the Decap admin page that opened it
//
// Required secrets (set with `wrangler secret put <NAME>`, never hardcoded):
//   GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
//
// Required plain vars (set in wrangler.toml — not secret, safe to see):
//   SITE_URL     e.g. https://walldrop4k.pages.dev — the ONLY origin this
//                worker will start a login for, or send a token back to.
//   GITHUB_REPO  e.g. walldrop4k-hub/walldrop-site — after login, the
//                worker checks the GitHub user actually has push access to
//                this exact repo, and refuses the login otherwise.

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_API_URL = "https://api.github.com";
const OAUTH_SCOPE = "repo,user";
const STATE_COOKIE = "oauth_state";

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function missingConfigResponse(env) {
  const missing = ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "SITE_URL", "GITHUB_REPO"].filter(
    (key) => !env[key]
  );
  if (missing.length === 0) return null;
  return new Response(
    `This worker is missing required configuration: ${missing.join(", ")}.\n` +
      `Secrets are set with "wrangler secret put <NAME>"; SITE_URL/GITHUB_REPO ` +
      `are set in wrangler.toml under [vars].`,
    { status: 500 }
  );
}

// Origin, not raw string — this handles trailing slashes / paths in
// SITE_URL correctly instead of a naive startsWith() comparison.
function siteOrigin(env) {
  try {
    return new URL(env.SITE_URL).origin;
  } catch {
    return null;
  }
}

// Always normalized through URL's own .origin (which lowercases the
// host) — comparing raw header strings directly is a trap, since a
// technically-identical origin with different casing would otherwise
// fail to match.
function requestOrigin(request) {
  const origin = request.headers.get("Origin");
  if (origin) {
    try {
      return new URL(origin).origin;
    } catch {
      return null;
    }
  }
  const referer = request.headers.get("Referer");
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      return null;
    }
  }
  return null;
}

function getCookie(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function handleAuth(request, env) {
  const allowedOrigin = siteOrigin(env);
  const callerOrigin = requestOrigin(request);

  // The single most important check in this file: only WallDrop4K's own
  // admin page is allowed to start a login. Anyone else linking to this
  // URL just gets refused, before GitHub is ever involved.
  if (!allowedOrigin || callerOrigin !== allowedOrigin) {
    return new Response(
      `Forbidden — this login page can only be opened from ${env.SITE_URL || "the configured site"}.`,
      { status: 403 }
    );
  }

  const state = crypto.randomUUID();
  const redirectUri = new URL("/callback", request.url).toString();

  const authorizeUrl = new URL(GITHUB_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", OAUTH_SCOPE);
  authorizeUrl.searchParams.set("state", state);

  const headers = new Headers({ Location: authorizeUrl.toString() });
  // Short-lived, HttpOnly, request-scoped cookie holding the state value.
  // /callback checks the "state" GitHub sends back against this — that's
  // what stops a stranger from forging a /callback request and tricking
  // the worker into minting a token for them.
  headers.append(
    "Set-Cookie",
    `${STATE_COOKIE}=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/callback`
  );

  return new Response(null, { status: 302, headers });
}

async function exchangeCodeForToken(code, redirectUri, env) {
  const res = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "walldrop4k-cms-auth-worker",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
  });
  return res.json();
}

// After we have a token, double-check the person who just logged in can
// actually push to the one repo this CMS is for — not just any GitHub
// account. This is what keeps "log in with GitHub" from quietly working
// for anyone who happens to click it, if this worker's URL ever leaks.
async function userCanPushToRepo(token, env) {
  const res = await fetch(`${GITHUB_API_URL}/repos/${env.GITHUB_REPO}`, {
    headers: {
      Authorization: `token ${token}`,
      "User-Agent": "walldrop4k-cms-auth-worker",
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) return false;
  const repo = await res.json();
  return Boolean(repo && repo.permissions && repo.permissions.push);
}

// The exact handshake Decap/Netlify CMS's GitHub backend expects from an
// OAuth popup (this protocol comes from Decap itself, not something
// specific to this worker):
//   1. Popup tells the opener "authorizing:github"
//   2. Opener echoes that same message back
//   3. ONLY once the popup hears that echo (and confirms it came from the
//      trusted site origin) does it send the real result and close
function popupScript(resultMessage, allowedOrigin) {
  return `<!DOCTYPE html>
<html><body>
<script>
(function () {
  var ALLOWED_ORIGIN = ${JSON.stringify(allowedOrigin)};
  var RESULT = ${JSON.stringify(resultMessage)};

  function receiveMessage(e) {
    if (e.origin !== ALLOWED_ORIGIN) return;
    window.opener.postMessage(RESULT, ALLOWED_ORIGIN);
    window.removeEventListener("message", receiveMessage, false);
  }
  window.addEventListener("message", receiveMessage, false);
  window.opener.postMessage("authorizing:github", ALLOWED_ORIGIN);
})();
</script>
</body></html>`;
}

function errorPopup(message, env, status) {
  const payload = "authorization:github:error:" + JSON.stringify({ message });
  return html(popupScript(payload, siteOrigin(env) || "*"), status);
}

async function handleCallback(request, env) {
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  if (error) {
    // e.g. the user clicked "Cancel" on GitHub's own authorize screen.
    return errorPopup(url.searchParams.get("error_description") || error, env, 400);
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = getCookie(request, STATE_COOKIE);

  if (!code || !state || !cookieState || state !== cookieState) {
    return errorPopup("Invalid or expired login attempt. Close this window and try again.", env, 400);
  }

  const redirectUri = new URL("/callback", request.url).toString();
  const tokenData = await exchangeCodeForToken(code, redirectUri, env);

  if (!tokenData.access_token) {
    return errorPopup(tokenData.error_description || "GitHub did not return an access token.", env, 400);
  }

  const allowed = await userCanPushToRepo(tokenData.access_token, env);
  if (!allowed) {
    return errorPopup(`This GitHub account doesn't have push access to ${env.GITHUB_REPO}.`, env, 403);
  }

  const success =
    "authorization:github:success:" +
    JSON.stringify({ token: tokenData.access_token, provider: "github" });

  return html(popupScript(success, siteOrigin(env)));
}

export default {
  async fetch(request, env) {
    const configError = missingConfigResponse(env);
    if (configError) return configError;

    const url = new URL(request.url);

    if (url.pathname === "/auth") return handleAuth(request, env);
    if (url.pathname === "/callback") return handleCallback(request, env);

    return new Response("Not found", { status: 404 });
  },
};
