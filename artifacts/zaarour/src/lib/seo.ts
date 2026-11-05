import { useEffect } from 'react';
import type { Car } from '@/data/cars';
import { carTitle } from '@/lib/format';
import { isPlaceholderNumber, type Settings } from '@/lib/settings';

const latitude = Number(import.meta.env.VITE_GEO_LATITUDE);
const longitude = Number(import.meta.env.VITE_GEO_LONGITUDE);
const verifiedGeo = import.meta.env.VITE_GEO_LATITUDE && import.meta.env.VITE_GEO_LONGITUDE
  && Number.isFinite(latitude) && Math.abs(latitude) <= 90
  && Number.isFinite(longitude) && Math.abs(longitude) <= 180
  ? { latitude, longitude } : null;

const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
export const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '') + base;
export const DEFAULT_OG = 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&h=630&q=70';

function meta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>('meta[' + attr + '="' + key + '"]');
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.content = content;
}
function jsonLd(id: string, data: unknown) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!data) { el?.remove(); return; }
  if (!el) { el = document.createElement('script'); el.type = 'application/ld+json'; el.id = id; document.head.appendChild(el); }
  el.textContent = JSON.stringify(data);
}

export interface SeoProps { title: string; description: string; path: string; image?: string; type?: string; ld?: unknown[] }

export function useSeo({ title, description, path, image, type = 'website', ld }: SeoProps) {
  const ldStr = JSON.stringify(ld ?? []);
  useEffect(() => {
    // Static route markup must not survive client-side navigation as stale schema.
    document.head.querySelectorAll('[data-prerender-schema]').forEach(el => el.remove());
    const url = SITE_URL + path;
    document.title = title;
    meta('name', 'description', description);
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
    link.href = url;
    meta('property', 'og:title', title); meta('property', 'og:description', description); meta('property', 'og:url', url);
    meta('property', 'og:type', type); meta('property', 'og:image', image || DEFAULT_OG); meta('property', 'og:site_name', 'ZAAROUR');
    meta('name', 'twitter:card', 'summary_large_image'); meta('name', 'twitter:title', title);
    meta('name', 'twitter:description', description); meta('name', 'twitter:image', image || DEFAULT_OG);
    const arr = JSON.parse(ldStr) as unknown[];
    jsonLd('route-jsonld', arr.length ? arr : null);
  }, [title, description, path, image, type, ldStr]);
}

export function useSiteSchema(s: Settings) {
  const str = JSON.stringify(s);
  useEffect(() => {
    meta('name', 'geo.region', 'LB'); meta('name', 'geo.placename', 'Moawad, Lebanon');
    if (verifiedGeo) {
      meta('name', 'geo.position', verifiedGeo.latitude + ';' + verifiedGeo.longitude);
      meta('name', 'ICBM', verifiedGeo.latitude + ', ' + verifiedGeo.longitude);
    }
    jsonLd('site-jsonld', autoDealerLd(JSON.parse(str) as Settings));
  }, [str]);
}

export function autoDealerLd(s: Settings) {
  const sameAs = Object.values(s.socials).filter((v) => /^https?:\/\//.test(v));
  return {
    '@context': 'https://schema.org', '@type': 'AutoDealer', name: 'ZAAROUR', url: SITE_URL + '/',
    description: 'Premium new and used car dealership in Moawad, Lebanon, serving buyers across Beirut and Mount Lebanon. All prices in USD.',
    ...(!isPlaceholderNumber(s.phone) ? { telephone: s.phone } : {}),
    address: { '@type': 'PostalAddress', streetAddress: s.address, addressLocality: 'Moawad', addressCountry: 'LB' },
    ...(verifiedGeo ? { geo: { '@type': 'GeoCoordinates', ...verifiedGeo } } : {}),
    areaServed: ['Beirut', 'Mount Lebanon', 'Lebanon'], currenciesAccepted: 'USD',
    ...(!isPlaceholderNumber(s.whatsapp) ? { contactPoint: { '@type': 'ContactPoint', telephone: s.whatsapp, contactType: 'sales' } } : {}),
    ...(import.meta.env.VITE_OPENING_HOURS_SCHEMA ? { openingHours: import.meta.env.VITE_OPENING_HOURS_SCHEMA } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}
export function carLd(c: Car) {
  return {
    '@context': 'https://schema.org', '@type': 'Car', name: carTitle(c) + (c.trim ? ' ' + c.trim : ''), brand: { '@type': 'Brand', name: c.make },
    model: c.model, vehicleModelDate: String(c.year), productionDate: String(c.year), bodyType: c.bodyType, fuelType: c.fuelType, vehicleTransmission: c.transmission,
    driveWheelConfiguration: c.drivetrain, color: c.exteriorColor, vehicleInteriorColor: c.interiorColor, ...(c.vin ? { vehicleIdentificationNumber: c.vin } : {}),
    vehicleEngine: { '@type': 'EngineSpecification', name: c.engine, enginePower: { '@type': 'QuantitativeValue', value: c.horsepower, unitCode: 'BHP' } },
    mileageFromOdometer: { '@type': 'QuantitativeValue', value: c.mileage, unitCode: 'KMT' },
    itemCondition: c.condition === 'new' ? 'https://schema.org/NewCondition' : 'https://schema.org/UsedCondition',
    image: c.images, description: c.description, url: SITE_URL + '/cars/' + c.slug,
    offers: { '@type': 'Offer', price: c.price, priceCurrency: 'USD', availability: c.sold ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock', seller: { '@type': 'AutoDealer', name: 'ZAAROUR' } },
  };
}
export function breadcrumbLd(items: { name: string; path: string }[]) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: SITE_URL + it.path })) };
}
export function faqLd(faqs: { q: string; a: string }[]) {
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };
}
