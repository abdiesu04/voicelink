import { User, UserRound } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { VoiceGender } from "@shared/schema";

interface VoiceGenderSelectorProps {
  value: VoiceGender | undefined;
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
      value={value || ""}
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
            : "border-slate-300 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800/30 hover-elevate",
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
        <Avatar className={cn(
          "h-14 w-14 ring-2",
          value === "male"
            ? "bg-primary/10 ring-primary/30"
            : "bg-slate-200/50 dark:bg-slate-700/30 ring-slate-300 dark:ring-slate-600/30"
        )}>
          <AvatarFallback className={cn(
            "bg-transparent",
            value === "male" ? "text-primary" : "text-slate-500 dark:text-slate-400"
          )}>
            <User className="h-7 w-7" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Label
            htmlFor="male"
            className={cn(
              "text-base font-semibold cursor-pointer",
              value === "male" ? "text-foreground" : "text-slate-600 dark:text-slate-300"
            )}
          >
            Male
          </Label>
          <p className={cn(
            "text-sm mt-0.5",
            value === "male" ? "text-muted-foreground" : "text-slate-500 dark:text-slate-500"
          )}>
            I am male
          </p>
        </div>
      </div>

      <div
        className={cn(
          "relative flex cursor-pointer items-center gap-3 rounded-xl border-2 p-6 transition-all",
          value === "female"
            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
            : "border-slate-300 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800/30 hover-elevate",
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
        <Avatar className={cn(
          "h-14 w-14 ring-2",
          value === "female"
            ? "bg-primary/10 ring-primary/30"
            : "bg-slate-200/50 dark:bg-slate-700/30 ring-slate-300 dark:ring-slate-600/30"
        )}>
          <AvatarFallback className={cn(
            "bg-transparent",
            value === "female" ? "text-primary" : "text-slate-500 dark:text-slate-400"
          )}>
            <UserRound className="h-7 w-7" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Label
            htmlFor="female"
            className={cn(
              "text-base font-semibold cursor-pointer",
              value === "female" ? "text-foreground" : "text-slate-600 dark:text-slate-300"
            )}
          >
            Female
          </Label>
          <p className={cn(
            "text-sm mt-0.5",
            value === "female" ? "text-muted-foreground" : "text-slate-500 dark:text-slate-500"
          )}>
            I am female
          </p>
        </div>
      </div>
    </RadioGroup>
  );
}
