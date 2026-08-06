import { eq, and, ne, inArray, gte, lte } from 'drizzle-orm';
import type { DbClient } from '../db';
import {
  services,
  availabilityRules,
  availabilityExceptions,
  bookings,
} from '../db/schema';

export interface TimeSlot {
  hora: string; // "HH:mm"
}

const BUFFER_MIN = 15;
const MIN_ADVANCE_HOURS = 24;

// ── Helpers ──

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function overlaps(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && endA > startB;
}

/**
 * Devuelve la fecha/hora actual en la zona Europe/Madrid como [fecha, minutos].
 * Workers corre en UTC; esto compensa la diferencia.
 */
function nowInMadrid(): { fecha: string; minutos: number } {
  const utc = new Date();
  // Calcular offset de Madrid para esta fecha UTC concreta
  // Formato: "2026-07-10T16:00:00Z" → local madrid
  const madrid = new Date(
    utc.toLocaleString('en-US', { timeZone: 'Europe/Madrid' })
  );
  const fecha = `${madrid.getFullYear()}-${String(madrid.getMonth() + 1).padStart(2, '0')}-${String(madrid.getDate()).padStart(2, '0')}`;
  const minutos = madrid.getHours() * 60 + madrid.getMinutes();
  return { fecha, minutos };
}

// ── Slot generation ──

export async function getAvailableSlots(
  db: DbClient,
  serviceId: number,
  dateStr: string
): Promise<TimeSlot[]> {
  const service = await db.query.services.findFirst({
    where: eq(services.id, serviceId),
  });
  if (!service || !service.activo) return [];

  const slotDuration = service.duracion_min + BUFFER_MIN;

  // Día de la semana usando el constructor local (la fecha es YYYY-MM-DD,
  // que en UTC puede caer en día distinto. Lo corregimos abajo)
  const parts = dateStr.split('-').map(Number);
  // Usar constructor con año/mes/día local (el mes es 0-indexed)
  const localDate = new Date(parts[0], parts[1] - 1, parts[2]);
  const diaSemana = localDate.getDay(); // 0=dom en local

  const rules = await db.query.availabilityRules.findMany({
    where: eq(availabilityRules.dia_semana, diaSemana),
  });
  if (rules.length === 0) return [];

  const exceptions = await db.query.availabilityExceptions.findMany({
    where: eq(availabilityExceptions.fecha, dateStr),
  });

  const existingBookings = await db.query.bookings.findMany({
    where: and(
      eq(bookings.fecha, dateStr),
      ne(bookings.estado, 'cancelada')
    ),
  });

  const madrid = nowInMadrid();
  const slots: TimeSlot[] = [];

  for (const rule of rules) {
    const ruleStart = timeToMinutes(rule.hora_inicio);
    const ruleEnd = timeToMinutes(rule.hora_fin);

    for (let slotStart = ruleStart; slotStart + slotDuration <= ruleEnd; slotStart += slotDuration) {
      const slotEnd = slotStart + slotDuration;

      // Excepciones
      const blockedByException = exceptions.some((exc) => {
        if (!exc.hora_inicio) return true;
        const es = timeToMinutes(exc.hora_inicio);
        const ee = exc.hora_fin ? timeToMinutes(exc.hora_fin) : 24 * 60;
        return overlaps(slotStart, slotEnd, es, ee);
      });
      if (blockedByException) continue;

      // Bookings
      const blockedByBooking = existingBookings.some((b) => {
        const bs = timeToMinutes(b.hora_inicio);
        const be = timeToMinutes(b.hora_fin);
        return overlaps(slotStart, slotEnd, bs, be);
      });
      if (blockedByBooking) continue;

      // Antelación mínima: comparar en hora de Madrid
      if (dateStr === madrid.fecha && slotStart <= madrid.minutos + MIN_ADVANCE_HOURS * 60) {
        continue;
      }
      // También filtrar fechas pasadas
      if (dateStr < madrid.fecha) continue;

      slots.push({ hora: minutesToTime(slotStart) });
    }
  }

  return slots;
}

// ── Días disponibles en un mes (optimizado) ──

export async function getAvailableDaysInMonth(
  db: DbClient,
  serviceId: number,
  year: number,
  month: number
): Promise<Set<string>> {
  const service = await db.query.services.findFirst({
    where: eq(services.id, serviceId),
  });
  if (!service || !service.activo) return new Set();

  const slotDuration = service.duracion_min + BUFFER_MIN;
  const days = new Set<string>();

  // Días laborables (lun-vie = 1-5) con reglas
  const rules = await db.query.availabilityRules.findMany({
    where: inArray(availabilityRules.dia_semana, [1, 2, 3, 4, 5]),
  });

  // Agrupar reglas por día de la semana
  const rulesByDay: Map<number, { start: number; end: number }[]> = new Map();
  for (const r of rules) {
    const list = rulesByDay.get(r.dia_semana) || [];
    list.push({ start: timeToMinutes(r.hora_inicio), end: timeToMinutes(r.hora_fin) });
    rulesByDay.set(r.dia_semana, list);
  }

  // Excepciones del mes
  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDate = new Date(year, month, 0);
  const lastDay = `${year}-${String(month).padStart(2, '0')}-${String(lastDate.getDate()).padStart(2, '0')}`;

  const exceptions = await db.query.availabilityExceptions.findMany({
    where: and(
      gte(availabilityExceptions.fecha, firstDay),
      lte(availabilityExceptions.fecha, lastDay)
    ),
  });

  // Excepciones de día completo
  const fullDayBlocked = new Set(
    exceptions.filter((e) => !e.hora_inicio).map((e) => e.fecha)
  );

  const daysInMonth = lastDate.getDate();
  const madrid = nowInMadrid();

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // No mostrar fechas pasadas
    if (dateStr < madrid.fecha) continue;

    // Día bloqueado por excepción
    if (fullDayBlocked.has(dateStr)) continue;

    // Día de la semana
    const d = new Date(year, month - 1, day);
    const dow = d.getDay();
    const dayRules = rulesByDay.get(dow);
    if (!dayRules || dayRules.length === 0) continue;

    // Verificar si al menos una regla produce un slot válido
    let hasSlot = false;
    for (const rule of dayRules) {
      for (let start = rule.start; start + slotDuration <= rule.end; start += slotDuration) {
        // ¿Es hoy y el slot ya pasó?
        if (dateStr === madrid.fecha && start <= madrid.minutos + MIN_ADVANCE_HOURS * 60) continue;

        // ¿Está este slot bloqueado por excepción parcial?
        const blockedByExc = exceptions.some((e) => {
          if (!e.hora_inicio || e.fecha !== dateStr) return false;
          const es = timeToMinutes(e.hora_inicio);
          const ee = e.hora_fin ? timeToMinutes(e.hora_fin) : 24 * 60;
          return overlaps(start, start + slotDuration, es, ee);
        });
        if (blockedByExc) continue;

        hasSlot = true;
        break;
      }
      if (hasSlot) break;
    }

    if (hasSlot) {
      days.add(dateStr);
      // Si este día está limpio (sin bookings que consuman TODOS los slots),
      // lo marcamos como disponible. La verificación fina se hace al cargar horas.
    }
  }

  return days;
}
