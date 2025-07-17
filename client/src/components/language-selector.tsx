import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { LANGUAGES } from "@/lib/constants";
import { useI18n } from "@/contexts/i18n-context";

export function LanguageSelector() {
  const { language, setLanguage } = useI18n();

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
  };

  const currentLang = LANGUAGES.find(lang => lang.code === language);

  return (
    <Select value={language} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-40">
        <SelectValue>
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
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((language) => (
          <SelectItem key={language.code} value={language.code}>
            <div className="flex items-center space-x-2">
              <img 
                src={language.flag} 
                alt={language.flagAlt} 
                className="w-4 h-3"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span>{language.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
