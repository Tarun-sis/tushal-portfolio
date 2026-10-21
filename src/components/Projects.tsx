
import { useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import {
  projects as defaultProjects,
  type Project,
} from '@/config';
import {
  useFinePointer,
  usePrefersReducedMotion,
} from '@/hooks/useMedia';
import {
  getSupabaseClient,
  supabaseConfigurationError,
} from '@/lib/supabase';

function ProjectCard({
  p,
  index,
}: {
  p: Project;
  index: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();
  const canTilt = fine && !reduced;

  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    const el = ref.current;

    if (!el || !canTilt) return;

    const rect = el.getBoundingClientRect();

    el.style.setProperty(
      '--ry',
      `${((e.clientX - rect.left) / rect.width - 0.5) * 5}deg`,
    );

    el.style.setProperty(
      '--rx',
      `${-((e.clientY - rect.top) / rect.height - 0.5) * 5}deg`,
    );
  };

  const onLeave = () => {
    ref.current?.style.removeProperty('--rx');
    ref.current?.style.removeProperty('--ry');
  };

  return (
    <article
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="card group flex flex-col p-4 hover:border-neon/40 sm:p-5"
      style={{ ['--d' as string]: `${index * 120}ms` }}
    >
      <div className="browser overflow-hidden transition duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_30px_60px_-25px_rgba(197,255,0,.25)]">
        <img
          src={p.image.src}
          alt={p.image.alt}
          width={1200}
          height={750}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const img = e.currentTarget;

            // If a preview image is missing, use a working
            // fallback rather than repeatedly retrying it.
            if (!img.dataset.fallback) {
              img.dataset.fallback = 'true';
              img.src = '/projects/portfolio-preview.svg';
            }
          }}
          className="aspect-[16/10] w-full object-cover transition duration-700 group-hover:scale-[1.025]"
        />
      </div>

      <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-mute">
        {p.image.note}
      </p>

      <div className="mt-4 flex flex-1 flex-col px-1 pb-1">
        <h3 className="mt-3 text-2xl font-semibold">
          {p.name}
        </h3>

        <p className="mt-2 flex-1 text-sm leading-relaxed text-mute">
          {p.description}
        </p>

        <a
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex min-h-[44px] w-fit items-center gap-2 text-sm font-semibold text-soft transition hover:text-neon"
        >
          {p.linkLabel}
          <ExternalLink
            className="h-4 w-4"
            aria-hidden="true"
          />
          <span className="sr-only">
            (opens in a new tab)
          </span>
        </a>
      </div>
    </article>
  );
}

export function Projects() {
  // Show configured projects immediately; never start with
  // an empty list while waiting for Supabase.
  const [projects, setProjects] = useState<Project[]>(
    defaultProjects,
  );

  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      const supabase = getSupabaseClient();

      if (!supabase) {
        if (active && supabaseConfigurationError) {
          setLoadError(
            'Database settings are incomplete. Showing the saved project list.',
          );
        }

        return;
      }

      try {
        const { data, error } = await supabase
          .from('projects')
          .select(
            'id,name,description,url,image_url,image_alt,image_note',
          )
          .eq('is_published', true)
          .order('sort_order', { ascending: true });

        if (!active) return;

        if (error) {
          console.error(
            'Published project load failed:',
            error.message,
          );

          setLoadError(
            'Could not load database projects. Showing the saved project list.',
          );

          return;
        }

        // Do not replace the defaults with an empty array.
        if (!data || data.length === 0) {
          setProjects(defaultProjects);
          return;
        }

        const databaseProjects: Project[] = data.map(
          (project) => ({
            id: String(project.id),
            name: project.name,
            description: project.description,
            url: project.url,
            linkLabel: 'Visit Live Project',
            image: {
              src:
                project.image_url ||
                '/projects/portfolio-preview.svg',
              alt:
                project.image_alt ||
                `${project.name} project preview`,
              note:
                project.image_note || 'Project preview',
            },
          }),
        );

        setProjects(databaseProjects);
        setLoadError('');
      } catch (error) {
        if (!active) return;

        console.error('Project loading error:', error);

        setProjects(defaultProjects);
        setLoadError(
          'A database error occurred. Showing the saved project list.',
        );
      }
    }

    void loadProjects();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section
      id="projects"
      className="section border-t border-line"
    >
      <div className="container-x">
        <div className="max-w-2xl">
          <p className="eyebrow reveal">
            Featured projects
          </p>

          <h2
            className="h2 reveal mt-4"
            style={{ ['--d' as string]: '80ms' }}
          >
            Selected projects, built with care.
          </h2>

          <p
            className="lead reveal mt-6"
            style={{ ['--d' as string]: '160ms' }}
          >
            Explore the websites and digital projects I’ve built.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <ProjectCard
              key={project.id}
              p={project}
              index={index}
            />
          ))}
        </div>

        {loadError && (
          <p
            role="status"
            className="mt-5 text-sm text-mute"
          >
            {loadError}
          </p>
        )}
      </div>
    </section>
  );
}
