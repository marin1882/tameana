import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { env } from 'cloudflare:workers';
import { getDb } from '../db';
import { bookings, services, clients } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { getAvailableSlots, getAvailableDaysInMonth } from '../lib/slots';
import { verifyTurnstile } from '../lib/turnstile';
import {
  sendTherapistNotification,
  sendClientConfirmation,
  sendBookingConfirmed,
  sendBookingCancelled,
  sendLocationInquiryNotification,
  sendEmailsSafe,
} from '../lib/email';

const db = getDb(env);

/** Verifica que la petición viene de un admin autenticado. */
function requireAdmin(ctx: any): void {
  if (!ctx.locals?.isAdmin) {
    throw new ActionError({
      code: 'UNAUTHORIZED',
      message: 'Acceso no autorizado.',
    });
  }
}

export const server = {
  getSlots: defineAction({
    input: z.object({
      serviceId: z.number(),
      fecha: z.string(),
    }),
    handler: async ({ serviceId, fecha }) => {
      try {
        const slots = await getAvailableSlots(db, serviceId, fecha);
        return { slots };
      } catch (err: any) {
        console.error('Error en getSlots:', err?.message || err);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'No se ha podido cargar la disponibilidad. Inténtalo de nuevo.',
        });
      }
    },
  }),

  getAvailableDays: defineAction({
    input: z.object({
      serviceId: z.number(),
      year: z.number(),
      month: z.number(),
    }),
    handler: async ({ serviceId, year, month }) => {
      try {
        const daysSet = await getAvailableDaysInMonth(db, serviceId, year, month);
        return { days: Array.from(daysSet).sort() };
      } catch (err: any) {
        console.error('Error en getAvailableDays:', err?.message || err);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'No se ha podido cargar el calendario. Inténtalo de nuevo.',
        });
      }
    },
  }),

  createBooking: defineAction({
    input: z.object({
      serviceId: z.number(),
      fecha: z.string(),
      hora_inicio: z.string(),
      modalidad: z.enum(['presencial', 'online']),
      nombre: z.string().min(1, 'El nombre es obligatorio'),
      email: z.string().email('Email inválido'),
      telefono: z.string().min(1, 'El teléfono es obligatorio'),
      mensaje: z.string().optional(),
      turnstileToken: z.string().min(1, 'Verificación anti-spam requerida'),
      privacyAccepted: z.literal(true, {
        errorMap: () => ({ message: 'Debes aceptar la política de privacidad.' }),
      }),
    }),
    handler: async (input, ctx) => {
      // 1. Verificar Turnstile
      const turnstileOk = await verifyTurnstile(
        input.turnstileToken,
        env.TURNSTILE_SECRET
      );

      if (!turnstileOk) {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: 'Verificación anti-spam fallida. Inténtalo de nuevo.',
        });
      }

      // 2. Obtener el servicio
      const service = await db.query.services.findFirst({
        where: eq(services.id, input.serviceId),
      });

      if (!service || !service.activo) {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: 'El servicio seleccionado no está disponible.',
        });
      }

      // 3. Validar que el slot sigue disponible
      const slots = await getAvailableSlots(db, input.serviceId, input.fecha);
      const slotAvailable = slots.some((s) => s.hora === input.hora_inicio);

      if (!slotAvailable) {
        throw new ActionError({
          code: 'CONFLICT',
          message: 'Esa hora acaba de ocuparse. Por favor, elige otro horario.',
        });
      }

      // 4. Calcular hora_fin
      const [h, m] = input.hora_inicio.split(':').map(Number);
      const startMinutes = h * 60 + m;
      const endMinutes = startMinutes + service.duracion_min;
      const hora_fin = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

      // 5. Insertar reserva
      try {
        await db.insert(bookings).values({
          service_id: input.serviceId,
          fecha: input.fecha,
          hora_inicio: input.hora_inicio,
          hora_fin,
          nombre: input.nombre.trim(),
          email: input.email.trim().toLowerCase(),
          telefono: input.telefono.trim(),
          mensaje: input.mensaje?.trim() || null,
          modalidad: input.modalidad,
          estado: 'pendiente',
          payment_status: 'no_aplica',
          created_at: new Date().toISOString(),
        });
      } catch (err: any) {
        if (err?.message?.includes('UNIQUE constraint')) {
          throw new ActionError({
            code: 'CONFLICT',
            message: 'Esa hora acaba de ocuparse. Por favor, elige otro horario.',
          });
        }
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al procesar la reserva. Inténtalo de nuevo.',
        });
      }

      // 6. Upsert del cliente (crea o actualiza automáticamente)
      try {
        await db.run(sql`
          INSERT INTO clients (email, nombre, telefono, created_at)
          VALUES (${input.email.trim().toLowerCase()}, ${input.nombre.trim()}, ${input.telefono.trim()}, ${new Date().toISOString()})
          ON CONFLICT(email) DO UPDATE SET nombre=excluded.nombre, telefono=excluded.telefono
        `);
      } catch (err: any) {
        console.error('[crm] Error en upsert cliente:', err?.message || err);
      }

      // 7. Enviar emails
      const emailData = {
        nombre: input.nombre.trim(),
        email: input.email.trim().toLowerCase(),
        telefono: input.telefono.trim(),
        mensaje: input.mensaje?.trim() || null,
        servicio: service.nombre,
        fecha: input.fecha,
        hora: input.hora_inicio,
        modalidad: input.modalidad,
      };

      // Enviar emails (terapeuta + acuse cliente)
      await sendEmailsSafe(ctx.locals?.cfContext, 'reserva', async () => {
        const [r1, r2] = await Promise.allSettled([
          sendTherapistNotification(emailData, env),
          sendClientConfirmation(emailData, env),
        ]);
        if (r1.status === 'rejected') console.error('[email] Terapeuta FAIL:', r1.reason);
        if (r2.status === 'rejected') console.error('[email] Cliente FAIL:', r2.reason);
      });

      return { success: true };
    },
  }),

  // ── Consulta desde fuera de Barcelona ──

  sendLocationInquiry: defineAction({
    input: z.object({
      servicio: z.string(),
      nombre: z.string().min(1, 'El nombre es obligatorio'),
      email: z.string().email('Email inválido'),
      telefono: z.string().min(1, 'El teléfono es obligatorio'),
      mensaje: z.string().min(1, 'El mensaje es obligatorio'),
      turnstileToken: z.string().min(1, 'Verificación anti-spam requerida'),
      privacyAccepted: z.literal(true, {
        errorMap: () => ({ message: 'Debes aceptar la política de privacidad.' }),
      }),
    }),
    handler: async (input, ctx) => {
      // Verificar Turnstile
      const turnstileOk = await verifyTurnstile(
        input.turnstileToken,
        env.TURNSTILE_SECRET
      );

      if (!turnstileOk) {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: 'Verificación anti-spam fallida. Inténtalo de nuevo.',
        });
      }

      // Enviar email a la terapeuta
      await sendEmailsSafe(ctx.locals?.cfContext, 'consulta ubicación', async () => {
        await sendLocationInquiryNotification(
          {
            nombre: input.nombre.trim(),
            email: input.email.trim().toLowerCase(),
            telefono: input.telefono.trim(),
            mensaje: input.mensaje.trim(),
            servicio: input.servicio,
          },
          env
        );
      });

      return { success: true };
    },
  }),

  // ── Admin ──

  confirmBooking: defineAction({
    input: z.object({
      id: z.number(),
    }),
    handler: async ({ id }, ctx) => {
      await requireAdmin(ctx);

      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, id),
      });

      if (!booking) {
        throw new ActionError({ code: 'NOT_FOUND', message: 'Reserva no encontrada.' });
      }

      const svc = await db.query.services.findFirst({
        where: eq(services.id, booking.service_id),
      });

      await db.update(bookings).set({ estado: 'confirmada' }).where(eq(bookings.id, id));

      await sendEmailsSafe(ctx.locals?.cfContext, 'confirmación', async () => {
        await sendBookingConfirmed(
          {
            nombre: booking.nombre,
            email: booking.email,
            telefono: booking.telefono,
            mensaje: booking.mensaje,
            servicio: svc?.nombre || '',
            fecha: booking.fecha,
            hora: booking.hora_inicio,
            modalidad: booking.modalidad,
          },
          env
        );
      });

      return { success: true };
    },
  }),

  cancelBooking: defineAction({
    input: z.object({
      id: z.number(),
    }),
    handler: async ({ id }, ctx) => {
      await requireAdmin(ctx);

      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, id),
      });

      if (!booking) {
        throw new ActionError({ code: 'NOT_FOUND', message: 'Reserva no encontrada.' });
      }

      const svc = await db.query.services.findFirst({
        where: eq(services.id, booking.service_id),
      });

      await db.update(bookings).set({ estado: 'cancelada' }).where(eq(bookings.id, id));

      await sendEmailsSafe(ctx.locals?.cfContext, 'cancelación', async () => {
        await sendBookingCancelled(
          {
            nombre: booking.nombre,
            email: booking.email,
            telefono: booking.telefono,
            mensaje: booking.mensaje,
            servicio: svc?.nombre || '',
            fecha: booking.fecha,
            hora: booking.hora_inicio,
            modalidad: booking.modalidad,
          },
          env
        );
      });

      return { success: true };
    },
  }),

  cleanupTestBookings: defineAction({
    input: z.object({}).optional(),
    handler: async (_, ctx) => {
      await requireAdmin(ctx);

      // Borrar reservas de prueba (las del seed o las creadas durante desarrollo)
      // Mantener solo las que tengan emails reales (no de example.com)
      await db.delete(bookings).where(
        sql`${bookings.email} LIKE '%@example.com' OR ${bookings.email} = 'maria@example.com'`
      );

      return { success: true };
    },
  }),

  // ── CRM: notas del admin ──

  updateBookingNote: defineAction({
    input: z.object({
      id: z.number(),
      nota_admin: z.string(),
    }),
    handler: async ({ id, nota_admin }, ctx) => {
      await requireAdmin(ctx);

      await db
        .update(bookings)
        .set({ nota_admin: nota_admin.trim() || null })
        .where(eq(bookings.id, id));

      return { success: true };
    },
  }),

  updateClientNote: defineAction({
    input: z.object({
      email: z.string().email(),
      notas: z.string(),
    }),
    handler: async ({ email, notas }, ctx) => {
      await requireAdmin(ctx);

      await db
        .update(clients)
        .set({ notas: notas.trim() || null })
        .where(eq(clients.email, email.toLowerCase()));

      return { success: true };
    },
  }),
};
