
import { LANGUAGES } from "./constants";
import { translations_es } from "@/contexts/i18n-es";
import { translations_en } from "@/contexts/i18n-en";
import { translations_de } from "@/contexts/i18n-de";
import { translations_eu } from "@/contexts/i18n-eu";
import { translations_fr } from "@/contexts/i18n-fr";
import { translations_ja } from "@/contexts/i18n-ja";
import { translations_ca } from "@/contexts/i18n-ca";
import { translations_gl } from "@/contexts/i18n-gl";
import { translations_val } from "@/contexts/i18n-val";
import { translations_zh } from "@/contexts/i18n-zh";

export interface Translations {
  [key: string]: string;
}

export const translations: Record<string, Translations> = {
  es: translations_es,
  en: translations_en,
  de: translations_de,
  eu: translations_eu,
  fr: translations_fr,
  ja: translations_ja,
  ca: translations_ca,
  gl: translations_gl,
  val: translations_val,
  zh: translations_zh,
};

export class I18n {
  private currentLanguage: string = "es";

  constructor() {
    // Try to get language from localStorage or use default
    if (typeof localStorage !== 'undefined') {
      const savedLang = localStorage.getItem("preferred-language");
      if (savedLang && LANGUAGES.some(l => l.code === savedLang)) {
        this.currentLanguage = savedLang;
      }
    }
  }

  setLanguage(language: string): void {
    if (LANGUAGES.some(l => l.code === language)) {
      this.currentLanguage = language;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem("preferred-language", language);
      }
    }
  }

  getLanguage(): string {
    return this.currentLanguage;
  }

  t(key: string): string {
    return translations[this.currentLanguage]?.[key] || key;
  }
}

export const i18n = new I18n();
