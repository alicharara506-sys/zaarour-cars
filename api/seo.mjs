// Vercel free serverless adapter. Public Supabase reads honor RLS.
import fs from 'node:fs/promises';
import path from 'node:path';
import { loadLiveData, renderDocument, sitemap } from '../artifacts/zaarour/scripts/seo.mjs';

export default async function handler(req, res) {
  try {
    const root = path.join(process.cwd(), 'artifacts/zaarour/dist/public');
    const route = (Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path || '').replace(/^\/+/, '');
    const pathname = '/' + route;
    const origin = (process.env.VITE_SITE_URL || '').replace(/\/$/, '');
    const data = await loadLiveData(process.env) || JSON.parse(await fs.readFile(path.join(root, 'seo-data.json'), 'utf8'));
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=60');
    if (pathname === '/sitemap.xml') {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      return res.status(200).send(sitemap(origin, data.cars));
    }
    if (pathname.startsWith('/cars/') && !data.cars.some(c => c.slug === pathname.slice(6) && !(c.sold && c.hideSold))) res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    const template = await fs.readFile(path.join(root, 'shell.html'), 'utf8');
    return res.send(renderDocument(template, pathname, data.cars, data.settings, origin));
  } catch {
    return res.status(503).send('Inventory is temporarily unavailable. Please try again.');
  }
}
