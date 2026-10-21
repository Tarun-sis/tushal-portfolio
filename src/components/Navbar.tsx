import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Menu, X } from 'lucide-react';
import { navLinks, siteConfig, hero } from '@/config';

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('');
  const [progress, setProgress] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Scroll state + progress (rAF-throttled)
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(window.scrollY > 24);
      setProgress(h > 0 ? Math.min(1, window.scrollY / h) : 0);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  // Active section indicator
  useEffect(() => {
    const ids = navLinks.map((l) => l.href.slice(1));
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }),
      { rootMargin: '-45% 0px -50% 0px' }
    );
    ids.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);

  // Mobile menu: scroll lock, Esc to close, focus trap, restore focus
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusables = () =>
      Array.from(menuRef.current?.querySelectorAll<HTMLElement>('a, button') ?? []).concat(toggleRef.current ?? []);
    menuRef.current?.querySelector<HTMLElement>('a')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); toggleRef.current?.focus(); }
      if (e.key === 'Tab') {
        const f = focusables(); if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    const onResize = () => { if (window.innerWidth >= 768) setOpen(false); };
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize); };
  }, [open]);

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled || open ? 'border-b border-line bg-bg/85 backdrop-blur-md' : 'border-b border-transparent'}`}>
        <nav className="container-x flex h-16 items-center justify-between md:h-[72px]" aria-label="Main">
          <a href="#home" className="font-display text-lg font-bold tracking-tight" aria-label={`${siteConfig.name} — home`}>
            Tushal<span className="text-neon">.</span>
          </a>
          <ul className="hidden items-center gap-4 lg:gap-6 md:flex">
            {navLinks.map((l) => (
              <li key={l.href}>
                <a href={l.href} aria-current={active === l.href.slice(1) ? 'true' : undefined}
                   className="nav-underline pb-1 text-sm text-mute">{l.label}</a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <a href="#contact" className="btn btn-primary hidden min-h-[40px] px-5 md:inline-flex">Let’s Talk</a>
            <button ref={toggleRef} type="button" className="grid h-11 w-11 place-items-center rounded-full border border-line md:hidden"
              aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen((o) => !o)}>
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
        <div className="h-px origin-left bg-neon" style={{ transform: `scaleX(${progress})`, opacity: scrolled ? 1 : 0 }} aria-hidden="true" />
      </header>

      {open && (
        <div id="mobile-menu" ref={menuRef} role="dialog" aria-modal="true" aria-label="Menu"
             className="fixed inset-0 z-40 flex flex-col bg-bg px-6 pb-10 pt-24 md:hidden">
          <ul className="flex flex-col">
            {navLinks.map((l, i) => (
              <li key={l.href} className="border-b border-line">
                <a href={l.href} onClick={() => setOpen(false)} className="flex items-baseline gap-4 py-5 font-display text-3xl font-semibold">
                  <span className="font-mono text-xs text-neon">0{i + 1}</span>{l.label}
                </a>
              </li>
            ))}
          </ul>
          <a href={hero.secondaryCta.href} onClick={() => setOpen(false)} className="btn btn-primary mt-8">{hero.secondaryCta.label}</a>
        </div>
      )}
    </>
  );
}

export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 900);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  if (!show) return null;
  return (
    <a href="#home" aria-label="Back to top"
       className="fixed bottom-5 right-5 z-40 grid h-12 w-12 place-items-center rounded-full border border-line bg-surface/90 text-neon backdrop-blur transition hover:border-neon">
      <ArrowUp className="h-5 w-5" />
    </a>
  );
}
