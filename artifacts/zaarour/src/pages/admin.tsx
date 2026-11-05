import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import {
  AlertTriangle, ArrowDown, ArrowUp, Car as CarIcon, Check, Inbox, LayoutDashboard, LogOut, Pencil, Plus, RotateCcw, Settings as SettingsIcon,
  Star, Tag, Trash2, Upload, X, ImagePlus, FlaskConical, Lock,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/site/logo';
import { CarImage } from '@/components/site/car-image';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { demoBackend, liveBackend, type AdminBackend } from '@/lib/data';
import { resetDemo, uid } from '@/lib/demo-db';
import { BODY_TYPES, DRIVETRAINS, FUEL_TYPES, TRANSMISSIONS, type Car, type Make } from '@/data/cars';
import { km, slugify, usd, carTitle } from '@/lib/format';
import type { Settings } from '@/lib/settings';
import { useSeo } from '@/lib/seo';

/* ============================== Gate ============================== */

export default function AdminPage() {
  const queryClient = useQueryClient();
  useSeo({ title: 'Admin | ZAAROUR', description: 'ZAAROUR dealership admin.', path: '/admin' });
  useEffect(() => {
    const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex,nofollow'; document.head.appendChild(m);
    return () => m.remove();
  }, []);
  const [demo, setDemo] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      setIsAdmin(null);
      setSession(s);
      queryClient.removeQueries({ predicate: query => query.queryKey[0] === 'admin' });
      void queryClient.invalidateQueries({ queryKey: ['cars'] });
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);
  useEffect(() => {
    if (!supabase || !session) { setIsAdmin(null); return; }
    let active = true;
    setIsAdmin(null);
    supabase.from('admin_users').select('user_id').eq('user_id', session.user.id).maybeSingle()
      .then(({ data, error }) => { if (active) setIsAdmin(!error && !!data); });
    return () => { active = false; };
  }, [session]);

  if (demo) return <Workspace backend={demoBackend} onExit={() => setDemo(false)} />;
  if (session && isAdmin) return <Workspace backend={liveBackend} onExit={() => supabase?.auth.signOut()} email={session.user.email} />;

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-5 py-28">
      <div className="w-full max-w-4xl">
        <div className="mb-10 text-center"><Link href="/"><Logo /></Link><p className="mt-4 font-wide text-[0.55rem] text-muted-foreground">Dealership admin</p></div>
        <div className="grid gap-px border border-border bg-border md:grid-cols-2">
          <section className="bg-card p-8 md:p-10" aria-labelledby="live-login">
            <div className="flex items-center gap-2 font-wide text-[0.55rem] text-gold"><Lock className="h-3.5 w-3.5" /> Live admin</div>
            <h1 id="live-login" className="mt-4 font-display text-4xl">Sign in</h1>
            {isSupabaseConfigured ? (
              session && isAdmin === false ? (
                <div className="mt-6 space-y-4 text-sm">
                  <p className="text-destructive">Signed in as {session.user.email}, but this account is not in admin_users.</p>
                  <button className="btn-ghost" onClick={() => supabase?.auth.signOut()} data-testid="button-signout">Sign out</button>
                </div>
              ) : session && isAdmin === null ? <p className="mt-6 text-sm text-muted-foreground">Checking admin access...</p> : <LoginForm />
            ) : (
              <div className="mt-6 space-y-3 text-sm text-muted-foreground" data-testid="notice-live-unavailable">
                <p className="flex gap-2 text-foreground"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> Live login is unavailable: Supabase is not configured.</p>
                <p>Set <code className="font-mono text-gold">VITE_SUPABASE_URL</code> and <code className="font-mono text-gold">VITE_SUPABASE_ANON_KEY</code>, run the schema, and add your user to <code className="font-mono">admin_users</code>. Then email + password login appears here.</p>
              </div>
            )}
          </section>
          <section className="bg-card p-8 md:p-10" aria-labelledby="demo-ws">
            <div className="flex items-center gap-2 font-wide text-[0.55rem] text-silver"><FlaskConical className="h-3.5 w-3.5" /> Local demo workspace</div>
            <h2 id="demo-ws" className="mt-4 font-display text-4xl">Explore the tools</h2>
            <p className="mt-4 text-sm text-muted-foreground">Not a login. Try car, brand, inquiry and settings management with data stored <strong className="text-foreground">only in this browser</strong>. Nothing is published to a server; changes show on this browser's public pages{isSupabaseConfigured ? ' only when Supabase is not configured' : ''}.</p>
            <button onClick={() => setDemo(true)} className="btn-ghost mt-8" data-testid="button-open-demo">Open demo workspace</button>
          </section>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!supabase) return;
    setBusy(true); setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false); if (error) setErr(error.message);
  };
  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block"><span className="label">Email</span><input type="email" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" data-testid="input-admin-email" /></label>
      <label className="block"><span className="label">Password</span><input type="password" required className="field" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" data-testid="input-admin-password" /></label>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <button disabled={busy} className="btn-gold w-full justify-center disabled:opacity-60" data-testid="button-admin-login">{busy ? 'Signing in...' : 'Sign in'}</button>
    </form>
  );
}

/* ============================== Workspace ============================== */

type Tab = 'dashboard' | 'cars' | 'makes' | 'inquiries' | 'settings';
const TABS: { id: Tab; label: string; Icon: typeof CarIcon }[] = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard }, { id: 'cars', label: 'Cars', Icon: CarIcon },
  { id: 'makes', label: 'Makes', Icon: Tag }, { id: 'inquiries', label: 'Inquiries', Icon: Inbox }, { id: 'settings', label: 'Settings', Icon: SettingsIcon },
];

function useAdminData(b: AdminBackend) {
  const cars = useQuery({ queryKey: ['admin', b.mode, 'cars'], queryFn: b.listCars });
  const makes = useQuery({ queryKey: ['admin', b.mode, 'makes'], queryFn: b.listMakes });
  const inquiries = useQuery({ queryKey: ['admin', b.mode, 'inquiries'], queryFn: b.listInquiries });
  const settings = useQuery({ queryKey: ['admin', b.mode, 'settings'], queryFn: b.getSettings });
  return { cars, makes, inquiries, settings };
}

/** Wraps a backend call, toasts result and refreshes all caches (admin + public). */
function useAction() {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ fn }: { fn: () => Promise<unknown>; ok?: string }) => fn(),
    onSuccess: (_d, v) => { qc.invalidateQueries(); if (v.ok) toast({ title: v.ok }); },
    onError: (e: Error) => toast({ title: 'Action failed', description: e.message, variant: 'destructive' }),
  });
}

function Workspace({ backend, onExit, email }: { backend: AdminBackend; onExit: () => void; email?: string }) {
  const [tab, setTab] = useState<Tab>('dashboard');
  const data = useAdminData(backend);
  const qc = useQueryClient();
  const isDemo = backend.mode === 'demo';
  const newCount = (data.inquiries.data ?? []).filter((q) => !q.handled).length;
  return (
    <div className="min-h-[100dvh] pt-16 md:pt-20">
      {isDemo && (
        <div className="sticky top-16 z-30 flex flex-wrap items-center justify-between gap-2 border-y border-[hsl(var(--gold)/.4)] bg-[hsl(41_40%_12%)] px-5 py-2.5 text-xs md:top-20 md:px-10" data-testid="banner-demo">
          <span className="flex items-center gap-2"><FlaskConical className="h-4 w-4 text-gold" /><strong className="font-wide text-[0.55rem] text-gold">Local demo workspace</strong> Changes are saved in this browser only. Not a real admin session.</span>
          <button onClick={() => { if (confirm('Reset all demo data on this browser?')) { resetDemo(); qc.invalidateQueries(); } }} className="flex items-center gap-1.5 text-gold hover:underline" data-testid="button-reset-demo"><RotateCcw className="h-3.5 w-3.5" /> Reset demo data</button>
        </div>
      )}
      <div className="mx-auto grid max-w-[1400px] gap-8 px-5 py-8 md:px-10 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-36 lg:self-start">
          <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Admin sections">
            {TABS.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setTab(id)} aria-current={tab === id} data-testid={'tab-' + id}
                className={'flex shrink-0 items-center gap-3 border-l-2 px-4 py-3 text-left text-sm transition ' + (tab === id ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/.08)] text-gold' : 'border-transparent text-muted-foreground hover:text-foreground')}>
                <Icon className="h-4 w-4" />{label}{id === 'inquiries' && newCount > 0 && <span className="ml-auto bg-[hsl(var(--gold))] px-1.5 font-mono text-[0.65rem] text-primary-foreground">{newCount}</span>}
              </button>
            ))}
          </nav>
          <div className="mt-6 hidden border-t border-border pt-6 text-xs text-muted-foreground lg:block">
            {email && <p className="mb-3 truncate">{email}</p>}
            <button onClick={onExit} className="flex items-center gap-2 hover:text-gold" data-testid="button-exit-admin"><LogOut className="h-4 w-4" />{isDemo ? 'Leave demo' : 'Sign out'}</button>
          </div>
        </aside>
        <main>
          {tab === 'dashboard' && <Dashboard data={data} go={setTab} />}
          {tab === 'cars' && <CarsAdmin backend={backend} cars={data.cars.data ?? []} makes={data.makes.data ?? []} loading={data.cars.isLoading} />}
          {tab === 'makes' && <MakesAdmin backend={backend} makes={data.makes.data ?? []} />}
          {tab === 'inquiries' && <InquiriesAdmin backend={backend} list={data.inquiries.data ?? []} loading={data.inquiries.isLoading} />}
          {tab === 'settings' && data.settings.data && <SettingsAdmin backend={backend} initial={data.settings.data} />}
          <button onClick={onExit} className="mt-10 flex items-center gap-2 text-xs text-muted-foreground lg:hidden"><LogOut className="h-4 w-4" />{isDemo ? 'Leave demo' : 'Sign out'}</button>
        </main>
      </div>
    </div>
  );
}

const H = ({ children, sub }: { children: React.ReactNode; sub?: string }) => (
  <div className="mb-8"><h1 className="font-display text-5xl">{children}</h1>{sub && <p className="mt-2 text-sm text-muted-foreground">{sub}</p>}</div>
);

function Dashboard({ data, go }: { data: ReturnType<typeof useAdminData>; go: (t: Tab) => void }) {
  const cars = data.cars.data ?? []; const inq = data.inquiries.data ?? [];
  const stats = [
    ['Total cars', cars.length], ['In stock', cars.filter((c) => !c.sold).length], ['Featured', cars.filter((c) => c.featured).length], ['Open inquiries', inq.filter((q) => !q.handled).length],
  ] as const;
  return (
    <div>
      <H>Dashboard</H>
      <div className="grid grid-cols-2 gap-px border border-border bg-border lg:grid-cols-4">
        {stats.map(([l, v]) => <div key={l} className="bg-card p-6"><p className="font-mono text-4xl metal-gold" data-testid={'stat-' + slugify(l)}>{data.cars.isLoading ? '—' : v}</p><p className="mt-2 font-wide text-[0.5rem] text-muted-foreground">{l}</p></div>)}
      </div>
      <div className="mt-10 flex items-center justify-between"><h2 className="font-display text-3xl">Recent inquiries</h2><button onClick={() => go('inquiries')} className="text-sm text-gold hover:underline">View all</button></div>
      <ul className="mt-4 divide-y divide-border border-y border-border">
        {inq.slice(0, 6).map((q) => (
          <li key={q.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
            <span className={'font-wide text-[0.5rem] ' + (q.type === 'whatsapp' ? 'text-silver' : 'text-gold')}>{q.type}</span>
            <span className="font-medium">{q.name}</span><span className="flex-1 truncate text-muted-foreground">{q.message}</span>
            <span className="font-mono text-xs text-muted-foreground">{q.createdAt ? new Date(q.createdAt).toLocaleString() : ''}</span>
          </li>
        ))}
        {!inq.length && <li className="py-8 text-center text-sm text-muted-foreground">No inquiries yet. Contact form submissions and WhatsApp clicks appear here.</li>}
      </ul>
    </div>
  );
}

/* ------------------------------ Cars ------------------------------ */

const emptyCar = (): Car => ({
  id: uid(), slug: '', make: '', model: '', year: new Date().getFullYear(), trim: '', price: 0, mileage: 0, fuelType: 'Petrol', transmission: 'Automatic',
  engine: '', horsepower: 0, drivetrain: 'AWD', bodyType: 'SUV', condition: 'used', exteriorColor: '', interiorColor: '', features: [], description: '', vin: '',
  images: [], featured: false, sold: false, hideSold: false, newArrival: true,
});

function CarsAdmin({ backend, cars, makes, loading }: { backend: AdminBackend; cars: Car[]; makes: Make[]; loading: boolean }) {
  const [edit, setEdit] = useState<Car | null>(null);
  const [del, setDel] = useState<Car | null>(null);
  const [q, setQ] = useState('');
  const act = useAction();
  const list = cars.filter((c) => (carTitle(c) + ' ' + c.trim).toLowerCase().includes(q.toLowerCase()));
  const toggle = (c: Car, k: 'featured' | 'sold' | 'newArrival' | 'hideSold') => act.mutate({ fn: () => backend.saveCar({ ...c, [k]: !c[k] }) });
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4"><H sub={cars.length + ' cars'}>Cars</H>
        <button onClick={() => setEdit(emptyCar())} className="btn-gold mb-8" data-testid="button-add-car"><Plus className="h-4 w-4" /> Add car</button></div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter cars..." className="field mb-4" data-testid="input-admin-car-search" />
      <div className="space-y-2">
        {loading && <div className="h-20 animate-pulse bg-muted" />}
        {list.map((c) => (
          <div key={c.id} className="grid items-center gap-4 border border-border bg-card p-3 md:grid-cols-[96px_1fr_auto]" data-testid={'row-car-' + c.id}>
            <CarImage src={c.images[0]} alt={carTitle(c)} className="h-16 w-24 rounded-[2px]" />
            <div className="min-w-0">
              <p className="truncate font-medium">{carTitle(c)} <span className="text-muted-foreground">{c.trim}</span></p>
              <p className="font-mono text-xs text-muted-foreground">{usd(c.price)} · {km(c.mileage)} · /cars/{c.slug}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {([['featured', 'Featured'], ['newArrival', 'New arrival'], ['sold', 'Sold'], ['hideSold', 'Hide if sold']] as const).map(([k, l]) => (
                  <button key={k} onClick={() => toggle(c, k)} aria-pressed={c[k]} data-testid={'toggle-' + k + '-' + c.id}
                    className={'border px-2 py-1 font-wide text-[0.45rem] transition ' + (c[k] ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/.12)] text-gold' : 'border-border text-muted-foreground hover:text-foreground')}>{l}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEdit(c)} aria-label="Edit car" className="flex h-10 w-10 items-center justify-center border border-border hover:border-[hsl(var(--gold))]" data-testid={'button-edit-' + c.id}><Pencil className="h-4 w-4" /></button>
              <button onClick={() => setDel(c)} aria-label="Delete car" className="flex h-10 w-10 items-center justify-center border border-border hover:border-destructive hover:text-destructive" data-testid={'button-delete-' + c.id}><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {!loading && !list.length && <p className="border border-dashed border-border py-12 text-center text-muted-foreground">No cars. Add the first one.</p>}
      </div>
      {edit && <CarEditor key={edit.id} backend={backend} initial={edit} makes={makes} existing={cars} onClose={() => setEdit(null)} />}
      <Confirm open={!!del} title={'Delete ' + (del ? carTitle(del) : '') + '?'} onCancel={() => setDel(null)}
        onConfirm={() => { if (del) act.mutate({ fn: () => backend.deleteCar(del.id), ok: 'Car deleted' }); setDel(null); }} />
    </div>
  );
}

function Confirm({ open, title, onCancel, onConfirm }: { open: boolean; title: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent className="border-border bg-card">
        <AlertDialogHeader><AlertDialogTitle className="font-display text-3xl font-normal">{title}</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel><AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground" data-testid="button-confirm-delete">Delete</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function CarEditor({ backend, initial, makes, existing, onClose }: { backend: AdminBackend; initial: Car; makes: Make[]; existing: Car[]; onClose: () => void }) {
  const [c, setC] = useState<Car>(initial);
  const [featuresText, setFeaturesText] = useState(initial.features.join('\n'));
  const [urlIn, setUrlIn] = useState('');
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const act = useAction(); const { toast } = useToast();
  const isNew = !existing.some((x) => x.id === initial.id);
  const set = <K extends keyof Car>(k: K, v: Car[K]) => setC((p) => ({ ...p, [k]: v }));
  const autoSlug = useMemo(() => slugify([c.make.split('-')[0], c.model, c.year].join(' ')), [c.make, c.model, c.year]);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const urls: string[] = [];
    for (const f of Array.from(files)) {
      try { urls.push(await backend.uploadImage(f, 'cars/' + (c.slug || autoSlug || c.id))); }
      catch (e) { toast({ title: 'Upload failed', description: (e as Error).message, variant: 'destructive' }); }
    }
    setC((p) => ({ ...p, images: [...p.images, ...urls] })); setUploading(false);
  };
  const move = (i: number, d: number) => setC((p) => { const a = [...p.images]; const j = i + d; if (j < 0 || j >= a.length) return p; [a[i], a[j]] = [a[j], a[i]]; return { ...p, images: a }; });
  const makeMain = (i: number) => setC((p) => { const a = [...p.images]; const [x] = a.splice(i, 1); return { ...p, images: [x, ...a] }; });

  const save = () => {
    const slug = slugify(c.slug || autoSlug);
    if (!c.make || !c.model || !slug) { setErr('Make, model and slug are required.'); return; }
    if (existing.some((x) => x.slug === slug && x.id !== c.id)) { setErr('Slug "' + slug + '" is already used.'); return; }
    if (c.price <= 0) { setErr('Price must be greater than 0.'); return; }
    const car: Car = { ...c, slug, features: featuresText.split('\n').map((s) => s.trim()).filter(Boolean) };
    act.mutate({ fn: () => backend.saveCar(car), ok: isNew ? 'Car added' : 'Car saved' }, { onSuccess: onClose });
  };

  const txt = (k: keyof Car, label: string, ph = '') => (
    <label><span className="label">{label}</span><input className="field" value={String(c[k] ?? '')} placeholder={ph} onChange={(e) => set(k, e.target.value as never)} data-testid={'input-car-' + k} /></label>
  );
  const num = (k: 'year' | 'price' | 'mileage' | 'horsepower', label: string) => (
    <label><span className="label">{label}</span><input type="number" min={0} className="field font-mono" value={c[k]} onChange={(e) => set(k, Number(e.target.value))} data-testid={'input-car-' + k} /></label>
  );
  const sel = (k: keyof Car, label: string, opts: string[]) => (
    <label><span className="label">{label}</span><select className="field" value={String(c[k])} onChange={(e) => set(k, e.target.value as never)} data-testid={'select-car-' + k}>
      {!opts.includes(String(c[k])) && <option value={String(c[k])}>{String(c[k]) || 'Select...'}</option>}{opts.map((o) => <option key={o}>{o}</option>)}</select></label>
  );
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] max-w-4xl overflow-y-auto border-border bg-card">
        <DialogTitle className="font-display text-4xl font-normal">{isNew ? 'Add car' : 'Edit car'}</DialogTitle>
        {backend.mode === 'demo' && <p className="font-wide text-[0.5rem] text-gold">Demo workspace — saved on this browser only</p>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sel('make', 'Make', makes.map((m) => m.name))}
          {txt('model', 'Model')}{txt('trim', 'Trim')}
          {num('year', 'Year')}{num('price', 'Price (USD)')}{num('mileage', 'Mileage (km)')}
          {sel('fuelType', 'Fuel type', FUEL_TYPES)}{sel('transmission', 'Transmission', TRANSMISSIONS)}{sel('drivetrain', 'Drivetrain', DRIVETRAINS)}
          {txt('engine', 'Engine', '3.0L turbo inline-6')}{num('horsepower', 'Horsepower')}{sel('bodyType', 'Body type', BODY_TYPES)}
          <label><span className="label">Condition</span><select className="field" value={c.condition} onChange={(e) => set('condition', e.target.value as Car['condition'])} data-testid="select-car-condition"><option value="new">New</option><option value="used">Used</option></select></label>
          {txt('exteriorColor', 'Exterior colour')}{txt('interiorColor', 'Interior colour')}
          {txt('vin', 'VIN (optional)')}
          <label className="sm:col-span-2"><span className="label">URL slug</span><input className="field font-mono" value={c.slug} placeholder={autoSlug} onChange={(e) => set('slug', e.target.value)} data-testid="input-car-slug" /></label>
        </div>
        <label><span className="label">Features (one per line)</span><textarea rows={5} className="field" value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} data-testid="input-car-features" /></label>
        <label><span className="label">Description (state price, mileage, year in plain text)</span><textarea rows={4} className="field" value={c.description} onChange={(e) => set('description', e.target.value)} data-testid="input-car-description" /></label>
        <div className="flex flex-wrap gap-4">
          {([['featured', 'Featured on homepage'], ['newArrival', 'New arrival'], ['sold', 'Sold'], ['hideSold', 'Hide when sold (else show Sold badge)']] as const).map(([k, l]) => (
            <label key={k} className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={c[k]} onChange={(e) => set(k, e.target.checked)} className="h-4 w-4 accent-[hsl(41_52%_62%)]" data-testid={'checkbox-car-' + k} />{l}</label>
          ))}
        </div>
        <div>
          <span className="label">Images — first image is the main photo</span>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {c.images.map((src, i) => (
              <div key={src + i} className={'group relative overflow-hidden border ' + (i === 0 ? 'border-[hsl(var(--gold))]' : 'border-border')}>
                <CarImage src={src} alt={'Image ' + (i + 1)} className="aspect-[4/3] w-full" />
                {i === 0 && <span className="absolute left-1 top-1 bg-[hsl(var(--gold))] px-1.5 py-0.5 font-wide text-[0.42rem] text-primary-foreground">Main</span>}
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-background/85 p-1">
                  <button type="button" onClick={() => move(i, -1)} aria-label="Move left" className="p-1 hover:text-gold"><ArrowUp className="h-3.5 w-3.5 -rotate-90" /></button>
                  <button type="button" onClick={() => move(i, 1)} aria-label="Move right" className="p-1 hover:text-gold"><ArrowDown className="h-3.5 w-3.5 -rotate-90" /></button>
                  <button type="button" onClick={() => makeMain(i)} aria-label="Set as main" className="p-1 hover:text-gold" data-testid={'button-main-image-' + i}><Star className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => set('images', c.images.filter((_, k) => k !== i))} aria-label="Remove image" className="p-1 hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
            <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-border text-xs text-muted-foreground transition hover:border-[hsl(var(--gold))] hover:text-gold">
              <Upload className="h-5 w-5" />{uploading ? 'Uploading...' : 'Upload JPG/PNG/WebP ≤5MB'}
              <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { upload(e.target.files); e.target.value = ''; }} data-testid="input-car-images" />
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <input className="field" placeholder="...or paste an image URL" value={urlIn} onChange={(e) => setUrlIn(e.target.value)} data-testid="input-car-image-url" />
            <button type="button" onClick={() => { if (urlIn.trim()) { set('images', [...c.images, urlIn.trim()]); setUrlIn(''); } }} className="btn-ghost shrink-0" data-testid="button-add-image-url"><ImagePlus className="h-4 w-4" /> Add</button>
          </div>
        </div>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <button onClick={onClose} className="btn-ghost" data-testid="button-cancel-car">Cancel</button>
          <button onClick={save} disabled={act.isPending || uploading} className="btn-gold disabled:opacity-60" data-testid="button-save-car"><Check className="h-4 w-4" />{act.isPending ? 'Saving...' : 'Save car'}</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------ Makes ------------------------------ */

function MakesAdmin({ backend, makes }: { backend: AdminBackend; makes: Make[] }) {
  const [edit, setEdit] = useState<Make | null>(null);
  const [del, setDel] = useState<Make | null>(null);
  const [busy, setBusy] = useState(false);
  const act = useAction(); const { toast } = useToast();
  const isNew = edit ? !makes.some((m) => m.id === edit.id) : false;
  const upload = async (f?: File) => {
    if (!f || !edit) return; setBusy(true);
    try { const url = await backend.uploadImage(f, 'makes'); setEdit({ ...edit, logo: url }); }
    catch (e) { toast({ title: 'Upload failed', description: (e as Error).message, variant: 'destructive' }); }
    setBusy(false);
  };
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4"><H sub="Used in filters and the brands strip">Makes</H>
        <button onClick={() => setEdit({ id: '', name: '', logo: '' })} className="btn-gold mb-8" data-testid="button-add-make"><Plus className="h-4 w-4" /> Add make</button></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {makes.map((m) => (
          <div key={m.id} className="flex items-center gap-4 border border-border bg-card p-4" data-testid={'row-make-' + m.id}>
            <div className="flex h-12 w-12 items-center justify-center bg-muted">{m.logo ? <img src={m.logo} alt={m.name + ' logo'} className="max-h-10 max-w-10 object-contain" /> : <span className="font-wide text-xs text-gold">{m.name.slice(0, 2)}</span>}</div>
            <span className="flex-1 font-medium">{m.name}</span>
            <button onClick={() => setEdit(m)} aria-label={'Edit ' + m.name} className="p-2 hover:text-gold"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => setDel(m)} aria-label={'Delete ' + m.name} className="p-2 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
      {edit && (
        <Dialog open onOpenChange={(o) => !o && setEdit(null)}>
          <DialogContent className="border-border bg-card">
            <DialogTitle className="font-display text-3xl font-normal">{isNew ? 'Add make' : 'Edit make'}</DialogTitle>
            <label><span className="label">Name</span><input className="field" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} data-testid="input-make-name" /></label>
            <label><span className="label">Logo URL</span><input className="field" value={edit.logo} onChange={(e) => setEdit({ ...edit, logo: e.target.value })} data-testid="input-make-logo" /></label>
            <label className="btn-ghost cursor-pointer justify-center"><Upload className="h-4 w-4" />{busy ? 'Uploading...' : 'Upload logo'}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} data-testid="input-make-upload" /></label>
            {edit.logo && <img src={edit.logo} alt="Logo preview" className="h-16 object-contain" />}
            <button className="btn-gold justify-center" disabled={!edit.name.trim() || busy} data-testid="button-save-make"
              onClick={() => { const m = { ...edit, name: edit.name.trim(), id: edit.id || slugify(edit.name) }; act.mutate({ fn: () => backend.saveMake(m), ok: 'Make saved' }, { onSuccess: () => setEdit(null) }); }}>Save make</button>
          </DialogContent>
        </Dialog>
      )}
      <Confirm open={!!del} title={'Delete ' + (del?.name ?? '') + '?'} onCancel={() => setDel(null)} onConfirm={() => { if (del) act.mutate({ fn: () => backend.deleteMake(del.id), ok: 'Make deleted' }); setDel(null); }} />
    </div>
  );
}

/* ------------------------------ Inquiries ------------------------------ */

function InquiriesAdmin({ backend, list, loading }: { backend: AdminBackend; list: Awaited<ReturnType<AdminBackend['listInquiries']>>; loading: boolean }) {
  const [filter, setFilter] = useState<'all' | 'contact' | 'whatsapp' | 'open'>('all');
  const act = useAction();
  const rows = list.filter((q) => filter === 'all' || (filter === 'open' ? !q.handled : q.type === filter));
  return (
    <div>
      <H sub="Contact form submissions and WhatsApp click logs">Inquiries</H>
      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', 'open', 'contact', 'whatsapp'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} data-testid={'filter-inquiries-' + f} className={'border px-3 py-1.5 font-wide text-[0.5rem] ' + (filter === f ? 'border-[hsl(var(--gold))] text-gold' : 'border-border text-muted-foreground')}>{f}</button>
        ))}
      </div>
      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-muted font-wide text-[0.5rem] text-muted-foreground"><tr>{['Date', 'Type', 'Name', 'Phone', 'Message', 'Car', 'Handled', ''].map((h) => <th key={h} className="px-3 py-3 font-normal">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-border">
            {loading && <tr><td colSpan={8} className="p-6"><div className="h-6 animate-pulse bg-muted" /></td></tr>}
            {rows.map((q) => (
              <tr key={q.id} className={q.handled ? 'opacity-55' : ''} data-testid={'row-inquiry-' + q.id}>
                <td className="whitespace-nowrap px-3 py-3 font-mono text-xs">{q.createdAt ? new Date(q.createdAt).toLocaleString() : ''}</td>
                <td className="px-3 py-3 font-wide text-[0.48rem] text-gold">{q.type}</td>
                <td className="px-3 py-3">{q.name}</td><td className="px-3 py-3 font-mono text-xs">{q.phone}</td>
                <td className="max-w-xs px-3 py-3 text-muted-foreground">{q.message}</td>
                <td className="px-3 py-3 text-xs">{q.carSlug ? <Link href={'/cars/' + q.carSlug} className="text-gold hover:underline">{q.carSlug}</Link> : '—'}</td>
                <td className="px-3 py-3"><input type="checkbox" checked={q.handled} onChange={(e) => act.mutate({ fn: () => backend.setHandled(q.id, e.target.checked) })} aria-label="Mark handled" className="h-4 w-4 accent-[hsl(41_52%_62%)]" data-testid={'checkbox-handled-' + q.id} /></td>
                <td className="px-3 py-3"><button onClick={() => act.mutate({ fn: () => backend.deleteInquiry(q.id), ok: 'Inquiry deleted' })} aria-label="Delete inquiry" className="hover:text-destructive"><Trash2 className="h-4 w-4" /></button></td>
              </tr>
            ))}
            {!loading && !rows.length && <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">Nothing here yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------ Settings ------------------------------ */

function SettingsAdmin({ backend, initial }: { backend: AdminBackend; initial: Settings }) {
  const [s, setS] = useState<Settings>(initial);
  const act = useAction();
  const f = (k: 'whatsapp' | 'phone' | 'address' | 'hours', label: string) => (
    <label><span className="label">{label}</span><input className="field" value={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.value })} data-testid={'input-settings-' + k} /></label>
  );
  return (
    <div className="max-w-2xl">
      <H sub="Shown in header, footer, contact page and structured data">Settings</H>
      <div className="grid gap-4 sm:grid-cols-2">
        {f('whatsapp', 'WhatsApp number (international)')}{f('phone', 'Phone')}{f('address', 'Address')}{f('hours', 'Working hours')}
      </div>
      <h2 className="mb-4 mt-10 font-display text-3xl">Social links</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {(['facebook', 'instagram', 'tiktok', 'x'] as const).map((k) => (
          <label key={k}><span className="label">{k === 'x' ? 'X / Twitter' : k}</span><input className="field" value={s.socials[k]} placeholder="#" onChange={(e) => setS({ ...s, socials: { ...s.socials, [k]: e.target.value } })} data-testid={'input-social-' + k} /></label>
        ))}
      </div>
      <button onClick={() => act.mutate({ fn: () => backend.saveSettings(s), ok: 'Settings saved' })} disabled={act.isPending} className="btn-gold mt-8 disabled:opacity-60" data-testid="button-save-settings"><Check className="h-4 w-4" /> Save settings</button>
    </div>
  );
}
