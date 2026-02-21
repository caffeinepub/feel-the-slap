import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useGetPosts, useGetCallerProfile } from "../hooks/useQueries";
import { CreatePostForm } from "../components/CreatePostForm";
import { PostCard } from "../components/PostCard";
import { LeftSidebar } from "../components/LeftSidebar";
import { RightSidebar } from "../components/RightSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Skull } from "lucide-react";
import { isOver18 } from "../lib/auth";
import { toast } from "sonner";

export function EighteenPlusPage() {
  const navigate = useNavigate();
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const { data: posts = [], isLoading } = useGetPosts(limit, offset);
  const { data: profile } = useGetCallerProfile();

  const userIsOver18 = profile ? isOver18(new Date(Number(profile.dateOfBirth) / 1_000_000)) : false;

  // Age gate check
  if (profile && !userIsOver18) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 dark texture-grunge">
        <Card className="w-full max-w-md border-4 border-destructive shadow-neon-strong animate-bounce-in">
          <CardHeader>
            <CardTitle className="font-pixel text-2xl text-center text-destructive flex items-center justify-center gap-2">
              <Skull className="w-8 h-8" />
              18+ ONLY
            </CardTitle>
            <CardDescription className="text-center font-comic">
              You must be 18 or older to access this section
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-comic text-center text-muted-foreground">
              This section contains adult content and is restricted to users 18 years and older.
            </p>
            <Button
              onClick={() => navigate({ to: "/" })}
              className="w-full font-comic hover-shake"
            >
              Return to Main Feed
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter only 18+ posts
  const adultPosts = posts.filter((post) => post.is18Plus);

  const handleLoadMore = () => {
    setOffset((prev) => prev + limit);
  };

  return (
    <div className="min-h-screen flex dark">
      <LeftSidebar />

      <main className="flex-1 container max-w-3xl mx-auto px-4 py-6 space-y-6">
        <Card className="border-4 border-destructive bg-card texture-grunge shadow-neon-strong">
          <CardHeader>
            <CardTitle className="font-pixel text-xl text-destructive flex items-center gap-2">
              <Skull className="w-6 h-6" />
              18+ SECTION
            </CardTitle>
            <CardDescription className="font-comic">
              A space for more intense emotions and adult content. Be respectful.
            </CardDescription>
          </CardHeader>
        </Card>

        {profile && <CreatePostForm defaultIs18Plus={true} />}

        {isLoading && offset === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : adultPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-comic text-lg text-muted-foreground">
              No 18+ posts yet. Share your deeper feelings. 🖤
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {adultPosts.map((post) => (
                <div key={post.id}>
                  <PostCard post={post} />
                </div>
              ))}
            </div>

            {adultPosts.length >= limit && (
              <div className="flex justify-center pt-6">
                <Button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="font-comic hover-shake"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      <RightSidebar />
    </div>
  );
}
