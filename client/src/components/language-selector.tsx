import React from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/contexts/i18n-context';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useI18n();

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
  ];

  return (
    <div className="flex space-x-1">
      {languages.map((lang) => (
        <Button
          key={lang.code}
          variant={language === lang.code ? 'default' : 'outline'}
          size="sm"
          onClick={() => setLanguage(lang.code)}
          className="text-xs"
        >
          <span className="mr-1">{lang.flag}</span>
          {lang.code.toUpperCase()}
        </Button>
      ))}
    </div>
  );
};