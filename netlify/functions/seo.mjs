import fs from 'node:fs/promises';
import path from 'node:path';
import { loadLiveData, renderDocument, sitemap } from '../../artifacts/zaarour/scripts/seo.mjs';

export async function handler(event) {
  try {
    const root = path.join(process.cwd(), 'artifacts/zaarour/dist/public');
    const pathname = '/' + (event.queryStringParameters?.path || '').replace(/^\/+/, '');
    const origin = (process.env.VITE_SITE_URL || '').replace(/\/$/, '');
    const data = await loadLiveData(process.env) || JSON.parse(await fs.readFile(path.join(root, 'seo-data.json'), 'utf8'));
    const xml = pathname === '/sitemap.xml';
    const missing = pathname.startsWith('/cars/') && !data.cars.some(c => c.slug === pathname.slice(6) && !(c.sold && c.hideSold));
    const template = xml ? '' : await fs.readFile(path.join(root, 'shell.html'), 'utf8');
    return {
      statusCode: missing ? 404 : 200,
      headers: { 'Content-Type': xml ? 'application/xml; charset=utf-8' : 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=60' },
      body: xml ? sitemap(origin, data.cars) : renderDocument(template, pathname, data.cars, data.settings, origin),
    };
  } catch {
    return { statusCode: 503, body: 'Inventory is temporarily unavailable. Please try again.' };
  }
}
