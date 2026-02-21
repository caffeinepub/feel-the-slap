import { useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useGetUserProfile, useGetPostsByUser, useSaveCallerProfile } from "../hooks/useQueries";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PostCard } from "../components/PostCard";
import { Loader2, Edit2, Save, X, Lock } from "lucide-react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";

export function ProfilePage() {
  const { userId } = useParams({ from: "/profile/$userId" });
  const { identity } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useGetUserProfile(userId);
  const { data: posts = [], isLoading: postsLoading } = useGetPostsByUser(userId);
  const saveProfile = useSaveCallerProfile();

  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const isOwnProfile = identity?.getPrincipal().toString() === userId;

  const handleStartEdit = () => {
    if (!profile) return;
    setEditing(true);
    setEditBio(profile.bio);
    setEditIsPublic(profile.isProfilePublic);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Avatar must be less than 2MB");
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    try {
      let avatarBlob: ExternalBlob | undefined = profile.avatar;

      if (avatarFile) {
        const arrayBuffer = await avatarFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        avatarBlob = ExternalBlob.fromBytes(uint8Array);
      }

      await saveProfile.mutateAsync({
        ...profile,
        bio: editBio,
        isProfilePublic: editIsPublic,
        avatar: avatarBlob,
      });

      toast.success("Profile updated! ✨");
      setEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="border-2 border-muted">
          <CardHeader>
            <CardTitle className="font-pixel text-center">USER NOT FOUND</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center font-comic">This user does not exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile.isProfilePublic && !isOwnProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="font-pixel text-center flex items-center justify-center gap-2">
              <Lock className="w-6 h-6" />
              PRIVATE PROFILE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center font-comic">This profile is private.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen container max-w-4xl mx-auto px-4 py-6 space-y-6">
      <Card className="border-4 border-primary bg-card texture-grunge shadow-neon-strong animate-bounce-in">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20 border-4 border-secondary hover-shake">
                {avatarPreview ? (
                  <AvatarImage src={avatarPreview} />
                ) : profile.avatar ? (
                  <AvatarImage src={profile.avatar.getDirectURL()} />
                ) : (
                  <AvatarFallback className="bg-primary text-primary-foreground font-pixel text-2xl">
                    {profile.username[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <h1 className="font-pixel text-2xl text-primary">{profile.username}</h1>
                {!profile.isProfilePublic && (
                  <Badge variant="outline" className="mt-1 font-comic">
                    🔒 Private
                  </Badge>
                )}
              </div>
            </div>

            {isOwnProfile && !editing && (
              <Button onClick={handleStartEdit} className="font-comic hover-shake" size="sm">
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}

            {editing && (
              <div className="flex gap-2">
                <Button onClick={handleSaveProfile} disabled={saveProfile.isPending} size="sm" className="font-comic">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button onClick={handleCancelEdit} variant="outline" size="sm" className="font-comic">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="avatar" className="font-comic">
                  Change Avatar
                </Label>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="border-2 font-comic"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="font-comic">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="min-h-[100px] border-2 border-primary font-comic"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="public"
                  checked={editIsPublic}
                  onCheckedChange={setEditIsPublic}
                />
                <Label htmlFor="public" className="font-comic cursor-pointer">
                  Public Profile
                </Label>
              </div>
            </>
          ) : (
            <>
              {profile.bio && (
                <div>
                  <h3 className="font-pixel text-sm text-muted-foreground mb-2">BIO</h3>
                  <p className="font-comic whitespace-pre-wrap">{profile.bio}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-4">
                {profile.lastEmotion && (
                  <div>
                    <h3 className="font-pixel text-xs text-muted-foreground mb-1">CURRENT MOOD</h3>
                    <Badge variant="outline" className="border-primary font-comic">
                      💭 {profile.lastEmotion}
                    </Badge>
                  </div>
                )}
                {profile.lastBodySensation && (
                  <div>
                    <h3 className="font-pixel text-xs text-muted-foreground mb-1">BODY</h3>
                    <Badge variant="outline" className="border-secondary font-comic">
                      🫀 {profile.lastBodySensation}
                    </Badge>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="font-pixel text-xl text-primary mb-4">POSTS</h2>
        {postsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <Card className="border-2 border-muted">
            <CardContent className="py-12">
              <p className="text-center font-comic text-muted-foreground">
                No posts yet. {isOwnProfile ? "Share your first feeling!" : "Nothing to see here yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
