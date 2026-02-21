import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, Calendar } from "lucide-react";
import { EmotionPicker } from "./EmotionPicker";
import { BodySensationPicker } from "./BodySensationPicker";
import { useState } from "react";
import { useGetCallerProfile, useSaveCallerProfile } from "../hooks/useQueries";
import { toast } from "sonner";

export function RightSidebar() {
  const { data: profile } = useGetCallerProfile();
  const saveProfile = useSaveCallerProfile();
  
  const [quickEmotion, setQuickEmotion] = useState("");
  const [quickSensation, setQuickSensation] = useState("");

  const handleUpdateMood = async () => {
    if (!profile || (!quickEmotion && !quickSensation)) return;

    try {
      await saveProfile.mutateAsync({
        ...profile,
        lastEmotion: quickEmotion || profile.lastEmotion,
        lastBodySensation: quickSensation || profile.lastBodySensation,
      });
      toast.success("Mood updated! ✨");
      setQuickEmotion("");
      setQuickSensation("");
    } catch (error) {
      toast.error("Failed to update mood");
      console.error(error);
    }
  };

  return (
    <aside className="hidden lg:block w-64 space-y-4">
      <Card className="border-2 border-primary bg-card texture-grunge">
        <CardHeader className="pb-3">
          <CardTitle className="font-pixel text-sm text-primary flex items-center gap-2">
            <Users className="w-4 h-4" />
            FRIENDS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-32">
            <p className="text-sm font-comic text-muted-foreground">
              Friends list coming soon! 👥
            </p>
          </ScrollArea>
        </CardContent>
      </Card>

      {profile && (
        <Card className="border-2 border-secondary bg-card texture-grunge">
          <CardHeader className="pb-3">
            <CardTitle className="font-pixel text-sm text-secondary flex items-center gap-2">
              <Heart className="w-4 h-4" />
              MOOD SELECTOR
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.lastEmotion && (
              <div>
                <p className="text-xs font-comic text-muted-foreground mb-1">Current mood:</p>
                <Badge variant="outline" className="font-comic">
                  💭 {profile.lastEmotion}
                </Badge>
              </div>
            )}
            {profile.lastBodySensation && (
              <div>
                <p className="text-xs font-comic text-muted-foreground mb-1">Body:</p>
                <Badge variant="outline" className="font-comic">
                  🫀 {profile.lastBodySensation}
                </Badge>
              </div>
            )}
            
            <EmotionPicker
              value={quickEmotion}
              onChange={setQuickEmotion}
              label="Update emotion"
            />
            <BodySensationPicker
              value={quickSensation}
              onChange={setQuickSensation}
              label="Update sensation"
            />
            
            <Button
              onClick={handleUpdateMood}
              disabled={saveProfile.isPending || (!quickEmotion && !quickSensation)}
              className="w-full font-comic hover-shake"
              size="sm"
            >
              Update Mood
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-2 border-accent bg-card texture-grunge">
        <CardHeader className="pb-3">
          <CardTitle className="font-pixel text-sm text-accent flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            ACTIVITY
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm font-comic text-muted-foreground">
            Activity calendar coming soon! 📅
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
