/** Dealership contact settings (singleton row id 'dealership'). */
export interface Socials { facebook: string; instagram: string; tiktok: string; x: string }
export interface Settings { whatsapp: string; phone: string; address: string; hours: string; socials: Socials }

/** Placeholder — replace with the real number via admin Settings or VITE_WHATSAPP_NUMBER. */
export const PLACEHOLDER_WHATSAPP = '+961 00 000 000';
const envWa = (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined)?.trim();

export const defaultSettings: Settings = {
  whatsapp: envWa || PLACEHOLDER_WHATSAPP,
  phone: envWa || PLACEHOLDER_WHATSAPP,
  address: 'Moawad, Lebanon',
  hours: 'Mon–Sat 9:00–19:00 (demo hours — confirm in admin settings)',
  // Placeholder social links — swap real URLs in admin Settings.
  socials: { facebook: '#', instagram: '#', tiktok: '#', x: '#' },
};

export function mergeSettings(raw: unknown): Settings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<Settings>;
  return { ...defaultSettings, ...r, socials: { ...defaultSettings.socials, ...(r.socials ?? {}) } };
}

export const isPlaceholderNumber = (n: string) => n.replace(/\D/g, '') === '96100000000';

/**
 * Approximate area pin for Moawad, Lebanon. NOT an exact street address —
 * replace with verified showroom coordinates once confirmed.
 */
export const APPROX_GEO = { lat: 33.8547, lng: 35.5105 };
