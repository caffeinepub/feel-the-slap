import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useIsSiteOwner, useGetFlaggedPosts, useUnflagPost, useDeletePost, useBanUser, useUnbanUser, useGetUserProfile } from "../hooks/useQueries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Shield, Flag, UserX, CheckCircle, Trash2, Ban } from "lucide-react";
import { toast } from "sonner";
import type { Post } from "../backend";

export function AdminPanel() {
  const navigate = useNavigate({ from: "/admin" });
  const { data: isSiteOwner = false, isLoading: checkingOwner } = useIsSiteOwner();
  const { data: flaggedPosts = [], isLoading: loadingPosts } = useGetFlaggedPosts();
  const unflagPost = useUnflagPost();
  const deletePost = useDeletePost();
  const banUser = useBanUser();
  const unbanUser = useUnbanUser();
  const [userSearchQuery, setUserSearchQuery] = useState("");

  useEffect(() => {
    if (!checkingOwner && !isSiteOwner) {
      toast.error("Access denied: Site owner only");
      navigate({ to: "/" });
    }
  }, [isSiteOwner, checkingOwner, navigate]);

  const handleUnflag = async (postId: string) => {
    try {
      await unflagPost.mutateAsync(postId);
      toast.success("Post unflagged");
    } catch (error) {
      toast.error("Failed to unflag post");
      console.error(error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost.mutateAsync(postId);
      toast.success("Post deleted");
    } catch (error) {
      toast.error("Failed to delete post");
      console.error(error);
    }
  };

  const handleBanUser = async (userId: string) => {
    try {
      await banUser.mutateAsync(userId);
      toast.success("User banned");
    } catch (error) {
      toast.error("Failed to ban user");
      console.error(error);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await unbanUser.mutateAsync(userId);
      toast.success("User unbanned");
    } catch (error) {
      toast.error("Failed to unban user");
      console.error(error);
    }
  };

  if (checkingOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSiteOwner) {
    return null;
  }

  return (
    <div className="min-h-screen container max-w-6xl mx-auto px-4 py-6">
      <Card className="border-4 border-destructive bg-card texture-grunge shadow-neon-strong animate-bounce-in mb-6">
        <CardHeader>
          <CardTitle className="font-pixel text-2xl text-destructive flex items-center gap-2">
            <Shield className="w-8 h-8" />
            ADMIN PANEL
          </CardTitle>
          <p className="font-comic text-muted-foreground">Site Owner Dashboard</p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="flagged" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 border-2 border-primary">
          <TabsTrigger value="flagged" className="font-comic">
            <Flag className="w-4 h-4 mr-2" />
            Flagged Posts
          </TabsTrigger>
          <TabsTrigger value="users" className="font-comic">
            <UserX className="w-4 h-4 mr-2" />
            User Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flagged" className="space-y-4">
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="font-pixel text-lg text-primary">FLAGGED POSTS</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPosts ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : flaggedPosts.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-secondary" />
                  <p className="font-comic text-muted-foreground">No flagged posts to review</p>
                </div>
              ) : (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {flaggedPosts.map((post) => (
                      <FlaggedPostCard
                        key={post.id}
                        post={post}
                        onUnflag={() => handleUnflag(post.id)}
                        onDelete={() => handleDeletePost(post.id)}
                        onBanUser={() => handleBanUser(post.userId)}
                        isPending={unflagPost.isPending || deletePost.isPending || banUser.isPending}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="font-pixel text-lg text-primary">USER MANAGEMENT</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Search users by ID..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="border-2 border-accent font-comic"
                />
              </div>

              {userSearchQuery && (
                <UserManagementCard
                  userId={userSearchQuery}
                  onBan={() => handleBanUser(userSearchQuery)}
                  onUnban={() => handleUnbanUser(userSearchQuery)}
                  isPending={banUser.isPending || unbanUser.isPending}
                />
              )}

              <p className="text-sm text-muted-foreground font-comic">
                Enter a user ID to view and manage their account.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface FlaggedPostCardProps {
  post: Post;
  onUnflag: () => void;
  onDelete: () => void;
  onBanUser: () => void;
  isPending: boolean;
}

function FlaggedPostCard({ post, onUnflag, onDelete, onBanUser, isPending }: FlaggedPostCardProps) {
  const postDate = new Date(Number(post.timestamp) / 1_000_000);

  return (
    <Card className="border-2 border-destructive bg-destructive/5">
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="destructive" className="font-pixel text-xs">
                FLAGGED
              </Badge>
              <Badge variant="outline" className="font-comic">
                {post.isAnonymous ? "Anonymous" : post.userId}
              </Badge>
              {post.is18Plus && (
                <Badge variant="destructive" className="font-pixel text-xs">
                  18+
                </Badge>
              )}
            </div>
            <p className="font-comic text-sm mb-2">{post.content}</p>
            {post.imageUrl && (
              <img 
                src={post.imageUrl.getDirectURL()} 
                alt="Post" 
                className="rounded border-2 border-accent max-w-xs h-auto mb-2"
              />
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-comic">
              <span>{postDate.toLocaleString()}</span>
              {post.flaggedBy && (
                <span>• Flagged by: {post.flaggedBy}</span>
              )}
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={onUnflag}
            disabled={isPending}
            className="font-comic hover-shake"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Unflag
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={onDelete}
            disabled={isPending}
            className="font-comic hover-shake"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete Post
          </Button>
          {!post.isAnonymous && (
            <Button
              size="sm"
              variant="destructive"
              onClick={onBanUser}
              disabled={isPending}
              className="font-comic hover-shake"
            >
              <Ban className="w-4 h-4 mr-1" />
              Ban User
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface UserManagementCardProps {
  userId: string;
  onBan: () => void;
  onUnban: () => void;
  isPending: boolean;
}

function UserManagementCard({ userId, onBan, onUnban, isPending }: UserManagementCardProps) {
  const { data: profile, isLoading } = useGetUserProfile(userId);

  if (isLoading) {
    return (
      <Card className="border-2 border-muted">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="border-2 border-muted">
        <CardContent className="py-8">
          <p className="text-center font-comic text-muted-foreground">User not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-2 ${profile.isBanned ? 'border-destructive bg-destructive/5' : 'border-primary'}`}>
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-pixel text-lg text-primary">{profile.username}</h3>
            <p className="text-sm text-muted-foreground font-comic">{userId}</p>
            <p className="text-sm text-muted-foreground font-comic">Email: {profile.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={profile.isProfilePublic ? "outline" : "secondary"} className="font-comic">
                {profile.isProfilePublic ? "Public" : "Private"}
              </Badge>
              {profile.isBanned && (
                <Badge variant="destructive" className="font-pixel text-xs">
                  BANNED
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex gap-2">
          {profile.isBanned ? (
            <Button
              size="sm"
              variant="default"
              onClick={onUnban}
              disabled={isPending}
              className="font-comic hover-shake"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Unban User
            </Button>
          ) : (
            <Button
              size="sm"
              variant="destructive"
              onClick={onBan}
              disabled={isPending}
              className="font-comic hover-shake"
            >
              <Ban className="w-4 h-4 mr-1" />
              Ban User
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
