import type { Car } from '@/data/cars';

export const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);
export const km = (n: number) => (n === 0 ? '0 km' : new Intl.NumberFormat('en-US').format(n) + ' km');
export const carTitle = (c: Pick<Car, 'year' | 'make' | 'model'>) => c.year + ' ' + c.make + ' ' + c.model;

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export function waLink(number: string, text?: string) {
  const digits = number.replace(/\D/g, '');
  return 'https://wa.me/' + digits + (text ? '?text=' + encodeURIComponent(text) : '');
}

export function carWaMessage(c: Car, url: string) {
  return 'Hello ZAAROUR, I am interested in the ' + carTitle(c) + (c.trim ? ' ' + c.trim : '') + ' listed at ' + usd(c.price) + ' (' + km(c.mileage) + '). Is it still available? ' + url;
}

export function normalizeCar(raw: unknown): Car {
  const r = (raw ?? {}) as Partial<Car>;
  return {
    id: String(r.id ?? ''), slug: String(r.slug ?? ''), make: r.make ?? '', model: r.model ?? '', year: Number(r.year) || new Date().getFullYear(),
    trim: r.trim ?? '', price: Number(r.price) || 0, mileage: Number(r.mileage) || 0, fuelType: r.fuelType ?? '', transmission: r.transmission ?? '',
    engine: r.engine ?? '', horsepower: Number(r.horsepower) || 0, drivetrain: r.drivetrain ?? '', bodyType: r.bodyType ?? '',
    condition: r.condition === 'new' ? 'new' : 'used', exteriorColor: r.exteriorColor ?? '', interiorColor: r.interiorColor ?? '',
    features: Array.isArray(r.features) ? r.features : [], description: r.description ?? '', vin: r.vin ?? '',
    images: Array.isArray(r.images) ? r.images : [], featured: !!r.featured, sold: !!r.sold, hideSold: !!r.hideSold, newArrival: !!r.newArrival,
  };
}

/** Public visibility: sold cars are hidden only when admin chose hideSold. */
export const isPublic = (c: Car) => !(c.sold && c.hideSold);
