/**
 * Auth para el panel admin — cookie httpOnly firmada con HMAC-SHA256.
 *
 * No usa sesiones ni base de datos. La cookie contiene un timestamp + firma.
 * Si la firma es válida, la sesión está autenticada.
 */

const COOKIE_NAME = 'tameana_admin';
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 horas

function bytesToBase64url(bytes: Uint8Array): string {
  // Convertir bytes a Base64 estándar y luego hacerlo URL-safe
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function sign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  );
  return bytesToBase64url(new Uint8Array(signature));
}

/**
 * Crea una cookie firmada para el admin.
 */
export async function createAdminCookie(password: string, adminPassword: string): Promise<string | null> {
  if (password !== adminPassword) return null;

  const timestamp = Date.now().toString();
  const sig = await sign(timestamp, adminPassword);
  const value = `${timestamp}.${sig}`;

  return `${COOKIE_NAME}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${COOKIE_MAX_AGE}`;
}

/**
 * Verifica la cookie de admin. Devuelve true si es válida.
 */
export async function verifyAdminCookie(
  cookieHeader: string | null,
  adminPassword: string
): Promise<boolean> {
  if (!cookieHeader) return false;

  const match = cookieHeader.match(
    new RegExp(`${COOKIE_NAME}=([^;]+)`)
  );
  if (!match) return false;

  const value = match[1];
  const [timestamp, sig] = value.split('.');
  if (!timestamp || !sig) return false;

  // Verificar expiración (8h)
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Date.now() - ts > COOKIE_MAX_AGE * 1000) {
    return false;
  }

  // Verificar firma
  const expectedSig = await sign(timestamp, adminPassword);
  return sig === expectedSig;
}

/**
 * Cookie para cerrar sesión (expira inmediatamente).
 */
export const LOGOUT_COOKIE = `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
