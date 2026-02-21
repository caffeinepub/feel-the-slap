import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EMOTION_CATEGORIES } from "../lib/emotions";
import { Label } from "@/components/ui/label";

interface EmotionPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function EmotionPicker({ value, onChange, label = "How are you feeling?" }: EmotionPickerProps) {
  return (
    <div className="space-y-2">
      {label && (
        <Label className="font-comic text-sm">
          {label}
        </Label>
      )}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="border-2 border-primary font-comic">
          <SelectValue placeholder="Select an emotion..." />
        </SelectTrigger>
        <SelectContent className="max-h-[300px] overflow-y-auto">
          {Object.entries(EMOTION_CATEGORIES).map(([category, emotions]) => (
            <div key={category} className="py-2">
              <div className="px-2 pb-1 font-pixel text-xs text-primary uppercase">
                {category}
              </div>
              {emotions.map((emotion) => (
                <SelectItem
                  key={emotion}
                  value={emotion}
                  className="font-comic cursor-pointer hover:bg-accent"
                >
                  {emotion}
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
