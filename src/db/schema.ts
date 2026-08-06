import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ── Servicios ──
export const services = sqliteTable('services', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion').notNull(),
  duracion_min: integer('duracion_min').notNull().default(60),
  precio_cents: integer('precio_cents'), // nullable = sin precio definido aún
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
  orden: integer('orden').notNull().default(0),
});

// ── Disponibilidad semanal recurrente ──
export const availabilityRules = sqliteTable('availability_rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dia_semana: integer('dia_semana').notNull(), // 0=dom, 1=lun, ..., 6=sab
  hora_inicio: text('hora_inicio').notNull(), // "HH:mm"
  hora_fin: text('hora_fin').notNull(), // "HH:mm"
});

// ── Excepciones (vacaciones / bloqueos) ──
export const availabilityExceptions = sqliteTable('availability_exceptions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fecha: text('fecha').notNull(), // "YYYY-MM-DD"
  hora_inicio: text('hora_inicio'), // nullable = día entero bloqueado
  hora_fin: text('hora_fin'),
});

// ── Clientes (mini-CRM) ──
export const clients = sqliteTable('clients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  nombre: text('nombre').notNull(),
  telefono: text('telefono').notNull(),
  notas: text('notas'), // nullable — notas generales del admin sobre el cliente
  created_at: text('created_at').notNull(),
});

// ── Reservas ──
export const bookings = sqliteTable(
  'bookings',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    service_id: integer('service_id')
      .notNull()
      .references(() => services.id),
    fecha: text('fecha').notNull(), // "YYYY-MM-DD"
    hora_inicio: text('hora_inicio').notNull(), // "HH:mm"
    hora_fin: text('hora_fin').notNull(), // "HH:mm"
    nombre: text('nombre').notNull(),
    email: text('email').notNull(),
    telefono: text('telefono').notNull(),
    mensaje: text('mensaje'), // opcional
    nota_admin: text('nota_admin'), // nullable — nota del admin sobre esta sesión
    estado: text('estado', { enum: ['pendiente', 'confirmada', 'cancelada'] })
      .notNull()
      .default('pendiente'),
    modalidad: text('modalidad', { enum: ['presencial', 'online'] }).notNull(),
    payment_status: text('payment_status').notNull().default('no_aplica'),
    created_at: text('created_at').notNull(),
  },
  (table) => [
    // Índice único parcial: no permite doble reserva en mismo slot
    // (solo para reservas no canceladas)
    uniqueIndex('idx_bookings_slot')
      .on(table.fecha, table.hora_inicio)
      .where(sql`${table.estado} != 'cancelada'`),
  ]
);
