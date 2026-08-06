/**
 * Verifica un token de Cloudflare Turnstile en el servidor.
 * Usa el endpoint siteverify: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */
export async function verifyTurnstile(
  token: string,
  secret: string,
  remoteIp?: string
): Promise<boolean> {
  const formData = new URLSearchParams();
  formData.append('secret', secret);
  formData.append('response', token);
  if (remoteIp) {
    formData.append('remoteip', remoteIp);
  }

  const result = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      body: formData,
    }
  );

  const outcome = await result.json() as { success: boolean };
  return outcome.success === true;
}
