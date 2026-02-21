export function MarqueeBanner({ text = "spill it now, don't hold back!" }: { text?: string }) {
  return (
    <div className="bg-accent border-y-2 border-primary overflow-hidden py-2">
      <div className="flex whitespace-nowrap">
        <div className="animate-marquee flex gap-8">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="font-pixel text-sm text-accent-foreground">
              ✨ {text} ✨
            </span>
          ))}
        </div>
        <div className="animate-marquee flex gap-8" aria-hidden="true">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="font-pixel text-sm text-accent-foreground">
              ✨ {text} ✨
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
