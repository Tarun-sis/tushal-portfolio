import { siteConfig, capabilities } from '@/config';
import { getIcon } from '@/lib/icons';

export function About() {
  return (
    <section id="about" className="section border-t border-line">
      <div className="container-x grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="reveal mx-auto w-full max-w-sm self-start lg:sticky lg:top-28 lg:mx-0">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-line bg-surface">
            {siteConfig.portraitSrc ? (
              <img src={siteConfig.portraitSrc} alt={`Portrait of ${siteConfig.name}`} width={640} height={800} loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 grid place-items-center" role="img" aria-label="Abstract placeholder for a portrait of Tushal Sisodia">
                <div className="absolute inset-0 bg-grid opacity-60" />
                <div className="absolute -bottom-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full opacity-30 blur-[80px]" style={{ background: '#C5FF00' }} />
                <span className="relative font-display text-8xl font-bold tracking-tighter text-soft">TS<span className="text-neon">.</span></span>
              </div>
            )}
            <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-2xl border border-line bg-bg/80 px-4 py-3 backdrop-blur">
              <span className="text-sm font-medium">{siteConfig.name}</span>
              <span className="font-mono text-[11px] text-mute">{siteConfig.location}</span>
            </div>
          </div>
        </div>

        <div>
          <p className="eyebrow reveal">About</p>
          <h2 className="h2 reveal mt-4" style={{ ['--d' as string]: '80ms' }}>Hi, I’m Tushal. I build websites for businesses.</h2>
          <div className="reveal mt-8 space-y-5 lead" style={{ ['--d' as string]: '160ms' }}>
            <p>I’m a student developer in Delhi building real projects and creating websites for local businesses and growing brands. I care about sites that look credible, load quickly and are easy for customers to use on a phone.</p>
            <p>I’m still learning and I say so openly. What I can promise is careful work, clear communication, and being honest about what is and isn’t possible.</p>
          </div>
          <ul className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2">
            {capabilities.map((c, i) => {
              const Icon = getIcon(c.icon);
              return (
                <li key={c.title} className="reveal bg-surface p-6" style={{ ['--d' as string]: `${i * 60}ms` }}>
                  <Icon className="h-5 w-5 text-neon" aria-hidden="true" />
                  <h3 className="mt-4 text-base font-semibold">{c.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-mute">{c.desc}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
