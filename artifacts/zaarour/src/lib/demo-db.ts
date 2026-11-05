import { demoCars, demoMakes, type Car, type Make } from '@/data/cars';
import { defaultSettings, mergeSettings, type Settings } from '@/lib/settings';

export interface Inquiry {
  id: string; name: string; phone: string; message: string; type: 'contact' | 'whatsapp';
  carSlug: string | null; handled: boolean; createdAt: string;
}
export interface DemoDB { cars: Car[]; makes: Make[]; settings: Settings; inquiries: Inquiry[] }

/** Browser-local demo workspace. Nothing here is sent anywhere. */
const KEY = 'zaarour-demo-workspace-v1';
const seed = (): DemoDB => JSON.parse(JSON.stringify({ cars: demoCars, makes: demoMakes, settings: defaultSettings, inquiries: [] }));

export function readDemo(): DemoDB {
  if (typeof window === 'undefined') return seed();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<DemoDB>;
      const s = seed();
      return { cars: p.cars ?? s.cars, makes: p.makes ?? s.makes, settings: mergeSettings(p.settings), inquiries: p.inquiries ?? [] };
    }
  } catch { /* fall through */ }
  return seed();
}

export function writeDemo(db: DemoDB) {
  try { window.localStorage.setItem(KEY, JSON.stringify(db)); }
  catch { throw new Error('Browser storage is full. Remove some uploaded demo images or reset the demo workspace.'); }
}
export function updateDemo(fn: (db: DemoDB) => void) { const db = readDemo(); fn(db); writeDemo(db); }
export function resetDemo() { window.localStorage.removeItem(KEY); }
export const uid = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2));
