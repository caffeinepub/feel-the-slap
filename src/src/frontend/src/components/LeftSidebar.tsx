import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, TrendingUp, Shuffle } from "lucide-react";

export function LeftSidebar() {
  return (
    <aside className="hidden lg:block w-64 space-y-4">
      <Card className="border-2 border-primary bg-card texture-grunge">
        <CardHeader className="pb-3">
          <CardTitle className="font-pixel text-sm text-primary flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            YOUR NOTES
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-32">
            <p className="text-sm font-comic text-muted-foreground">
              Quick notes and reminders coming soon! ✨
            </p>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="border-2 border-secondary bg-card texture-grunge">
        <CardHeader className="pb-3">
          <CardTitle className="font-pixel text-sm text-secondary flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            TOP SLAPS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-32">
            <p className="text-sm font-comic text-muted-foreground">
              Trending posts coming soon! 🔥
            </p>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="border-2 border-accent bg-card texture-grunge">
        <CardHeader className="pb-3">
          <CardTitle className="font-pixel text-sm text-accent flex items-center gap-2">
            <Shuffle className="w-4 h-4" />
            CONFESSIONS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-32">
            <p className="text-sm font-comic text-muted-foreground">
              Random confessions coming soon! 🫣
            </p>
          </ScrollArea>
        </CardContent>
      </Card>
    </aside>
  );
}
