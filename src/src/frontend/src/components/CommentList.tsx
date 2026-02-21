import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Comment } from "../backend";
import { Link } from "@tanstack/react-router";

interface CommentListProps {
  comments: Comment[];
  postId: string;
}

export function CommentList({ comments }: CommentListProps) {
  const topLevelComments = comments.filter((c) => !c.parentCommentId);

  if (topLevelComments.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground font-comic text-sm">
        No comments yet. Be the first to comment!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {topLevelComments.map((comment) => {
        const commentDate = new Date(Number(comment.timestamp) / 1_000_000);
        
        return (
          <div key={comment.id} className="flex gap-2 bg-muted/30 p-2 rounded border border-border">
            <Avatar className="w-8 h-8 border border-accent">
              <AvatarFallback className="bg-accent text-accent-foreground font-pixel text-xs">
                {comment.userId[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <Link
                  to="/profile/$userId"
                  params={{ userId: comment.userId }}
                  className="font-comic font-bold text-sm hover:text-primary transition-colors"
                >
                  {comment.userId}
                </Link>
                <span className="text-xs text-muted-foreground font-comic">
                  {commentDate.toLocaleTimeString()}
                </span>
              </div>
              <p className="font-comic text-sm mt-1">{comment.content}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
