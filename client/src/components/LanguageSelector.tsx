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

// Group languages by their language family for better organization
// Languages with variants will be grouped together (e.g., all English variants)
const getLanguageGroups = () => {
  const grouped: Record<string, typeof SUPPORTED_LANGUAGES[number][]> = {};
  const ungrouped: typeof SUPPORTED_LANGUAGES[number][] = [];
  
  SUPPORTED_LANGUAGES.forEach((lang) => {
    if ('group' in lang && lang.group) {
      if (!grouped[lang.group]) {
        grouped[lang.group] = [];
      }
      grouped[lang.group].push(lang);
    } else {
      ungrouped.push(lang);
    }
  });
  
  return { grouped, ungrouped };
};

export function LanguageSelector({ value, onValueChange, disabled }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedLanguage = SUPPORTED_LANGUAGES.find((lang) => lang.code === value);

  // Organize languages by group (for variants) and search
  const languagesByGroup = useMemo(() => {
    const filtered = SUPPORTED_LANGUAGES.filter(lang => 
      lang.name.toLowerCase().includes(search.toLowerCase())
    );

    if (search) {
      // If searching, show all matching results in one list
      return { searchResults: filtered, grouped: {}, ungrouped: [] };
    }

    // Group filtered languages by their language family
    const grouped: Record<string, typeof SUPPORTED_LANGUAGES[number][]> = {};
    const ungrouped: typeof SUPPORTED_LANGUAGES[number][] = [];
    
    filtered.forEach((lang) => {
      if ('group' in lang && lang.group) {
        if (!grouped[lang.group]) {
          grouped[lang.group] = [];
        }
        grouped[lang.group].push(lang);
      } else {
        ungrouped.push(lang);
      }
    });

    return { searchResults: [], grouped, ungrouped };
  }, [search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between h-12 px-4 hover-elevate active-elevate-2 border-border/50 text-slate-900 dark:text-white"
          data-testid="button-language-selector"
        >
          {selectedLanguage ? (
            <span className="flex items-center gap-3">
              <CountryFlag countryCode={selectedLanguage.countryCode} />
              <span className="font-medium">{selectedLanguage.name}</span>
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
              placeholder="Search 95 languages..." 
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
                {languagesByGroup.searchResults?.map((language) => (
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
                      value === language.code && "bg-primary/20 dark:bg-primary/30"
                    )}
                    data-testid={`option-language-${language.code}`}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 flex-shrink-0 text-primary",
                        value === language.code ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <CountryFlag countryCode={language.countryCode} />
                    <span className={cn(
                      "font-medium",
                      value === language.code ? "text-slate-900 dark:text-white font-semibold" : "text-foreground"
                    )}>
                      {language.name}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              // Show grouped languages when not searching
              <>
                {/* Language groups with variants (English, Spanish, Arabic, etc.) */}
                {Object.entries(languagesByGroup.grouped).map(([groupName, languages], groupIndex) => (
                  <div key={groupName}>
                    {groupIndex > 0 && <Separator className="my-2" />}
                    <CommandGroup heading={`${groupName} (${languages.length})`} className="p-2">
                      {languages.map((language) => (
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
                            value === language.code && "bg-primary/20 dark:bg-primary/30"
                          )}
                          data-testid={`option-language-${language.code}`}
                        >
                          <Check
                            className={cn(
                              "h-4 w-4 flex-shrink-0 text-primary",
                              value === language.code ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <CountryFlag countryCode={language.countryCode} />
                          <span className={cn(
                            "font-medium text-sm",
                            value === language.code ? "text-slate-900 dark:text-white font-semibold" : "text-foreground"
                          )}>
                            {language.name}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </div>
                ))}

                {/* Other languages without variants */}
                {languagesByGroup.ungrouped.length > 0 && (
                  <>
                    {Object.keys(languagesByGroup.grouped).length > 0 && <Separator className="my-2" />}
                    <CommandGroup heading={`Other Languages (${languagesByGroup.ungrouped.length})`} className="p-2">
                      {languagesByGroup.ungrouped.map((language) => (
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
                            value === language.code && "bg-primary/20 dark:bg-primary/30"
                          )}
                          data-testid={`option-language-${language.code}`}
                        >
                          <Check
                            className={cn(
                              "h-4 w-4 flex-shrink-0 text-primary",
                              value === language.code ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <CountryFlag countryCode={language.countryCode} />
                          <span className={cn(
                            "font-medium text-sm",
                            value === language.code ? "text-slate-900 dark:text-white font-semibold" : "text-foreground"
                          )}>
                            {language.name}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
