import { useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useGetUserProfile, useGetPostsByUser, useSaveCallerProfile, useIsSiteOwner, useAreFriends, useSendFriendRequest, useUnfriend, useGetFriends } from "../hooks/useQueries";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { validateEmail } from "../lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PostCard } from "../components/PostCard";
import { Loader2, Edit2, Save, X, Lock, UserPlus, UserCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";

const STICKER_OPTIONS = [
  { id: "heart-eyes", src: "/assets/generated/sticker-heart-eyes-transparent.dim_100x100.png", label: "Heart Eyes" },
  { id: "cat-ears", src: "/assets/generated/sticker-cat-ears-transparent.dim_120x80.png", label: "Cat Ears" },
  { id: "hello-kitty", src: "/assets/generated/sticker-hello-kitty-bow-transparent.dim_100x80.png", label: "Hello Kitty" },
];

export function ProfilePage() {
  const { userId } = useParams({ from: "/profile/$userId" });
  const { identity } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useGetUserProfile(userId);
  const { data: posts = [], isLoading: postsLoading } = useGetPostsByUser(userId);
  const { data: friends = [] } = useGetFriends(userId);
  const saveProfile = useSaveCallerProfile();
  const sendFriendRequest = useSendFriendRequest();
  const unfriend = useUnfriend();

  const currentUserId = identity?.getPrincipal().toString();
  const { data: areFriends = false } = useAreFriends(currentUserId, userId);

  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [selectedStickers, setSelectedStickers] = useState<string[]>([]);

  const isOwnProfile = currentUserId === userId;
  const profileUserIsSiteOwner = profile?.email === "leasiayanna@gmail.com";

  const handleStartEdit = () => {
    if (!profile) return;
    setEditing(true);
    setEditBio(profile.bio);
    setEditEmail(profile.email || "");
    setEditIsPublic(profile.isProfilePublic);
    setSelectedStickers(profile.stickerIds || []);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    setBannerFile(null);
    setBannerPreview(null);
    setSelectedStickers([]);
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

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Banner must be less than 5MB");
        return;
      }
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    // Validate email if provided
    if (editEmail && !validateEmail(editEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      let avatarBlob: ExternalBlob | undefined = profile.avatar;
      let bannerBlob: ExternalBlob | undefined = profile.banner;

      if (avatarFile) {
        const arrayBuffer = await avatarFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        avatarBlob = ExternalBlob.fromBytes(uint8Array);
      }

      if (bannerFile) {
        const arrayBuffer = await bannerFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        bannerBlob = ExternalBlob.fromBytes(uint8Array);
      }

      await saveProfile.mutateAsync({
        ...profile,
        bio: editBio,
        email: editEmail,
        isProfilePublic: editIsPublic,
        avatar: avatarBlob,
        banner: bannerBlob,
        stickerIds: selectedStickers,
      });

      toast.success("Profile updated! ✨");
      setEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      setBannerFile(null);
      setBannerPreview(null);
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    }
  };

  const handleFriendAction = async () => {
    if (!userId) return;
    
    try {
      if (areFriends) {
        await unfriend.mutateAsync(userId);
        toast.success("Unfriended");
      } else {
        await sendFriendRequest.mutateAsync(userId);
        toast.success("Friend request sent! 🎉");
      }
    } catch (error) {
      toast.error("Action failed");
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
      <Card className="border-4 border-primary bg-card texture-grunge shadow-neon-strong animate-bounce-in overflow-hidden">
        {(profile.banner || bannerPreview || editing) && (
          <div className="relative h-48 bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
            {bannerPreview ? (
              <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover" />
            ) : profile.banner ? (
              <img src={profile.banner.getDirectURL()} alt="Profile banner" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30" />
            )}
            {editing && (
              <div className="absolute bottom-2 right-2">
                <Label htmlFor="banner-upload" className="cursor-pointer px-3 py-1 bg-primary text-primary-foreground rounded font-comic text-sm hover-shake">
                  Change Banner
                </Label>
                <Input
                  id="banner-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  className="hidden"
                />
              </div>
            )}
          </div>
        )}

        <CardHeader className={profile.banner || bannerPreview ? "-mt-10" : ""}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-card shadow-lg hover-shake">
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
                {profile.stickerIds && profile.stickerIds.length > 0 && (
                  <div className="absolute inset-0 pointer-events-none">
                    {profile.stickerIds.map((stickerId, index) => {
                      const sticker = STICKER_OPTIONS.find(s => s.id === stickerId);
                      if (!sticker) return null;
                      const positions = [
                        { top: "-8px", right: "-8px" },
                        { top: "-8px", left: "-8px" },
                        { bottom: "-8px", right: "-8px" },
                      ];
                      const position = positions[index % positions.length];
                      return (
                        <img
                          key={stickerId}
                          src={sticker.src}
                          alt={sticker.label}
                          className="absolute w-8 h-8 drop-shadow-lg animate-sparkle"
                          style={position}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-pixel text-2xl text-primary">{profile.username}</h1>
                  {profileUserIsSiteOwner && (
                    <Badge variant="outline" className="border-destructive text-destructive font-comic italic">
                      ✨ Site Owner ✨
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {!profile.isProfilePublic && (
                    <Badge variant="outline" className="font-comic">
                      🔒 Private
                    </Badge>
                  )}
                  <Badge variant="outline" className="font-comic">
                    <Users className="w-3 h-3 mr-1" />
                    {friends.length} Friend{friends.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {!isOwnProfile && currentUserId && (
                <Button 
                  onClick={handleFriendAction} 
                  disabled={sendFriendRequest.isPending || unfriend.isPending}
                  variant={areFriends ? "outline" : "default"}
                  className="font-comic hover-shake" 
                  size="sm"
                >
                  {areFriends ? (
                    <>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Friends ✓
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Friend
                    </>
                  )}
                </Button>
              )}
              
              {isOwnProfile && !editing && (
                <Button onClick={handleStartEdit} className="font-comic hover-shake" size="sm">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}

              {editing && (
                <>
                  <Button onClick={handleSaveProfile} disabled={saveProfile.isPending} size="sm" className="font-comic">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button onClick={handleCancelEdit} variant="outline" size="sm" className="font-comic">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="avatar" className="font-comic">
                  Change Avatar (GIF supported)
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
                <Label className="font-comic">Profile Stickers</Label>
                <ToggleGroup type="multiple" value={selectedStickers} onValueChange={setSelectedStickers} className="justify-start flex-wrap">
                  {STICKER_OPTIONS.map((sticker) => (
                    <ToggleGroupItem key={sticker.id} value={sticker.id} className="border-2 hover-shake">
                      <img src={sticker.src} alt={sticker.label} className="w-6 h-6 mr-1" />
                      {sticker.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
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

              <div className="space-y-2">
                <Label htmlFor="email" className="font-comic">
                  Email (Optional - for account recovery)
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="border-2 border-primary font-comic"
                />
                <p className="text-xs text-muted-foreground font-comic">
                  Used for account recovery if you lose access
                </p>
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
