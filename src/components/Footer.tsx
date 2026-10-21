import { siteConfig, navLinks, footerServices } from '@/config';

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface/50">
      <div className="container-x py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display text-3xl font-semibold leading-tight sm:text-4xl">Websites that bring your<br />business <span className="text-neon">online.</span></p>
            <a href="#contact" className="btn btn-primary mt-8">Let’s Build Your Website</a>
          </div>
          <nav aria-label="Footer">
            <p className="eyebrow">Explore</p>
            <ul className="mt-5 space-y-3 text-sm text-mute">
              {navLinks.map((l) => <li key={l.href}><a className="hover:text-neon" href={l.href}>{l.label}</a></li>)}
              <li><a className="hover:text-neon" href="#faq">FAQ</a></li>
            </ul>
          </nav>
          <div>
            <p className="eyebrow">Services</p>
            <ul className="mt-5 space-y-3 text-sm text-mute">{footerServices.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
        </div>
        <div className="mt-14 flex flex-col justify-between gap-3 border-t border-line pt-6 text-xs text-mute sm:flex-row">
          <p>{siteConfig.footerCredit}</p>
          <p>© {new Date().getFullYear()} {siteConfig.name} · {siteConfig.location}</p>
        </div>
      </div>
    </footer>
  );
}
