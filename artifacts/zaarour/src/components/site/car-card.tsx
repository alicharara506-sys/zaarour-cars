import { useRef } from 'react';
import { Link } from 'wouter';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Fuel, Gauge, Cog } from 'lucide-react';
import type { Car } from '@/data/cars';
import { usd, km } from '@/lib/format';
import { CarImage } from './car-image';

/** Inventory card with 3D tilt + glare on hover (pointer devices only). */
export function CarCard({ car, priority = false }: { car: Car; priority?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const mx = useMotionValue(0.5), my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [7, -7]), { stiffness: 200, damping: 18 });
  const ry = useSpring(useTransform(mx, [0, 1], [-9, 9]), { stiffness: 200, damping: 18 });
  const glareX = useTransform(mx, (v) => v * 100 + '%');
  const glare = useTransform(glareX, (x) => 'radial-gradient(400px circle at ' + x + ' 30%, hsl(41 60% 75% / .16), transparent 45%)');
  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== 'mouse' || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width); my.set((e.clientY - r.top) / r.height);
  };
  const reset = () => { mx.set(0.5); my.set(0.5); };
  const main = car.images[0];
  return (
    <motion.div ref={ref} onPointerMove={onMove} onPointerLeave={reset} style={{ rotateX: rx, rotateY: ry, transformPerspective: 1000 }} className="group relative will-change-transform">
      <Link href={'/cars/' + car.slug} data-testid={'card-car-' + car.slug}
        className="block overflow-hidden rounded-[3px] border border-card-border bg-card transition-colors duration-500 hover:border-[hsl(var(--gold)/.5)]">
        <article>
          <div className="relative aspect-[4/3] overflow-hidden">
            <CarImage src={main} alt={car.year + ' ' + car.make + ' ' + car.model + ' ' + car.trim} eager={priority}
              className="h-full w-full transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[hsl(30_9%_5%)] via-transparent to-transparent" />
            <div className="absolute left-3 top-3 flex gap-1.5">
              <span className="rounded-[2px] bg-background/70 px-2 py-1 font-wide text-[0.5rem] backdrop-blur">{car.condition === 'new' ? 'New' : 'Pre-owned'}</span>
              {car.newArrival && !car.sold && <span className="rounded-[2px] bg-[hsl(var(--gold))] px-2 py-1 font-wide text-[0.5rem] text-primary-foreground">Just in</span>}
            </div>
            {car.sold && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/55">
                <span className="rotate-[-8deg] border border-[hsl(var(--gold))] px-5 py-2 font-wide text-sm text-gold" data-testid={'status-sold-' + car.slug}>Sold</span>
              </div>
            )}
            <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
              <p className="font-mono text-2xl font-medium tracking-tight text-foreground" data-testid={'text-price-' + car.slug}>{usd(car.price)}</p>
              <ArrowUpRight className="h-5 w-5 text-gold opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100 -translate-x-2" />
            </div>
          </div>
          <div className="space-y-3 p-4">
            <div>
              <p className="font-wide text-[0.55rem] text-muted-foreground">{car.year} · {car.make}</p>
              <h3 className="mt-1 font-display text-2xl leading-tight">{car.model} <span className="italic text-silver">{car.trim}</span></h3>
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-border pt-3 font-mono text-[0.7rem] text-muted-foreground">
              <span className="flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5 text-gold" />{km(car.mileage)}</span>
              <span className="flex items-center gap-1.5"><Fuel className="h-3.5 w-3.5 text-gold" />{car.fuelType}</span>
              <span className="flex items-center gap-1.5"><Cog className="h-3.5 w-3.5 text-gold" />{car.transmission}</span>
            </div>
          </div>
        </article>
      </Link>
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 rounded-[3px] opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: glare }} />
    </motion.div>
  );
}

export function CarCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[3px] border border-card-border bg-card">
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <div className="space-y-3 p-4"><div className="h-3 w-24 animate-pulse bg-muted" /><div className="h-6 w-2/3 animate-pulse bg-muted" /><div className="h-4 w-full animate-pulse bg-muted" /></div>
    </div>
  );
}
