import { Resend } from 'resend';

/**
 * Envía uno o varios emails con fallback waitUntil → sincrónico.
 *
 * En Cloudflare Workers, `ctx.waitUntil` mantiene el runtime vivo para
 * trabajo en segundo plano tras enviar la respuesta. Si no está disponible
 * (p.ej. en ciertos entornos o tests), se ejecuta sincrónicamente para
 * que el email no se pierda en silencio.
 */
export async function sendEmailsSafe(
  cfCtx: any,
  label: string,
  sendFn: () => Promise<void>
): Promise<void> {
  if (cfCtx?.executionCtx?.waitUntil) {
    cfCtx.executionCtx.waitUntil(
      sendFn().catch((e: unknown) =>
        console.error(`[email] ${label} FAIL:`, e)
      )
    );
  } else {
    console.warn(`[email] waitUntil no disponible, envío sincrónico de ${label}`);
    try {
      await sendFn();
      console.log(`[email] ${label} completado (síncrono)`);
    } catch (e: unknown) {
      console.error(`[email] ${label} FAIL:`, e);
    }
  }
}

interface BookingEmailData {
  nombre: string;
  email: string;
  telefono: string;
  mensaje?: string | null;
  servicio: string;
  fecha: string;
  hora: string;
  modalidad: string;
}

const FROM = 'Caminatu Luz <reservas@caminatuluz.com>';

function replyTo(env: Env): string {
  return env.THERAPIST_EMAIL || 'marin1882@gmail.com';
}

function logAndThrow(action: string, error: unknown): void {
  console.error(`[email] ${action}:`, JSON.stringify(error, null, 2));
}

/**
 * Envía notificación al terapeuta con los datos de la solicitud.
 */
export async function sendTherapistNotification(
  data: BookingEmailData,
  env: Env
): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY no configurada');
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const to = env.THERAPIST_EMAIL || 'marin1882@gmail.com';

  const mensaje = data.mensaje
    ? `\n\nMensaje de la persona:\n${data.mensaje}`
    : '';

  const { error } = await resend.emails.send({
    from: FROM,
    to: [to],
    replyTo: data.email,
    subject: `Nueva solicitud de reserva — ${data.servicio}`,
    text: `Nueva solicitud de reserva:

Servicio: ${data.servicio}
Modalidad: ${data.modalidad === 'presencial' ? 'Presencial' : 'Online'}
Fecha: ${data.fecha}
Hora: ${data.hora}

Datos de contacto:
Nombre: ${data.nombre}
Email: ${data.email}
Teléfono: ${data.telefono}${mensaje}

Gestiona esta reserva en: https://caminatuluz.com/admin`,
  });

  if (error) {
    logAndThrow('notificación terapeuta', error);
  } else {
    console.log(`[email] Notificación terapeuta enviada a ${to}`);
  }
}

/**
 * Envía acuse de recibo al cliente tras solicitar reserva.
 */
export async function sendClientConfirmation(
  data: BookingEmailData,
  env: Env
): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY no configurada');
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: FROM,
    to: [data.email],
    replyTo: replyTo(env),
    subject: 'Hemos recibido tu solicitud — Caminatu Luz',
    text: `Hola ${data.nombre},

Gracias por tu solicitud de reserva.

Servicio: ${data.servicio}
Modalidad: ${data.modalidad === 'presencial' ? 'Presencial' : 'Online'}
Fecha: ${data.fecha}
Hora: ${data.hora}

Hemos recibido tu solicitud y te confirmaremos en breve.
El pago se realiza en la sesión.

Si tienes alguna duda, responde a este correo.

Un abrazo,
Caminatu Luz`,
  });

  if (error) {
    logAndThrow('acuse cliente', error);
  } else {
    console.log(`[email] Acuse enviado a ${data.email}`);
  }
}

/**
 * Envía email al cliente cuando su reserva ha sido confirmada.
 */
export async function sendBookingConfirmed(
  data: BookingEmailData,
  env: Env
): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY no configurada');
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: FROM,
    to: [data.email],
    replyTo: replyTo(env),
    subject: 'Tu reserva ha sido confirmada — Caminatu Luz',
    text: `Hola ${data.nombre},

Tu reserva ha sido confirmada.

Servicio: ${data.servicio}
Modalidad: ${data.modalidad === 'presencial' ? 'Presencial' : 'Online'}
Fecha: ${data.fecha}
Hora: ${data.hora}

Te espero el día indicado. El pago se realiza en la sesión.

Si necesitas cambiar algo, responde a este correo.

Un abrazo,
Caminatu Luz`,
  });

  if (error) {
    logAndThrow('confirmación cliente', error);
  } else {
    console.log(`[email] Confirmación enviada a ${data.email}`);
  }
}

/**
 * Envía notificación a la terapeuta cuando alguien consulta por una sesión
 * fuera de Barcelona (formulario de /reservar/contacto). Sin email al cliente.
 */
export async function sendLocationInquiryNotification(
  data: {
    nombre: string;
    email: string;
    telefono: string;
    mensaje: string;
    servicio: string;
  },
  env: Env
): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY no configurada');
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const to = env.THERAPIST_EMAIL || 'marin1882@gmail.com';

  const { error } = await resend.emails.send({
    from: FROM,
    to: [to],
    replyTo: data.email,
    subject: `Consulta desde fuera de Barcelona — ${data.servicio}`,
    text: `Nueva consulta desde fuera de Barcelona:

Servicio: ${data.servicio}

Datos de contacto:
Nombre: ${data.nombre}
Email: ${data.email}
Teléfono: ${data.telefono}

Mensaje:
${data.mensaje}

Responde directamente a este correo para contactar con la persona.`,
  });

  if (error) {
    logAndThrow('consulta ubicación', error);
  } else {
    console.log(`[email] Consulta ubicación enviada a ${to}`);
  }
}

/**
 * Envía email al cliente cuando su reserva ha sido cancelada.
 */
export async function sendBookingCancelled(
  data: BookingEmailData,
  env: Env
): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY no configurada');
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: FROM,
    to: [data.email],
    replyTo: replyTo(env),
    subject: 'Tu reserva ha sido cancelada — Caminatu Luz',
    text: `Hola ${data.nombre},

Tu reserva ha sido cancelada.

Servicio: ${data.servicio}
Modalidad: ${data.modalidad === 'presencial' ? 'Presencial' : 'Online'}
Fecha: ${data.fecha}
Hora: ${data.hora}

Si fue un error o quieres reagendar, responde a este correo y buscamos otra fecha.

Un abrazo,
Caminatu Luz`,
  });

  if (error) {
    logAndThrow('cancelación cliente', error);
  } else {
    console.log(`[email] Cancelación enviada a ${data.email}`);
  }
}
