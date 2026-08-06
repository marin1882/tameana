import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  trailingSlash: 'never',
  integrations: [sitemap()],
  site: 'https://caminatuluz.com',
  vite: {
    plugins: [tailwindcss()],
  },
});
