'use client';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from '../locales/en.json';
import ru from '../locales/ru.json';
import de from '../locales/de.json';
import fr from '../locales/fr.json';
import es from '../locales/es.json';
import it from '../locales/it.json';
import i18next from 'i18next';
import { WIDGET } from './constant';

const resources = {
  'en-US': { translation: en },
  'ru-RU': { translation: ru },
  'de-DE': { translation: de },
  'fr-FR': { translation: fr },
  'es-ES': { translation: es },
  'it-IT': { translation: it },
};

const langMap: { [key: string]: string } = {
  en: 'en-US',
  ru: 'ru-RU',
  de: 'de-DE',
  fr: 'fr-FR',
  es: 'es-ES',
  it: 'it-IT',
};

const widgetLang = WIDGET?.LANG ? langMap[WIDGET.LANG] || WIDGET.LANG : undefined;
const savedLang = typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : null;
const initialLng = savedLang || widgetLang || 'en-US';

i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    resources,
    lng: initialLng,
    fallbackLng: widgetLang || 'en-US',
    supportedLngs: ['en-US', 'ru-RU', 'de-DE', 'fr-FR', 'es-ES', 'it-IT'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    react: { useSuspense: false },
  });

export default i18next;
