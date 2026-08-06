import { env } from 'cloudflare:workers';
import { getDb } from '../../db';
import { getAvailableDaysInMonth } from '../../lib/slots';

export const prerender = false;

export async function GET({ url }: { url: URL }) {
  const serviceId = parseInt(url.searchParams.get('serviceId') || '0', 10);
  const year = parseInt(url.searchParams.get('year') || '0', 10);
  const month = parseInt(url.searchParams.get('month') || '0', 10);

  if (!serviceId || !year || !month) {
    return new Response(
      JSON.stringify({ error: 'Parámetros requeridos: serviceId, year, month' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const db = getDb(env);
    const daysSet = await getAvailableDaysInMonth(db, serviceId, year, month);
    const days = Array.from(daysSet).sort();
    return new Response(JSON.stringify({ days }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Error al consultar disponibilidad' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
