import { Check, ChevronDown, Languages } from "lucide-react";
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

function CountryFlag({ countryCode }: { countryCode: string }) {
  return (
    <img 
      src={`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/w80/${countryCode.toLowerCase()}.png 2x`}
      width="28"
      height="21"
      alt={countryCode}
      className="rounded border border-border/30 flex-shrink-0"
      loading="lazy"
    />
  );
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
          className="w-full justify-between h-12 px-4 hover-elevate active-elevate-2 border-border/50 text-white"
          data-testid="button-language-selector"
        >
          {selectedLanguage ? (
            <span className="flex items-center gap-3 text-white">
              <CountryFlag countryCode={selectedLanguage.countryCode} />
              <span className="font-medium text-white">{selectedLanguage.name}</span>
            </span>
          ) : (
            <span className="flex items-center gap-3 text-muted-foreground">
              <Languages className="h-5 w-5" />
              <span>Select language...</span>
            </span>
          )}
          <ChevronDown className={cn(
            "ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform duration-200",
            open && "rotate-180"
          )} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 border-border/50 shadow-xl" align="start">
        <Command className="rounded-xl">
          <CommandInput 
            placeholder="Search language..." 
            className="h-12 text-base" 
            data-testid="input-language-search" 
          />
          <CommandList>
            <CommandEmpty className="py-8 text-center">
              <Languages className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No language found.</p>
            </CommandEmpty>
            <CommandGroup className="p-2">
              {SUPPORTED_LANGUAGES.map((language) => (
                <CommandItem
                  key={language.code}
                  value={language.name}
                  onSelect={() => {
                    onValueChange(language.code);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer",
                    "hover-elevate transition-colors",
                    value === language.code && "bg-primary"
                  )}
                  data-testid={`option-language-${language.code}`}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 flex-shrink-0",
                      value === language.code ? "opacity-100 text-white" : "opacity-0 text-primary"
                    )}
                  />
                  <CountryFlag countryCode={language.countryCode} />
                  <span className={cn(
                    "font-medium",
                    value === language.code ? "text-white" : "text-foreground"
                  )}>
                    {language.name}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
