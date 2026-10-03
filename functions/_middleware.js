// Cloudflare Pages Function — runs before every request to the site.
//
// Requests arriving on the default Pages hostname (walldrop-site.pages.dev)
// are 301-redirected to the canonical domain, so search engines only ever
// index walldrop4k.site. Preview deployments (<hash>.walldrop-site.pages.dev)
// are deliberately not redirected — the hostname check is an exact match.

const CANONICAL_ORIGIN = "https://walldrop4k.site";
const PAGES_HOSTNAME = "walldrop-site.pages.dev";

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.hostname === PAGES_HOSTNAME) {
    return new Response(null, {
      status: 301,
      headers: { Location: CANONICAL_ORIGIN + url.pathname + url.search },
    });
  }

  return context.next();
}
