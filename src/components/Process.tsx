import { processSteps } from '@/config';

export function Process() {
  return (
    <section id="process" className="section border-t border-line">
      <div className="container-x">
        <div className="max-w-3xl">
          <p className="eyebrow reveal">Process</p>
          <h2 className="h2 reveal mt-4" style={{ ['--d' as string]: '80ms' }}>A simple path from idea to launch.</h2>
        </div>
        <ol className="relative mt-16 grid gap-10 md:grid-cols-4 md:gap-6">
          <div className="process-line reveal absolute left-0 right-0 top-[27px] hidden h-px bg-gradient-to-r from-neon via-neon/40 to-line md:block" aria-hidden="true" />
          {processSteps.map((s, i) => (
            <li key={s.n} className="reveal relative md:pr-4" style={{ ['--d' as string]: `${i * 140}ms` }}>
              <span className="relative z-10 grid h-14 w-14 place-items-center rounded-full border border-neon/50 bg-bg font-mono text-sm text-neon">{s.n}</span>
              <h3 className="mt-6 text-2xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">{s.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
