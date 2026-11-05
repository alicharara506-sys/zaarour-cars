import { useState } from 'react';
import { useSearch } from 'wouter';
import { CheckCircle2, MapPin, Phone, Clock, AlertTriangle, Send } from 'lucide-react';
import { SiWhatsapp } from 'react-icons/si';
import { Eyebrow, Reveal } from '@/components/site/motion';
import { FaqList } from '@/components/site/faq';
import { usePublicCars, useSettings } from '@/hooks/use-dealer';
import { submitInquiry, logWhatsAppClick } from '@/lib/data';
import { isSupabaseConfigured } from '@/lib/supabase';
import { carTitle, usd, waLink } from '@/lib/format';
import { APPROX_GEO, isPlaceholderNumber } from '@/lib/settings';
import { useSeo, breadcrumbLd, faqLd } from '@/lib/seo';
import { faqs } from '@/data/faqs';

export default function Contact() {
  const s = useSettings();
  const { cars } = usePublicCars();
  const preset = new URLSearchParams(useSearch()).get('car') ?? '';
  const [form, setForm] = useState({ name: '', phone: '', message: '', car: preset });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<'idle' | 'sending' | 'live' | 'demo' | 'error'>('idle');
  useSeo({
    title: 'Contact ZAAROUR | Car Dealership in Moawad, Lebanon | WhatsApp',
    description: 'Contact ZAAROUR in Moawad, Lebanon by WhatsApp, phone or the contact form. Serving car buyers across Beirut and Mount Lebanon.',
    path: '/contact', ld: [breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Contact', path: '/contact' }]), faqLd(faqs)],
  });
  const car = cars.find((c) => c.slug === form.car);
  const waText = 'Hello ZAAROUR, my name is ' + (form.name || '...') + '. ' + (car ? 'About the ' + carTitle(car) + ' (' + usd(car.price) + '): ' : '') + form.message;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (form.name.trim().length < 2) er.name = 'Please enter your name.';
    if (!/^[+\d][\d\s-]{5,}$/.test(form.phone.trim())) er.phone = 'Enter a phone number, e.g. +961 3 123 456.';
    if (form.message.trim().length < 5) er.message = 'Tell us a little more.';
    setErrors(er); if (Object.keys(er).length) return;
    setState('sending');
    try { setState(await submitInquiry({ name: form.name.trim(), phone: form.phone.trim(), message: form.message.trim(), type: 'contact', carSlug: form.car || null })); }
    catch { setState('error'); }
  };
  const bbox = [APPROX_GEO.lng - 0.02, APPROX_GEO.lat - 0.012, APPROX_GEO.lng + 0.02, APPROX_GEO.lat + 0.012].join(',');
  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-28 md:px-10 md:pt-36">
      <Reveal><Eyebrow>Contact · Zaarour, Moawad, Lebanon</Eyebrow>
        <h1 className="mt-5 font-display text-6xl leading-[0.9] md:text-8xl">Let&rsquo;s talk <span className="italic metal-gold">cars</span>.</h1></Reveal>
      <div className="mt-14 grid gap-14 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal>
          {!isSupabaseConfigured && (
            <div className="mb-6 flex gap-3 border border-[hsl(var(--gold)/.4)] bg-[hsl(var(--gold)/.06)] p-4 text-sm" data-testid="notice-demo-contact">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <p><strong className="font-semibold text-gold">Demo mode:</strong> messages from this form are saved on this browser only and are <strong>not sent</strong> to ZAAROUR. To actually reach the showroom, use WhatsApp.</p>
            </div>
          )}
          {state === 'live' || state === 'demo' ? (
            <div className="border border-border bg-card p-10" data-testid="status-contact-result">
              <CheckCircle2 className="h-10 w-10 text-gold" />
              <h2 className="mt-5 font-display text-4xl">{state === 'live' ? 'Message received.' : 'Saved on this browser — not sent.'}</h2>
              <p className="mt-3 text-muted-foreground">{state === 'live' ? 'The ZAAROUR team will reply to the number you gave. For a faster answer, continue on WhatsApp.' : 'This demo site has no live database, so nobody at ZAAROUR received this. Send the same message on WhatsApp instead:'}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={waLink(s.whatsapp, waText)} target="_blank" rel="noopener noreferrer" onClick={() => logWhatsAppClick(form.car || null)} className="btn-gold" data-testid="link-contact-handoff"><SiWhatsapp className="h-4 w-4" /> Continue on WhatsApp</a>
                <button onClick={() => { setForm({ name: '', phone: '', message: '', car: '' }); setState('idle'); }} className="btn-ghost" data-testid="button-contact-new">New message</button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label><span className="label">Name</span><input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" data-testid="input-name" aria-invalid={!!errors.name} />{errors.name && <span className="mt-1 block text-xs text-destructive">{errors.name}</span>}</label>
                <label><span className="label">Phone</span><input className="field font-mono" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" placeholder="+961" data-testid="input-phone" aria-invalid={!!errors.phone} />{errors.phone && <span className="mt-1 block text-xs text-destructive">{errors.phone}</span>}</label>
              </div>
              <label className="block"><span className="label">About a car (optional)</span>
                <select className="field" value={form.car} onChange={(e) => setForm({ ...form, car: e.target.value })} data-testid="select-car">
                  <option value="">General enquiry</option>{cars.map((c) => <option key={c.slug} value={c.slug}>{carTitle(c)} {c.trim} — {usd(c.price)}</option>)}
                </select></label>
              <label className="block"><span className="label">Message</span><textarea rows={6} className="field resize-none" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} data-testid="input-message" aria-invalid={!!errors.message} />{errors.message && <span className="mt-1 block text-xs text-destructive">{errors.message}</span>}</label>
              {state === 'error' && <p className="text-sm text-destructive">Something went wrong. Please try again or use WhatsApp.</p>}
              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={state === 'sending'} className="btn-gold disabled:opacity-60" data-testid="button-submit-contact"><Send className="h-4 w-4" /> {state === 'sending' ? 'Sending...' : isSupabaseConfigured ? 'Send message' : 'Save message (demo)'}</button>
                <a href={waLink(s.whatsapp, waText)} target="_blank" rel="noopener noreferrer" onClick={() => logWhatsAppClick(form.car || null)} className="btn-ghost" data-testid="link-contact-whatsapp"><SiWhatsapp className="h-4 w-4 text-gold" /> Send via WhatsApp</a>
              </div>
            </form>
          )}
        </Reveal>
        <Reveal delay={0.1} className="space-y-6">
          <ul className="divide-y divide-border border-y border-border">
            <li className="flex gap-4 py-5"><MapPin className="h-5 w-5 text-gold" /><div><p className="label">Address</p><p>{s.address}</p><p className="text-sm text-muted-foreground">Zaarour — Moawad, Lebanon</p></div></li>
            <li className="flex gap-4 py-5"><Phone className="h-5 w-5 text-gold" /><div><p className="label">Phone</p><a href={'tel:' + s.phone.replace(/\s/g, '')} className="font-mono hover:text-gold">{s.phone}</a>{isPlaceholderNumber(s.phone) && <p className="text-xs text-muted-foreground">Placeholder number — update in admin settings.</p>}</div></li>
            <li className="flex gap-4 py-5"><SiWhatsapp className="h-5 w-5 text-gold" /><div><p className="label">WhatsApp</p><a href={waLink(s.whatsapp)} target="_blank" rel="noopener noreferrer" onClick={() => logWhatsAppClick(null)} className="font-mono hover:text-gold">{s.whatsapp}</a></div></li>
            <li className="flex gap-4 py-5"><Clock className="h-5 w-5 text-gold" /><div><p className="label">Hours</p><p>{s.hours}</p></div></li>
          </ul>
          <div className="overflow-hidden border border-border">
            <iframe title="Map of the Moawad area, Lebanon (approximate)" src={'https://www.openstreetmap.org/export/embed.html?bbox=' + bbox + '&layer=mapnik&marker=' + APPROX_GEO.lat + ',' + APPROX_GEO.lng}
              loading="lazy" className="h-80 w-full grayscale invert-[.92] hue-rotate-180 contrast-[.9]" />
          </div>
          <p className="text-xs text-muted-foreground">Map pin is approximate and shows the Moawad area only, not an exact street address. Ask on WhatsApp for precise directions. Map data © OpenStreetMap contributors.</p>
        </Reveal>
      </div>
      <section className="mt-24 grid gap-12 lg:grid-cols-[0.8fr_1.2fr]" aria-labelledby="contact-faq">
        <Reveal><Eyebrow>FAQ</Eyebrow><h2 id="contact-faq" className="mt-4 font-display text-5xl">Before you message</h2></Reveal>
        <FaqList />
      </section>
    </div>
  );
}
