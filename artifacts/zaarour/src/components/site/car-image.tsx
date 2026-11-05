import { useState } from 'react';

/** Image with lazy loading and a graceful branded fallback if the remote image fails. */
export function CarImage({ src, alt, className = '', eager = false }: { src?: string; alt: string; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div role="img" aria-label={alt} className={'flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,hsl(41_30%_22%),hsl(30_8%_7%))] ' + className}>
        <span className="font-wide text-[0.6rem] text-gold/70">ZAAROUR</span>
      </div>
    );
  }
  return <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} className={'object-cover ' + className} />;
}
