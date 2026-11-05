import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CarImage } from './car-image';

/** Swipeable gallery with thumbnails and keyboard arrows. */
export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [ref, api] = useEmblaCarousel({ loop: images.length > 1 });
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!api) return;
    const on = () => setI(api.selectedScrollSnap());
    api.on('select', on); on();
    return () => { api.off('select', on); };
  }, [api]);
  const prev = useCallback(() => api?.scrollPrev(), [api]);
  const next = useCallback(() => api?.scrollNext(), [api]);
  const list = images.length ? images : [''];
  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-[3px] border border-card-border bg-card" tabIndex={0} aria-roledescription="carousel" aria-label={alt + ' photos'}
        onKeyDown={(e) => { if (e.key === 'ArrowLeft') prev(); if (e.key === 'ArrowRight') next(); }}>
        <div ref={ref} className="overflow-hidden">
          <div className="flex touch-pan-y">
            {list.map((src, k) => (
              <div key={k} className="min-w-0 flex-[0_0_100%]">
                <CarImage src={src} alt={alt + ' photo ' + (k + 1)} eager={k === 0} className="aspect-[16/10] w-full" />
              </div>
            ))}
          </div>
        </div>
        {list.length > 1 && (<>
          <button onClick={prev} aria-label="Previous photo" data-testid="button-gallery-prev" className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-background/60 backdrop-blur transition hover:border-[hsl(var(--gold))]"><ChevronLeft className="h-5 w-5" /></button>
          <button onClick={next} aria-label="Next photo" data-testid="button-gallery-next" className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-background/60 backdrop-blur transition hover:border-[hsl(var(--gold))]"><ChevronRight className="h-5 w-5" /></button>
          <span className="absolute bottom-3 right-3 rounded-[2px] bg-background/70 px-2 py-1 font-mono text-xs backdrop-blur">{String(i + 1).padStart(2, '0')} / {String(list.length).padStart(2, '0')}</span>
        </>)}
      </div>
      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {list.map((src, k) => (
            <button key={k} onClick={() => api?.scrollTo(k)} aria-label={'Show photo ' + (k + 1)} data-testid={'button-thumb-' + k}
              className={'relative h-16 w-24 shrink-0 overflow-hidden rounded-[2px] border transition ' + (k === i ? 'border-[hsl(var(--gold))]' : 'border-transparent opacity-50 hover:opacity-100')}>
              <CarImage src={src} alt="" className="h-full w-full" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
