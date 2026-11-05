import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { demoCars } from '../src/data/cars.ts';
import { loadLiveData, renderDocument, sitemap } from './seo.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Vite loads these for its own process; the following Node stage needs them too.
for (const filename of ['.env', '.env.local']) {
  try { process.loadEnvFile(path.join(root, filename)); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
const output = path.join(root, 'dist/public');
const template = await fs.readFile(path.join(output, 'index.html'), 'utf8');
// Preserve the empty React shell for on-demand SEO rendering after admin changes.
await fs.writeFile(path.join(output, 'shell.html'), template);
const live = await loadLiveData(process.env);
const cars = live?.cars || demoCars;
const settings = live?.settings || {};
const origin = (process.env.VITE_SITE_URL || '').replace(/\/$/, '');
if (!origin) console.warn('VITE_SITE_URL not set: sitemap has relative URLs and canonical URLs are omitted. Configure your real domain before indexing.');
for (const route of ['/', '/cars', '/about', '/contact', ...cars.filter(c => !(c.sold && c.hideSold)).map(c => `/cars/${c.slug}`)]) {
  const folder = path.join(output, route);
  await fs.mkdir(folder, { recursive: true });
  await fs.writeFile(path.join(folder, 'index.html'), renderDocument(template, route, cars, settings, origin));
}
await fs.writeFile(path.join(output, 'sitemap.xml'), sitemap(origin, cars));
await fs.writeFile(path.join(output, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin\n${origin ? `Sitemap: ${origin}/sitemap.xml\n` : ''}`);
await fs.writeFile(path.join(output, 'seo-data.json'), JSON.stringify({ cars, settings }));

// Idempotent seeding; no admin identities or credentials are included.
const sqlString = value => `'${String(value).replace(/'/g, "''")}'`;
await fs.mkdir(path.resolve(root, '../../supabase'), { recursive: true });
const seed = [
  '-- Demo vehicles only. Run after schema.sql. Safe to repeat; does not overwrite existing rows.',
  ...demoCars.map(c => `insert into public.cars(id,slug,data) values (${sqlString(c.id)},${sqlString(c.slug)},${sqlString(JSON.stringify(c))}::jsonb) on conflict(id) do nothing;`),
  ...[...new Set(demoCars.map(c => c.make))].map(make => `insert into public.makes(id,name,logo) values (${sqlString(make.toLowerCase().replace(/[^a-z0-9]+/g, '-'))},${sqlString(make)},'') on conflict do nothing;`),
  `insert into public.settings(id,data) values ('dealership','{"whatsapp":"+96100000000","phone":"+961 00 000 000","address":"Moawad, Lebanon","hours":"Confirm opening hours with the dealership","socials":{"facebook":"#","instagram":"#","tiktok":"#","x":"#"}}'::jsonb) on conflict(id) do nothing;`,
].join('\n');
await fs.writeFile(path.resolve(root, '../../supabase/seed.sql'), seed + '\n');
console.info(`Prerendered ${cars.length + 4} public pages, robots.txt and sitemap.xml.`);
