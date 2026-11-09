import { NextResponse, type NextRequest } from 'next/server';

const LANG_COOKIE = 'ss_lang';

function preferredLang(request: NextRequest): 'bn' | 'en' {
  const saved = request.cookies.get(LANG_COOKIE)?.value;
  if (saved === 'bn' || saved === 'en') return saved;
  const accept = request.headers.get('accept-language') ?? '';
  const first = accept.split(',')[0]?.trim().toLowerCase() ?? '';
  return first.startsWith('en') && !accept.toLowerCase().includes('bn') ? 'en' : 'bn';
}

/** Puts every page under /bn or /en and remembers the last language the visitor chose. */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const match = pathname.match(/^\/(bn|en)(\/|$)/);
  if (!match) {
    const url = request.nextUrl.clone();
    url.pathname = `/${preferredLang(request)}${pathname === '/' ? '' : pathname}`;
    url.search = search;
    return NextResponse.redirect(url);
  }
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-ss-lang', match[1]);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (request.cookies.get(LANG_COOKIE)?.value !== match[1]) {
    response.cookies.set(LANG_COOKIE, match[1], { path: '/', maxAge: 365 * 86_400, sameSite: 'lax' });
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/|api/|icon|apple-icon|favicon|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|ico|webmanifest|woff2?)$).*)'],
};
