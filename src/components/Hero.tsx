import { useEffect, useRef } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { hero } from '@/config';
import { useFinePointer, usePrefersReducedMotion } from '@/hooks/useMedia';

export function Hero() {
  const stage = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();

  // Pointer-reactive depth (desktop with a fine pointer only)
  useEffect(() => {
    const el = stage.current;
    if (!el || !fine || reduced) return;
    let raf = 0, tx = 0, ty = 0;
    const apply = () => { raf = 0; el.style.setProperty('--mx', tx.toFixed(3)); el.style.setProperty('--my', ty.toFixed(3)); };
    const move = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => { window.removeEventListener('pointermove', move); if (raf) cancelAnimationFrame(raf); };
  }, [fine, reduced]);

  const layer = (depth: number) =>
    ({ transform: `translate3d(calc(var(--mx,0) * ${depth}px), calc(var(--my,0) * ${depth}px), 0)` }) as React.CSSProperties;

  return (
    <section id="home" className="relative isolate overflow-hidden pb-16 pt-28 sm:pt-32 md:pb-20 md:pt-40">
      <div className="bg-grid absolute inset-0 -z-10" aria-hidden="true" />
      <div className="absolute left-1/2 top-[-12rem] -z-10 h-[34rem] w-[60rem] max-w-[140vw] -translate-x-1/2 rounded-full opacity-25 blur-[120px]"
           style={{ background: 'radial-gradient(closest-side, #C5FF00, transparent)' }} aria-hidden="true" />

      <div className="container-x grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-8">
        <div>
          <p className="fade-in mb-8 inline-flex items-center gap-2.5 rounded-full border border-line bg-surface/80 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-mute">
            <span className="pulse-dot h-2 w-2 rounded-full bg-neon" aria-hidden="true" />
            {hero.eyebrow}
          </p>
          <h1 aria-label="Websites That Bring Your Ideas to Life." className="font-display text-[clamp(2.3rem,9.5vw,4.75rem)] font-semibold leading-[0.98]">
            {hero.lines.map((l, i) => (
              <span key={l} className="hero-line" aria-hidden="true"><span style={{ ['--d' as string]: `${120 + i * 110}ms` }}>{l}</span></span>
            ))}
            <span className="hero-line" aria-hidden="true"><span className="text-neon" style={{ ['--d' as string]: `${120 + hero.lines.length * 110}ms` }}>{hero.highlight}</span></span>
          </h1>
          <p className="fade-in lead mt-8 max-w-xl" style={{ ['--d' as string]: '650ms' }}>{hero.description}</p>
          <div className="fade-in mt-10 flex flex-col gap-3 sm:flex-row" style={{ ['--d' as string]: '780ms' }}>
            <a href={hero.primaryCta.href} className="btn btn-primary">{hero.primaryCta.label}<ArrowRight className="h-4 w-4" /></a>
            <a href={hero.secondaryCta.href} className="btn btn-ghost">{hero.secondaryCta.label}</a>
          </div>
          <p className="fade-in mt-8 flex items-center gap-2 text-sm text-mute" style={{ ['--d' as string]: '900ms' }}>
            <Check className="h-4 w-4 text-neon" aria-hidden="true" />Thoughtful design, made to work on every screen.
          </p>
        </div>

        <div className="mx-auto w-full max-w-[540px]">
          <div ref={stage} className="fade-in relative h-[350px] w-full sm:h-[430px] lg:h-[460px]" style={{ ['--d' as string]: '500ms' }} aria-hidden="true">
            <div className="absolute left-[2%] top-[18%] z-10 w-[78%]" style={layer(-14)}>
              <div className="browser overflow-hidden rounded-2xl border-white/15 bg-[#101216]">
                <img src="/projects/portfolio-preview.svg" alt="" width="1200" height="750" loading="eager" decoding="async" className="block aspect-[16/10] w-full" />
              </div>
            </div>
            <div className="absolute right-0 top-[1%] z-20 w-[51%]" style={layer(10)}>
              <div className="browser drift border border-[#61a7ff]/25 bg-[#0b1220]" style={{ animationDelay: '-2s' }}>
                <img src="/projects/civiclens-preview.svg" alt="" width="1200" height="750" loading="eager" decoding="async" className="block aspect-[16/10] w-full" />
              </div>
            </div>
            <div className="absolute bottom-[2%] right-[1%] z-20 w-[56%]" style={layer(24)}>
              <div className="browser drift border border-[#d6b896]/25 bg-[#16130f]" style={{ animationDelay: '-4s' }}>
                <img src="/projects/urbannest-preview.svg" alt="" width="1200" height="750" loading="eager" decoding="async" className="block aspect-[16/10] w-full" />
              </div>
            </div>
          </div>
          <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-wider text-mute">Original project illustrations · not screenshots</p>
        </div>
      </div>
    </section>
  );
}
