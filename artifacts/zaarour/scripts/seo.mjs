/** Shared crawler-visible renderer, used at build time and by free host functions.
 * Content is intentionally semantic HTML rather than a second React application.
 * React replaces #root after loading, keeping the interactive experience intact.
 */
export const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const money = value => `$${Number(value).toLocaleString('en-US')}`;
const jsonScript = data => JSON.stringify(data).replace(/</g, '\\u003c');
const visible = car => !(car.sold && car.hideSold);

export const faq = [
  ['Can I buy a car in Lebanon in USD?', 'ZAAROUR lists all vehicle prices in US Dollars (USD). Contact the dealership to confirm current availability and payment arrangements.'],
  ['Do used cars at Zaarour come inspected?', 'Ask ZAAROUR for the inspection report and service history of the specific vehicle you are considering. Demo listings do not establish an inspection or warranty promise.'],
  ['How do I contact Zaarour on WhatsApp?', 'Use the WhatsApp button on a vehicle page to prepare a message about that car. Replace the demo phone number before contacting the live dealership.'],
];
const faqSchema = {
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faq.map(([name, text]) => ({
    '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text },
  })),
};

export function sitemap(origin, cars) {
  const paths = ['/', '/cars', '/about', '/contact', ...cars.filter(visible).map(c => `/cars/${c.slug}`)];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path =>
    `<url><loc>${escapeHtml(origin + path)}</loc></url>`).join('')}</urlset>`;
}

export function renderDocument(template, pathname, allCars, settings = {}, origin = '') {
  const latitude = Number(process.env.VITE_GEO_LATITUDE);
  const longitude = Number(process.env.VITE_GEO_LONGITUDE);
  const geo = process.env.VITE_GEO_LATITUDE && process.env.VITE_GEO_LONGITUDE
    && Number.isFinite(latitude) && Math.abs(latitude) <= 90
    && Number.isFinite(longitude) && Math.abs(longitude) <= 180
    ? { latitude, longitude } : null;
  const cars = allCars.filter(visible);
  const car = pathname.startsWith('/cars/') ? cars.find(c => `/cars/${c.slug}` === pathname) : null;
  const isMissing = pathname.startsWith('/cars/') && !car;
  const titles = {
    '/': 'ZAAROUR | Premium New & Used Cars in Moawad, Lebanon',
    '/cars': 'New & Used Cars for Sale in Lebanon | ZAAROUR Inventory',
    '/about': 'About ZAAROUR | Car Dealership in Moawad, Lebanon',
    '/contact': 'Contact ZAAROUR | Moawad, Lebanon Car Showroom',
  };
  const title = car ? `${car.year} ${car.make} ${car.model} for Sale in Lebanon | ${money(car.price)} | Zaarour`
    : isMissing ? 'Vehicle Not Found | ZAAROUR' : titles[pathname] || 'ZAAROUR';
  const descriptions = {
    '/': 'Discover premium new and used cars at ZAAROUR in Moawad, Lebanon. Browse vehicle specifications, mileage in km, transparent USD prices and WhatsApp inquiries.',
    '/cars': 'Browse ZAAROUR new and used car inventory in Moawad, Lebanon. Compare make, model, year, price in USD, mileage, engine, transmission and vehicle features.',
    '/about': 'ZAAROUR is a premium new and used car dealership based in Moawad, Lebanon, serving car buyers across Beirut, Mount Lebanon and the rest of Lebanon.',
    '/contact': 'Contact ZAAROUR in Moawad, Lebanon. Ask about vehicle availability, USD prices and specifications through WhatsApp or the dealership inquiry form.',
  };
  const description = car
    ? `${car.year} ${car.make} ${car.model} ${car.trim || ''}: ${money(car.price)} USD, ${Number(car.mileage).toLocaleString('en-US')} km, ${car.fuelType}, ${car.transmission}. Available from ZAAROUR, Moawad, Lebanon.`
    : descriptions[pathname] || 'This vehicle listing is unavailable.';
  const image = car?.images?.[0] || cars[0]?.images?.[0] || '';
  const schemas = [];
  const dealer = {
    '@context': 'https://schema.org', '@type': 'AutoDealer', name: 'ZAAROUR',
    address: { '@type': 'PostalAddress', addressLocality: 'Moawad', addressCountry: 'LB' },
    areaServed: ['Lebanon', 'Beirut', 'Mount Lebanon'],
    priceRange: '$$', currenciesAccepted: 'USD',
    ...(origin ? { url: origin } : {}),
    ...(settings.phone && !settings.phone.replace(/\D/g, '').includes('000000') ? { telephone: settings.phone } : {}),
    ...(geo ? {
      geo: { '@type': 'GeoCoordinates', ...geo },
    } : {}),
    ...(process.env.VITE_OPENING_HOURS_SCHEMA ? { openingHours: process.env.VITE_OPENING_HOURS_SCHEMA } : {}),
    sameAs: Object.values(settings.socials || {}).filter(url => /^https?:\/\//.test(url)),
  };
  schemas.push(dealer);
  if (pathname === '/' || pathname === '/contact') schemas.push(faqSchema);
  if (pathname === '/cars' || car) schemas.push({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
      { '@type': 'ListItem', position: 2, name: 'Inventory', item: `${origin}/cars` },
      ...(car ? [{ '@type': 'ListItem', position: 3, name: `${car.year} ${car.make} ${car.model}`, item: `${origin}${pathname}` }] : []),
    ],
  });
  if (car) schemas.push({
    '@context': 'https://schema.org', '@type': 'Car',
    name: `${car.year} ${car.make} ${car.model}`, brand: { '@type': 'Brand', name: car.make },
    model: car.model, vehicleModelDate: String(car.year),
    vehicleConfiguration: car.trim, color: car.exteriorColor,
    vehicleInteriorColor: car.interiorColor, fuelType: car.fuelType,
    vehicleTransmission: car.transmission, driveWheelConfiguration: car.drivetrain,
    bodyType: car.bodyType, description: car.description, image: car.images,
    mileageFromOdometer: { '@type': 'QuantitativeValue', value: car.mileage, unitCode: 'KMT' },
    itemCondition: `https://schema.org/${car.condition?.toLowerCase() === 'new' ? 'NewCondition' : 'UsedCondition'}`,
    offers: { '@type': 'Offer', price: car.price, priceCurrency: 'USD',
      availability: `https://schema.org/${car.sold ? 'SoldOut' : 'InStock'}`,
      url: `${origin}${pathname}`, seller: { '@type': 'AutoDealer', name: 'ZAAROUR' } },
  });

  const e = escapeHtml;
  const links = cars.map(c => `<article><a href="/cars/${e(c.slug)}"><img src="${e(c.images?.[0] || '')}" alt="${e(`${c.year} ${c.make} ${c.model}`)}" width="480" height="300" loading="lazy"><h2>${e(c.year)} ${e(c.make)} ${e(c.model)}</h2></a><p>${money(c.price)} USD · ${Number(c.mileage).toLocaleString('en-US')} km · ${e(c.fuelType)} · ${e(c.transmission)}${c.sold ? ' · Sold' : ''}</p></article>`).join('');
  const questions = `<section><h2>Buying a car in Lebanon: common questions</h2>${faq.map(([q, a]) => `<h3>${e(q)}</h3><p>${e(a)}</p>`).join('')}</section>`;
  let content = '';
  if (car) {
    const fields = ['year','make','model','trim','price','mileage','fuelType','transmission','engine','horsepower','drivetrain','bodyType','condition','exteriorColor','interiorColor','vin'];
    content = `<h1>${e(car.year)} ${e(car.make)} ${e(car.model)} for Sale in Lebanon</h1><p>${e(description)}</p><img src="${e(image)}" alt="${e(title)}" width="960" height="600"><dl>${fields.map(key => `<dt>${e(key.replace(/([A-Z])/g, ' $1'))}</dt><dd>${e(car[key] ?? 'Not specified')}${key === 'price' ? ' USD' : key === 'mileage' ? ' km' : ''}</dd>`).join('')}</dl><p>${e(car.description)}</p><h2>Features</h2><ul>${(car.features || []).map(f => `<li>${e(f)}</li>`).join('')}</ul><a href="/contact">Ask about this ${e(car.make)} ${e(car.model)}</a>`;
  } else if (pathname === '/about') {
    content = `<h1>About ZAAROUR in Moawad, Lebanon</h1><p>${e(description)}</p><p>Explore new and used vehicles with prices in US Dollars, mileage in kilometres and detailed specifications. Speak directly with the dealership about availability and a vehicle viewing.</p><a href="/cars">Explore the inventory</a>`;
  } else if (pathname === '/contact') {
    content = `<h1>Contact ZAAROUR — Moawad, Lebanon</h1><p>${e(description)}</p><address>${e(settings.address || 'Moawad, Lebanon')}</address><p>${e(settings.phone || 'Phone number awaiting confirmation')}</p><a href="https://www.openstreetmap.org/search?query=Moawad%20Lebanon">Find Moawad on OpenStreetMap</a>${questions}`;
  } else if (isMissing) content = '<h1>Vehicle not found</h1><p>This listing is no longer available.</p><a href="/cars">Browse available cars</a>';
  else content = `<h1>${pathname === '/cars' ? 'New & Used Cars for Sale in Lebanon' : 'ZAAROUR — Luxury That Moves You'}</h1><p>${e(description)}</p><p>Demonstration inventory. Confirm prices, specifications and availability with the dealership.</p><section class="seo-grid">${links}</section>${pathname === '/' ? questions : ''}`;

  const meta = `<title>${e(title)}</title><meta name="description" content="${e(description)}">
    ${origin ? `<link rel="canonical" href="${e(origin + pathname)}"><meta property="og:url" content="${e(origin + pathname)}">` : ''}
    <meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}">
    <meta property="og:type" content="website"><meta property="og:site_name" content="ZAAROUR">
    <meta property="og:image" content="${e(image)}"><meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${e(title)}"><meta name="twitter:description" content="${e(description)}"><meta name="twitter:image" content="${e(image)}">
    <meta name="geo.placename" content="Moawad, Lebanon"><meta name="geo.region" content="LB">
    ${geo ? `<meta name="geo.position" content="${geo.latitude};${geo.longitude}"><meta name="ICBM" content="${geo.latitude}, ${geo.longitude}">` : ''}
    ${car ? `<meta property="product:price:amount" content="${car.price}"><meta property="product:price:currency" content="USD">` : ''}
    ${isMissing ? '<meta name="robots" content="noindex">' : ''}
    ${schemas.map(schema => `<script data-prerender-schema type="application/ld+json">${jsonScript(schema)}</script>`).join('\n')}
    <style>#root>.seo-page{background:#101112;color:#ece9e0;font:16px/1.7 system-ui;padding:40px;min-height:100vh} .seo-page a{color:#cab48c}.seo-page nav{display:flex;gap:24px;flex-wrap:wrap}.seo-page img{max-width:100%;height:auto;object-fit:cover}.seo-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px}.seo-page dt{font-weight:bold}.seo-page dd{margin:0 0 12px}.seo-page footer{padding-top:32px}</style>`;
  return template.replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta[^>]*(?:name|property)=["'](?:description|og:[^"']+|twitter:[^"']+)["'][^>]*>/gi, '')
    .replace('</head>', `${meta}</head>`)
    .replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root"><div class="seo-page"><header><nav aria-label="Main navigation"><a href="/">ZAAROUR</a><a href="/cars">Inventory</a><a href="/about">About</a><a href="/contact">Contact</a></nav></header><main>${content}</main><footer>ZAAROUR — Moawad, Lebanon. All prices in USD. <a href="/admin">Administration</a></footer></div></div>`);
}

export async function loadLiveData(env) {
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const request = async table => {
    const response = await fetch(`${url}/rest/v1/${table}?select=*`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Supabase ${table} request failed (${response.status})`);
    return response.json();
  };
  const [rows, settingsRows] = await Promise.all([request('cars'), request('settings')]);
  return { cars: rows.map(row => row.data), settings: settingsRows.find(row => row.id === 'dealership')?.data || {} };
}
