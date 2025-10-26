import { Check, ChevronDown, Globe } from "lucide-react";
import { useState } from "react";
import { SUPPORTED_LANGUAGES } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function LanguageSelector({ value, onValueChange, disabled }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedLanguage = SUPPORTED_LANGUAGES.find((lang) => lang.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between hover-elevate active-elevate-2"
          data-testid="button-language-selector"
        >
          {selectedLanguage ? (
            <span className="flex items-center gap-2">
              <span className="text-lg">{selectedLanguage.flag}</span>
              <span>{selectedLanguage.name}</span>
            </span>
          ) : (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-4 w-4" />
              <span>Select language...</span>
            </span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search language..." data-testid="input-language-search" />
          <CommandList>
            <CommandEmpty>No language found.</CommandEmpty>
            <CommandGroup>
              {SUPPORTED_LANGUAGES.map((language) => (
                <CommandItem
                  key={language.code}
                  value={language.name}
                  onSelect={() => {
                    onValueChange(language.code);
                    setOpen(false);
                  }}
                  data-testid={`option-language-${language.code}`}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === language.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="mr-2 text-lg">{language.flag}</span>
                  <span>{language.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
