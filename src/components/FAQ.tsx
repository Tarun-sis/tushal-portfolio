import { Plus } from 'lucide-react';
import { faqItems } from '@/config';

export function FAQ() {
  return (
    <section id="faq" className="section border-t border-line">
      <div className="container-x grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="eyebrow reveal">FAQ</p>
          <h2 className="h2 reveal mt-4" style={{ ['--d' as string]: '80ms' }}>Good questions, honest answers.</h2>
        </div>
        <div className="reveal divide-y divide-line border-y border-line">
          {faqItems.map((f) => (
            <details key={f.q} className="group py-1">
              <summary className="flex min-h-[64px] items-center justify-between gap-6 py-4 text-left text-base font-medium sm:text-lg">
                {f.q}
                <Plus className="faq-plus h-5 w-5 shrink-0 text-neon transition-transform duration-300" aria-hidden="true" />
              </summary>
              <p className="pb-6 pr-10 text-sm leading-relaxed text-mute sm:text-base">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
