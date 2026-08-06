/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface Env {
  // D1
  DB: D1Database;

  // Resend
  RESEND_API_KEY: string;
  RESEND_FROM: string;
  THERAPIST_EMAIL: string;

  // Admin
  ADMIN_PASSWORD: string;

  // Turnstile
  TURNSTILE_SECRET: string;
  TURNSTILE_SITE_KEY: string;

  // Stripe (futuro)
  PAYMENTS_ENABLED: string;
}

declare namespace App {
  interface Locals extends Runtime {
    env: Env;
  }
}
