import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { LANGUAGES } from "@/lib/constants";
import { i18n } from "@/lib/i18n";

export function LanguageSelector() {
  const [currentLanguage, setCurrentLanguage] = useState(i18n.getLanguage());

  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language);
    i18n.setLanguage(language);
    // Force re-render of the entire app
    window.location.reload();
  };

  const currentLang = LANGUAGES.find(lang => lang.code === currentLanguage);

  return (
    <Select value={currentLanguage} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-40">
        <SelectValue>
          <div className="flex items-center space-x-2">
            <span>{currentLang?.flag}</span>
            <span className="text-sm">{currentLang?.name}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((language) => (
          <SelectItem key={language.code} value={language.code}>
            <div className="flex items-center space-x-2">
              <span>{language.flag}</span>
              <span>{language.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
