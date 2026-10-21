import { services } from '@/config';
import { getIcon } from '@/lib/icons';
import { prefillContact } from '@/lib/contactBus';

export function Services() {
  return (
    <section id="services" className="section border-t border-line">
      <div className="container-x">
        <div className="max-w-3xl">
          <p className="eyebrow reveal">Services</p>
          <h2 className="h2 reveal mt-4" style={{ ['--d' as string]: '80ms' }}>What I can help you build.</h2>
        </div>
        <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {services.map((s, i) => {
            const Icon = getIcon(s.icon);
            return (
              <li key={s.title} className="reveal" style={{ ['--d' as string]: `${i * 60}ms` }}>
                <a href="#contact" onClick={() => prefillContact(s.type)}
                   className="card group flex min-h-[112px] h-full flex-col items-start justify-center gap-3 rounded-2xl p-4 transition duration-300 hover:-translate-y-1 hover:border-neon/50 hover:bg-raised sm:p-5"
                   aria-label={`${s.title} — discuss this service`}>
                  <Icon className="h-5 w-5 text-neon transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                  <span className="text-sm font-semibold leading-snug text-soft">{s.title}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
