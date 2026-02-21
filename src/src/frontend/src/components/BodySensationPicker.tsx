import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BODY_SENSATIONS } from "../lib/emotions";
import { Label } from "@/components/ui/label";

interface BodySensationPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function BodySensationPicker({
  value,
  onChange,
  label = "What are you feeling in your body?",
}: BodySensationPickerProps) {
  return (
    <div className="space-y-2">
      {label && (
        <Label className="font-comic text-sm">
          {label}
        </Label>
      )}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="border-2 border-secondary font-comic">
          <SelectValue placeholder="Select a body sensation..." />
        </SelectTrigger>
        <SelectContent className="max-h-[300px] overflow-y-auto">
          {BODY_SENSATIONS.map((sensation) => (
            <SelectItem
              key={sensation}
              value={sensation}
              className="font-comic cursor-pointer hover:bg-accent"
            >
              {sensation}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
