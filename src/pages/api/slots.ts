import { env } from 'cloudflare:workers';
import { getDb } from '../../db';
import { getAvailableSlots } from '../../lib/slots';

export const prerender = false;

export async function GET({ url }: { url: URL }) {
  const serviceId = parseInt(url.searchParams.get('serviceId') || '0', 10);
  const fecha = url.searchParams.get('fecha') || '';

  if (!serviceId || !fecha) {
    return new Response(JSON.stringify({ error: 'Parámetros requeridos: serviceId, fecha' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const db = getDb(env);
    const slots = await getAvailableSlots(db, serviceId, fecha);
    return new Response(JSON.stringify({ slots }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Error al consultar disponibilidad' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
