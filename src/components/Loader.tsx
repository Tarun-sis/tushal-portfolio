/** Brief, non-blocking intro. Never traps focus or pointer events; removed from the DOM after ~1.8s. */
export function Loader({ name }: { name: string }) {
  return (
    <div className="loader" aria-hidden="true">
      <div className="flex flex-col items-center gap-6">
        <span className="font-display text-2xl font-bold tracking-tight text-soft">
          {name.split(' ')[0]}<span className="text-neon">.</span>
        </span>
        <div className="loader-line" />
      </div>
    </div>
  );
}
