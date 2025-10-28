import { User, UserRound } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { VoiceGender } from "@shared/schema";

interface VoiceGenderSelectorProps {
  value: VoiceGender;
  onValueChange: (value: VoiceGender) => void;
  disabled?: boolean;
}

export function VoiceGenderSelector({
  value,
  onValueChange,
  disabled = false,
}: VoiceGenderSelectorProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      className="grid grid-cols-2 gap-4"
      data-testid="voice-gender-selector"
    >
      <div
        className={cn(
          "relative flex cursor-pointer items-center gap-3 rounded-xl border-2 p-6 transition-all",
          value === "male"
            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
            : "border-slate-700 bg-slate-800/30 hover-elevate",
          disabled && "cursor-not-allowed opacity-50"
        )}
        onClick={() => !disabled && onValueChange("male")}
        data-testid="voice-gender-male"
      >
        <RadioGroupItem
          value="male"
          id="male"
          className="sr-only"
        />
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl ring-2",
          value === "male"
            ? "bg-primary/10 ring-primary/30"
            : "bg-slate-700/30 ring-slate-600/30"
        )}>
          <User className={cn(
            "h-6 w-6",
            value === "male" ? "text-primary" : "text-slate-400"
          )} />
        </div>
        <div className="flex-1">
          <Label
            htmlFor="male"
            className={cn(
              "text-base font-semibold cursor-pointer",
              value === "male" ? "text-white" : "text-slate-300"
            )}
          >
            Male Voice
          </Label>
          <p className={cn(
            "text-sm mt-0.5",
            value === "male" ? "text-slate-300" : "text-slate-500"
          )}>
            Masculine tone
          </p>
        </div>
      </div>

      <div
        className={cn(
          "relative flex cursor-pointer items-center gap-3 rounded-xl border-2 p-6 transition-all",
          value === "female"
            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
            : "border-slate-700 bg-slate-800/30 hover-elevate",
          disabled && "cursor-not-allowed opacity-50"
        )}
        onClick={() => !disabled && onValueChange("female")}
        data-testid="voice-gender-female"
      >
        <RadioGroupItem
          value="female"
          id="female"
          className="sr-only"
        />
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl ring-2",
          value === "female"
            ? "bg-primary/10 ring-primary/30"
            : "bg-slate-700/30 ring-slate-600/30"
        )}>
          <UserRound className={cn(
            "h-6 w-6",
            value === "female" ? "text-primary" : "text-slate-400"
          )} />
        </div>
        <div className="flex-1">
          <Label
            htmlFor="female"
            className={cn(
              "text-base font-semibold cursor-pointer",
              value === "female" ? "text-white" : "text-slate-300"
            )}
          >
            Female Voice
          </Label>
          <p className={cn(
            "text-sm mt-0.5",
            value === "female" ? "text-slate-300" : "text-slate-500"
          )}>
            Feminine tone
          </p>
        </div>
      </div>
    </RadioGroup>
  );
}
