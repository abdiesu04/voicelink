import { Check, ChevronDown, Languages, Globe2 } from "lucide-react";
import { useState, useMemo } from "react";
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
import { Separator } from "@/components/ui/separator";

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

// Group languages by region for better organization
const LANGUAGE_GROUPS = {
  popular: ["en", "es", "fr", "de", "zh", "ja", "ar", "hi", "pt", "ru"],
  europe: ["en", "es", "fr", "de", "it", "pt", "pt-br", "ru", "nl", "pl", "tr", "sv", "nb", "da", "fi", "el", "cs", "ro", "uk", "hu", "bg", "hr", "sk", "sl", "ca", "sr", "et", "lv"],
  asia: ["zh", "ja", "ko", "hi", "vi", "th", "id", "bn", "ta", "te", "mr", "gu", "kn", "ml", "ms"],
  middleEast: ["ar", "he"],
  africa: ["af", "sw"],
};

export function LanguageSelector({ value, onValueChange, disabled }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedLanguage = SUPPORTED_LANGUAGES.find((lang) => lang.code === value);

  // Organize languages by region
  const languagesByRegion = useMemo(() => {
    const filtered = SUPPORTED_LANGUAGES.filter(lang => 
      lang.name.toLowerCase().includes(search.toLowerCase())
    );

    if (search) {
      // If searching, show all matching results in one list
      return { all: filtered };
    }

    // Group by regions when not searching
    return {
      popular: filtered.filter(lang => LANGUAGE_GROUPS.popular.includes(lang.code)),
      europe: filtered.filter(lang => LANGUAGE_GROUPS.europe.includes(lang.code)),
      asia: filtered.filter(lang => LANGUAGE_GROUPS.asia.includes(lang.code)),
      middleEast: filtered.filter(lang => LANGUAGE_GROUPS.middleEast.includes(lang.code)),
      africa: filtered.filter(lang => LANGUAGE_GROUPS.africa.includes(lang.code)),
    };
  }, [search]);

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
        <Command className="rounded-xl" shouldFilter={false}>
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 bg-muted/30">
            <Globe2 className="h-4 w-4 text-muted-foreground" />
            <CommandInput 
              placeholder="Search 47 languages..." 
              className="h-10 text-base border-0 focus:ring-0" 
              data-testid="input-language-search"
              value={search}
              onValueChange={setSearch}
            />
          </div>
          <CommandList className="max-h-[400px]">
            <CommandEmpty className="py-8 text-center">
              <Languages className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No language found.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Try a different search term</p>
            </CommandEmpty>
            
            {search ? (
              // Show all results when searching
              <CommandGroup className="p-2">
                {languagesByRegion.all?.map((language) => (
                  <CommandItem
                    key={language.code}
                    value={language.name}
                    onSelect={() => {
                      onValueChange(language.code);
                      setOpen(false);
                      setSearch("");
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
                        value === language.code ? "opacity-100 text-white" : "opacity-0"
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
            ) : (
              // Show organized groups when not searching
              <>
                {/* Popular Languages */}
                {languagesByRegion.popular && languagesByRegion.popular.length > 0 && (
                  <CommandGroup heading="Popular" className="p-2">
                    {languagesByRegion.popular.map((language) => (
                      <CommandItem
                        key={language.code}
                        value={language.name}
                        onSelect={() => {
                          onValueChange(language.code);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer",
                          "hover-elevate transition-colors",
                          value === language.code && "bg-primary"
                        )}
                        data-testid={`option-language-${language.code}`}
                      >
                        <Check
                          className={cn(
                            "h-4 w-4 flex-shrink-0",
                            value === language.code ? "opacity-100 text-white" : "opacity-0"
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
                )}

                <Separator className="my-2" />

                {/* Europe */}
                {languagesByRegion.europe && languagesByRegion.europe.length > 0 && (
                  <CommandGroup heading="Europe" className="p-2">
                    {languagesByRegion.europe.map((language) => (
                      <CommandItem
                        key={language.code}
                        value={language.name}
                        onSelect={() => {
                          onValueChange(language.code);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer",
                          "hover-elevate transition-colors",
                          value === language.code && "bg-primary"
                        )}
                        data-testid={`option-language-${language.code}`}
                      >
                        <Check
                          className={cn(
                            "h-4 w-4 flex-shrink-0",
                            value === language.code ? "opacity-100 text-white" : "opacity-0"
                          )}
                        />
                        <CountryFlag countryCode={language.countryCode} />
                        <span className={cn(
                          "font-medium text-sm",
                          value === language.code ? "text-white" : "text-foreground"
                        )}>
                          {language.name}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Asia */}
                {languagesByRegion.asia && languagesByRegion.asia.length > 0 && (
                  <CommandGroup heading="Asia" className="p-2">
                    {languagesByRegion.asia.map((language) => (
                      <CommandItem
                        key={language.code}
                        value={language.name}
                        onSelect={() => {
                          onValueChange(language.code);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer",
                          "hover-elevate transition-colors",
                          value === language.code && "bg-primary"
                        )}
                        data-testid={`option-language-${language.code}`}
                      >
                        <Check
                          className={cn(
                            "h-4 w-4 flex-shrink-0",
                            value === language.code ? "opacity-100 text-white" : "opacity-0"
                          )}
                        />
                        <CountryFlag countryCode={language.countryCode} />
                        <span className={cn(
                          "font-medium text-sm",
                          value === language.code ? "text-white" : "text-foreground"
                        )}>
                          {language.name}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Middle East */}
                {languagesByRegion.middleEast && languagesByRegion.middleEast.length > 0 && (
                  <CommandGroup heading="Middle East" className="p-2">
                    {languagesByRegion.middleEast.map((language) => (
                      <CommandItem
                        key={language.code}
                        value={language.name}
                        onSelect={() => {
                          onValueChange(language.code);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer",
                          "hover-elevate transition-colors",
                          value === language.code && "bg-primary"
                        )}
                        data-testid={`option-language-${language.code}`}
                      >
                        <Check
                          className={cn(
                            "h-4 w-4 flex-shrink-0",
                            value === language.code ? "opacity-100 text-white" : "opacity-0"
                          )}
                        />
                        <CountryFlag countryCode={language.countryCode} />
                        <span className={cn(
                          "font-medium text-sm",
                          value === language.code ? "text-white" : "text-foreground"
                        )}>
                          {language.name}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Africa */}
                {languagesByRegion.africa && languagesByRegion.africa.length > 0 && (
                  <CommandGroup heading="Africa" className="p-2">
                    {languagesByRegion.africa.map((language) => (
                      <CommandItem
                        key={language.code}
                        value={language.name}
                        onSelect={() => {
                          onValueChange(language.code);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer",
                          "hover-elevate transition-colors",
                          value === language.code && "bg-primary"
                        )}
                        data-testid={`option-language-${language.code}`}
                      >
                        <Check
                          className={cn(
                            "h-4 w-4 flex-shrink-0",
                            value === language.code ? "opacity-100 text-white" : "opacity-0"
                          )}
                        />
                        <CountryFlag countryCode={language.countryCode} />
                        <span className={cn(
                          "font-medium text-sm",
                          value === language.code ? "text-white" : "text-foreground"
                        )}>
                          {language.name}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
