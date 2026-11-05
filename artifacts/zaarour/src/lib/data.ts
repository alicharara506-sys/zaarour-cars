import type { Car, Make } from '@/data/cars';
import { normalizeCar } from '@/lib/format';
import { mergeSettings, type Settings } from '@/lib/settings';
import { supabase, STORAGE_BUCKET } from '@/lib/supabase';
import { readDemo, updateDemo, uid, type Inquiry } from '@/lib/demo-db';

/* ---------------- Public reads (Supabase when configured, else browser demo data) ---------------- */
export async function fetchCars(): Promise<Car[]> {
  if (supabase) {
    const { data, error } = await supabase.from('cars').select('data');
    if (error) throw error;
    return (data ?? []).map((r: { data: unknown }) => normalizeCar(r.data));
  }
  return readDemo().cars.map(normalizeCar);
}
export async function fetchMakes(): Promise<Make[]> {
  if (supabase) {
    const { data, error } = await supabase.from('makes').select('id,name,logo').order('name');
    if (error) throw error;
    return (data ?? []) as Make[];
  }
  return readDemo().makes;
}
export async function fetchSettings(): Promise<Settings> {
  if (supabase) {
    const { data, error } = await supabase.from('settings').select('data').eq('id', 'dealership').maybeSingle();
    if (error) throw error;
    return mergeSettings(data?.data);
  }
  return readDemo().settings;
}

export interface InquiryInput { name: string; phone: string; message: string; type: 'contact' | 'whatsapp'; carSlug?: string | null }

/** Returns 'live' if stored in Supabase, 'demo' if saved only in this browser. */
export async function submitInquiry(i: InquiryInput): Promise<'live' | 'demo'> {
  if (supabase) {
    const { error } = await supabase.from('inquiries').insert({ name: i.name, phone: i.phone, message: i.message, type: i.type, car_slug: i.carSlug ?? null });
    if (error) throw error;
    return 'live';
  }
  updateDemo((db) => { db.inquiries.unshift({ id: uid(), name: i.name, phone: i.phone, message: i.message, type: i.type, carSlug: i.carSlug ?? null, handled: false, createdAt: new Date().toISOString() }); });
  return 'demo';
}

/** Fire-and-forget WhatsApp click log. */
export function logWhatsAppClick(carSlug?: string | null) {
  submitInquiry({ name: 'WhatsApp click', phone: '', message: carSlug ? 'Opened WhatsApp about ' + carSlug : 'Opened WhatsApp chat', type: 'whatsapp', carSlug }).catch(() => undefined);
}

/* ---------------- Admin backends ---------------- */
export type Mode = 'live' | 'demo';
export interface AdminBackend {
  mode: Mode;
  listCars(): Promise<Car[]>; saveCar(c: Car): Promise<void>; deleteCar(id: string): Promise<void>;
  listMakes(): Promise<Make[]>; saveMake(m: Make): Promise<void>; deleteMake(id: string): Promise<void>;
  getSettings(): Promise<Settings>; saveSettings(s: Settings): Promise<void>;
  listInquiries(): Promise<Inquiry[]>; setHandled(id: string, handled: boolean): Promise<void>; deleteInquiry(id: string): Promise<void>;
  uploadImage(file: File, folder: string): Promise<string>;
}

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
export function validateImage(file: File) {
  if (!ALLOWED.includes(file.type)) throw new Error(file.name + ': only JPG, PNG or WebP allowed.');
  if (file.size > 5 * 1024 * 1024) throw new Error(file.name + ': larger than 5 MB.');
}

/** Compress to a small data URL so demo images fit in localStorage. */
function fileToDataUrl(file: File, max = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => reject(new Error('Could not read image ' + file.name));
    img.src = url;
  });
}

export const demoBackend: AdminBackend = {
  mode: 'demo',
  listCars: async () => readDemo().cars.map(normalizeCar),
  saveCar: async (c) => updateDemo((db) => { const i = db.cars.findIndex((x) => x.id === c.id); if (i >= 0) db.cars[i] = c; else db.cars.unshift(c); }),
  deleteCar: async (id) => updateDemo((db) => { db.cars = db.cars.filter((c) => c.id !== id); }),
  listMakes: async () => readDemo().makes,
  saveMake: async (m) => updateDemo((db) => { const i = db.makes.findIndex((x) => x.id === m.id); if (i >= 0) db.makes[i] = m; else db.makes.push(m); }),
  deleteMake: async (id) => updateDemo((db) => { db.makes = db.makes.filter((m) => m.id !== id); }),
  getSettings: async () => readDemo().settings,
  saveSettings: async (s) => updateDemo((db) => { db.settings = s; }),
  listInquiries: async () => readDemo().inquiries,
  setHandled: async (id, handled) => updateDemo((db) => { db.inquiries = db.inquiries.map((q) => (q.id === id ? { ...q, handled } : q)); }),
  deleteInquiry: async (id) => updateDemo((db) => { db.inquiries = db.inquiries.filter((q) => q.id !== id); }),
  uploadImage: async (file) => { validateImage(file); return fileToDataUrl(file); },
};

function sb() { if (!supabase) throw new Error('Supabase is not configured.'); return supabase; }
function check<T extends { error: unknown }>(r: T): T { if (r.error) throw r.error; return r; }

export const liveBackend: AdminBackend = {
  mode: 'live',
  listCars: fetchCars,
  saveCar: async (c) => { check(await sb().from('cars').upsert({ id: c.id, slug: c.slug, data: c })); },
  deleteCar: async (id) => { check(await sb().from('cars').delete().eq('id', id)); },
  listMakes: fetchMakes,
  saveMake: async (m) => { check(await sb().from('makes').upsert({ id: m.id, name: m.name, logo: m.logo })); },
  deleteMake: async (id) => { check(await sb().from('makes').delete().eq('id', id)); },
  getSettings: fetchSettings,
  saveSettings: async (s) => { check(await sb().from('settings').upsert({ id: 'dealership', data: s })); },
  listInquiries: async () => {
    const r = check(await sb().from('inquiries').select('*').order('created_at', { ascending: false }).limit(500));
    return (r.data ?? []).map((q: Record<string, unknown>) => ({
      id: String(q.id), name: String(q.name ?? ''), phone: String(q.phone ?? ''), message: String(q.message ?? ''),
      type: q.type === 'whatsapp' ? 'whatsapp' : 'contact', carSlug: (q.car_slug as string) ?? null, handled: !!q.handled, createdAt: String(q.created_at ?? ''),
    }));
  },
  setHandled: async (id, handled) => { check(await sb().from('inquiries').update({ handled }).eq('id', id)); },
  deleteInquiry: async (id) => { check(await sb().from('inquiries').delete().eq('id', id)); },
  uploadImage: async (file, folder) => {
    validateImage(file);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = folder + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
    check(await sb().storage.from(STORAGE_BUCKET).upload(path, file, { contentType: file.type, upsert: false }));
    return sb().storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
  },
};
