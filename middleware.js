// Vercel Edge Middleware for Subdomain Routing
// Intercepts *.nvmedya.com requests before static index.html is served

export default function middleware(request) {
  const host = request.headers.get('host') || request.headers.get('x-forwarded-host') || '';
  const hostname = host.split(':')[0].toLowerCase().trim();

  // Exclude main site domains, preview URLs, and localhost
  if (
    hostname === 'www.nvmedya.com' ||
    hostname === 'nvmedya.com' ||
    hostname.endsWith('.vercel.app') ||
    hostname.includes('localhost')
  ) {
    return new Response(null, {
      headers: { 'x-middleware-next': '1' }
    });
  }

  // Handle *.nvmedya.com subdomains
  if (hostname.endsWith('.nvmedya.com')) {
    const slug = hostname.slice(0, hostname.length - '.nvmedya.com'.length);
    if (slug && !slug.includes('.')) {
      const rewriteUrl = new URL('/api/invitation?slug=' + encodeURIComponent(slug), request.url);
      return new Response(null, {
        headers: {
          'x-middleware-rewrite': rewriteUrl.toString()
        }
      });
    }
  }

  return new Response(null, {
    headers: { 'x-middleware-next': '1' }
  });
}

export const config = {
  matcher: ['/((?!assets|_next|_vercel|favicon.ico).*)']
};
