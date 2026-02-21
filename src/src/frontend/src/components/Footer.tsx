import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t-4 border-secondary bg-card texture-grunge mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm font-comic">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors hover-shake">
              FAQ
            </a>
            <span className="text-border">|</span>
            <a href="#" className="text-muted-foreground hover:text-accent transition-colors hover-shake">
              Terms
            </a>
            <span className="text-border">|</span>
            <a href="#" className="text-muted-foreground hover:text-secondary transition-colors hover-shake">
              Contact
            </a>
            <span className="text-border">|</span>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors hover-shake">
              Random Meme
            </a>
          </div>
          
          <div className="flex items-center gap-2 text-sm font-comic text-muted-foreground">
            <span>© 2026. Built with</span>
            <Heart className="w-4 h-4 text-primary animate-sparkle" fill="currentColor" />
            <span>using</span>
            <a
              href="https://caffeine.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-accent transition-colors hover-glow font-bold"
            >
              caffeine.ai
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
