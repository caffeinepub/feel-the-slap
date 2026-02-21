import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { EmotionPicker } from "./EmotionPicker";
import { BodySensationPicker } from "./BodySensationPicker";
import { useCreatePost, useGetCallerProfile } from "../hooks/useQueries";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { isOver18 } from "../lib/auth";
import { Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";

interface CreatePostFormProps {
  defaultIs18Plus?: boolean;
}

export function CreatePostForm({ defaultIs18Plus = false }: CreatePostFormProps) {
  const { identity } = useInternetIdentity();
  const { data: profile } = useGetCallerProfile();
  const createPost = useCreatePost();

  const [content, setContent] = useState("");
  const [emotion, setEmotion] = useState("");
  const [bodySensation, setBodySensation] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [is18Plus, setIs18Plus] = useState(defaultIs18Plus);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const userIsOver18 = profile ? isOver18(new Date(Number(profile.dateOfBirth) / 1_000_000)) : false;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Post content cannot be empty!");
      return;
    }

    if (!emotion) {
      toast.error("Please select an emotion");
      return;
    }

    if (!bodySensation) {
      toast.error("Please select a body sensation");
      return;
    }

    if (!identity) {
      toast.error("Please login to post");
      return;
    }

    if (is18Plus && !userIsOver18) {
      toast.error("You must be 18+ to create 18+ content");
      return;
    }

    try {
      let imageBlob: ExternalBlob | undefined;
      
      if (imageFile) {
        const arrayBuffer = await imageFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        imageBlob = ExternalBlob.fromBytes(uint8Array);
      }

      await createPost.mutateAsync({
        content,
        emotion,
        bodySensation,
        isAnonymous,
        is18Plus,
        userId: identity.getPrincipal().toString(),
        imageUrl: imageBlob,
      });

      // Reset form
      setContent("");
      setEmotion("");
      setBodySensation("");
      setIsAnonymous(false);
      setIs18Plus(defaultIs18Plus);
      setImageFile(null);
      setImagePreview(null);

      toast.success("Post created! 🎉");
    } catch (error) {
      toast.error("Failed to create post");
      console.error(error);
    }
  };

  return (
    <Card className="border-4 border-primary bg-card texture-grunge shadow-neon-strong">
      <CardHeader>
        <CardTitle className="font-pixel text-lg text-primary">
          ✨ CREATE A NEW SLAP ✨
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="What's on your mind? Spill it!"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[120px] border-2 border-primary font-comic resize-none"
        />

        {imagePreview && (
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="rounded border-2 border-accent max-h-64 object-contain"
            />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => {
                setImageFile(null);
                setImagePreview(null);
              }}
            >
              Remove
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <Label
            htmlFor="image-upload"
            className="cursor-pointer flex items-center gap-2 px-4 py-2 border-2 border-accent rounded hover:bg-accent hover:text-accent-foreground transition-colors font-comic hover-shake"
          >
            <ImageIcon className="w-4 h-4" />
            Add Image
          </Label>
          <Input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <EmotionPicker value={emotion} onChange={setEmotion} />
          <BodySensationPicker value={bodySensation} onChange={setBodySensation} />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
              className="border-2"
            />
            <Label htmlFor="anonymous" className="font-comic cursor-pointer">
              Post anonymously
            </Label>
          </div>

          {userIsOver18 && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="18plus"
                checked={is18Plus}
                onCheckedChange={(checked) => setIs18Plus(checked as boolean)}
                className="border-2"
              />
              <Label htmlFor="18plus" className="font-comic cursor-pointer">
                18+ Content
              </Label>
            </div>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={createPost.isPending}
          className="w-full font-comic text-lg py-6 hover-shake shadow-neon"
        >
          {createPost.isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Posting...
            </>
          ) : (
            "🚀 POST IT!"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
