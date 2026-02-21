import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import type { Post, PostVisibility } from "../backend";
import { useGetComments, useCreateComment, useFlagPost } from "../hooks/useQueries";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { MessageCircle, Loader2, Flag, Globe, Users, Lock } from "lucide-react";
import { toast } from "sonner";
import { CommentList } from "./CommentList";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { identity } = useInternetIdentity();
  const [showComments, setShowComments] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  
  const { data: comments = [], isLoading: commentsLoading } = useGetComments(
    showComments ? post.id : undefined
  );
  const createComment = useCreateComment();
  const flagPost = useFlagPost();

  const displayName = post.isAnonymous ? "Anonymous User" : post.userId;
  const postDate = new Date(Number(post.timestamp) / 1_000_000);
  const currentUserId = identity?.getPrincipal().toString();
  const isOwnPost = currentUserId === post.userId;

  const handleFlagPost = async () => {
    try {
      await flagPost.mutateAsync(post.id);
      toast.success("Post flagged for review");
    } catch (error) {
      toast.error("Failed to flag post");
      console.error(error);
    }
  };

  const getVisibilityIcon = (visibility: PostVisibility) => {
    switch (visibility) {
      case "publicVisibility":
        return <Globe className="w-4 h-4 text-muted-foreground" />;
      case "friendsOnly":
        return <Users className="w-4 h-4 text-muted-foreground" />;
      case "privateAccess":
        return <Lock className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Globe className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const handleSubmitComment = async () => {
    if (!commentContent.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    
    if (!identity) {
      toast.error("Please login to comment");
      return;
    }

    try {
      await createComment.mutateAsync({
        content: commentContent,
        postId: post.id,
        userId: identity.getPrincipal().toString(),
        parentCommentId: undefined,
      });
      setCommentContent("");
      toast.success("Comment posted! 💬");
    } catch (error) {
      toast.error("Failed to post comment");
      console.error(error);
    }
  };

  const reactionEmojis = {
    heart: "❤️",
    slap: "👋",
    cry: "😭",
    fire: "🔥",
    vibe: "✨",
  };

  return (
    <Card className="border-2 border-primary bg-card texture-grunge animate-bounce-in shadow-lg hover:shadow-neon transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-secondary hover-shake">
              <AvatarFallback className="bg-primary text-primary-foreground font-pixel text-xs">
                {displayName[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              {post.isAnonymous ? (
                <p className="font-comic font-bold text-sm">{displayName}</p>
              ) : (
                <Link
                  to="/profile/$userId"
                  params={{ userId: post.userId }}
                  className="font-comic font-bold text-sm hover:text-primary transition-colors"
                >
                  {displayName}
                </Link>
              )}
              <p className="text-xs text-muted-foreground font-comic">
                {postDate.toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {getVisibilityIcon(post.visibility)}
            {post.is18Plus && (
              <Badge variant="destructive" className="font-pixel text-xs">
                18+
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="font-comic text-base whitespace-pre-wrap">{post.content}</p>
        
        {post.imageUrl && (
          <img
            src={post.imageUrl.getDirectURL()}
            alt="Post image"
            className="rounded border-2 border-accent max-w-full h-auto hover:scale-105 transition-transform"
          />
        )}

        <div className="flex flex-wrap gap-2">
          {post.emotion && (
            <Badge variant="outline" className="border-primary font-comic">
              💭 {post.emotion}
            </Badge>
          )}
          {post.bodySensation && (
            <Badge variant="outline" className="border-secondary font-comic">
              🫀 {post.bodySensation}
            </Badge>
          )}
        </div>
      </CardContent>

      <Separator className="bg-primary/20" />

      <CardFooter className="flex-col items-stretch gap-3 pt-3">
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(reactionEmojis).map(([key, emoji]) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              className="font-comic hover-shake border-2"
              onClick={() => toast.info(`Reactions coming soon! ${emoji}`)}
            >
              {emoji}
            </Button>
          ))}
          
          {!isOwnPost && currentUserId && (
            <Button
              variant="ghost"
              size="sm"
              className="font-comic hover-shake"
              onClick={handleFlagPost}
              disabled={flagPost.isPending || post.isFlagged}
            >
              <Flag className="w-4 h-4 mr-1" />
              {post.isFlagged ? "Flagged" : "Flag"}
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            className="font-comic ml-auto"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            {comments.length} Comments
          </Button>
        </div>

        {showComments && (
          <div className="space-y-3 mt-2">
            {commentsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <CommentList comments={comments} postId={post.id} />
            )}

            {identity && (
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  className="min-h-[60px] border-2 border-accent font-comic resize-none"
                />
                <Button
                  onClick={handleSubmitComment}
                  disabled={createComment.isPending}
                  className="font-comic hover-shake"
                >
                  {createComment.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Post"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
