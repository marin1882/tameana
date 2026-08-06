import { env } from 'cloudflare:workers';
import { Resend } from 'resend';

export const prerender = false;

export async function GET() {
  const errors: string[] = [];
  const results: string[] = [];

  if (!env.RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY no configurada' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const to = env.THERAPIST_EMAIL || 'marin1882@gmail.com';
  const from = 'Caminatu Luz <reservas@caminatuluz.com>';

  results.push(`From: ${from}`);
  results.push(`To: ${to}`);

  // Test 1: enviar al terapeuta
  const r1 = await resend.emails.send({
    from,
    to: [to],
    subject: 'Test — Caminatu Luz',
    text: `Email de prueba — si lees esto, el envío al terapeuta funciona (${new Date().toISOString()}).`,
  });

  if (r1.error) {
    errors.push(`Terapeuta: ${JSON.stringify(r1.error)}`);
  } else {
    results.push(`Terapeuta: OK (${r1.data?.id || 'sin id'})`);
  }

  // Test 2: enviar al mismo destinatario simulando cliente
  const r2 = await resend.emails.send({
    from,
    to: [to],
    replyTo: to,
    subject: 'Test cliente — Caminatu Luz',
    text: `Hola, esto simula el acuse de recibo que recibe un cliente al reservar (${new Date().toISOString()}).`,
  });

  if (r2.error) {
    errors.push(`Cliente (test): ${JSON.stringify(r2.error)}`);
  } else {
    results.push(`Cliente (test): OK (${r2.data?.id || 'sin id'})`);
  }

  return new Response(JSON.stringify({ results, errors }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
}
