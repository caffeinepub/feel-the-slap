import { useState } from "react";
import { useGetPosts, useGetCallerProfile } from "../hooks/useQueries";
import { CreatePostForm } from "../components/CreatePostForm";
import { PostCard } from "../components/PostCard";
import { LeftSidebar } from "../components/LeftSidebar";
import { RightSidebar } from "../components/RightSidebar";
import { Button } from "@/components/ui/button";
import { Loader2, Shuffle } from "lucide-react";
import { isOver18 } from "../lib/auth";

export function FeedPage() {
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const { data: posts = [], isLoading } = useGetPosts(limit, offset);
  const { data: profile } = useGetCallerProfile();

  const userIsOver18 = profile ? isOver18(new Date(Number(profile.dateOfBirth) / 1_000_000)) : false;

  // Filter out 18+ posts if user is under 18
  const filteredPosts = posts.filter((post) => {
    if (post.is18Plus && !userIsOver18) {
      return false;
    }
    return true;
  });

  const handleLoadMore = () => {
    setOffset((prev) => prev + limit);
  };

  const handleRandomPost = () => {
    if (filteredPosts.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredPosts.length);
      const postElement = document.querySelectorAll('[data-post-card]')[randomIndex];
      postElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="min-h-screen flex">
      <LeftSidebar />

      <main className="flex-1 container max-w-3xl mx-auto px-4 py-6 space-y-6">
        {profile && <CreatePostForm />}

        <div className="flex items-center justify-between">
          <h2 className="font-pixel text-xl text-primary">THE FEED</h2>
          <Button
            onClick={handleRandomPost}
            variant="outline"
            size="sm"
            className="font-comic hover-shake border-2"
          >
            <Shuffle className="w-4 h-4 mr-2" />
            Random Slap
          </Button>
        </div>

        {isLoading && offset === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-comic text-lg text-muted-foreground">
              No posts yet! Be the first to share your feelings. 💭
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {filteredPosts.map((post) => (
                <div key={post.id} data-post-card>
                  <PostCard post={post} />
                </div>
              ))}
            </div>

            {posts.length >= limit && (
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
                    "Load More Slaps"
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
