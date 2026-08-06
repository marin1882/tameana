import { defineMiddleware } from 'astro:middleware';
import { verifyAdminCookie } from './lib/auth';
import { env } from 'cloudflare:workers';

const ADMIN_PAGE_PREFIX = '/admin';
const PUBLIC_PATHS = ['/admin/login'];
const ADMIN_ACTIONS = [
  '/_actions/confirmBooking',
  '/_actions/cancelBooking',
  '/_actions/cleanupTestBookings',
];

/** Rutas SSR que nunca deben cachearse en CDN. */
const SSR_NO_CACHE = ['/reservar', '/admin'];

function shouldSkipCache(pathname: string): boolean {
  return SSR_NO_CACHE.some((p) => pathname.startsWith(p));
}

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);

  // Verificar cookie de admin
  const cookieHeader = context.request.headers.get('cookie');
  const adminPassword = env.ADMIN_PASSWORD || 'tameana-admin-2026';
  const isAdmin = await verifyAdminCookie(cookieHeader, adminPassword);

  // Marcar estado de admin en locals para que las actions lo lean
  context.locals.isAdmin = isAdmin;

  // Proteger acciones de admin
  if (ADMIN_ACTIONS.some((p) => url.pathname.startsWith(p))) {
    if (!isAdmin) {
      return new Response(
        JSON.stringify({
          type: 'AstroActionError',
          code: 'UNAUTHORIZED',
          status: 401,
          message: 'Acceso no autorizado.',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // Proteger páginas /admin/*
  if (url.pathname.startsWith(ADMIN_PAGE_PREFIX)) {
    // Permitir acceso a la página de login sin auth
    if (PUBLIC_PATHS.some((p) => url.pathname.startsWith(p))) {
      const response = await next();
      if (shouldSkipCache(url.pathname)) {
        response.headers.set('Cache-Control', 'no-store');
      }
      return response;
    }

    if (!isAdmin) {
      return context.redirect(
        `/admin/login?redirect=${encodeURIComponent(url.pathname)}`
      );
    }
  }

  const response = await next();

  // Las rutas SSR dinámicas no deben cachearse en CDN
  if (shouldSkipCache(url.pathname)) {
    response.headers.set('Cache-Control', 'no-store');
  }

  return response;
});
