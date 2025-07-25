import { useState } from "react";
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown, Check } from "lucide-react";
import { LANGUAGES } from "@/lib/constants";
import { useI18n } from "@/contexts/i18n-context";
import { useLanguage } from "@/store/globalStore";

export function LanguageSelector() {
  const { language, setLanguage, t } = useI18n();
  const { setLanguage: setGlobalLanguage } = useLanguage();
  const [open, setOpen] = useState(false);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    setOpen(false);
  };

  const currentLang = LANGUAGES.find(lang => lang.code === language);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-40 justify-between"
        >
          <div className="flex items-center space-x-2">
            <img 
              src={currentLang?.flag} 
              alt={currentLang?.flagAlt} 
              className="w-4 h-3"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="text-sm">{currentLang?.name}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-0">
        <Command>
          <CommandInput placeholder="Search language..." />
          <CommandEmpty>No language found.</CommandEmpty>
          <CommandGroup>
            {LANGUAGES.map((lang) => (
              <CommandItem
                key={lang.code}
                value={lang.name}
                onSelect={() => handleLanguageChange(lang.code)}
              >
                <div className="flex items-center space-x-2 flex-1">
                  <img 
                    src={lang.flag} 
                    alt={lang.flagAlt} 
                    className="w-4 h-3"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <span>{lang.name}</span>
                </div>
                {language === lang.code && (
                  <Check className="ml-auto h-4 w-4" />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
