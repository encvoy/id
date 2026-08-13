import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import ru from "./ru.json";
import es from "./es.json";
import fr from "./fr.json";
import de from "./de.json";
import it from "./it.json";
import trustedWidgetEn from "../packages/authWidget/locales/en.json";
import trustedWidgetRu from "../packages/authWidget/locales/ru.json";
import trustedWidgetEs from "../packages/authWidget/locales/es.json";
import trustedWidgetFr from "../packages/authWidget/locales/fr.json";
import trustedWidgetDe from "../packages/authWidget/locales/de.json";
import trustedWidgetIt from "../packages/authWidget/locales/it.json";
import {
  DEFAULT_SYSTEM_LANGUAGE,
  normalizeSystemLanguage,
  SYSTEM_LANGUAGE_CODES,
} from "src/shared/utils/locales";

const initialLanguage = normalizeSystemLanguage(
  typeof window !== "undefined" ? window.localStorage.getItem("locale") : null
);

i18n.use(initReactI18next).init({
  resources: {
    "en-US": {
      translation: en,
      "trusted-widget": trustedWidgetEn,
    },
    "ru-RU": {
      translation: ru,
      "trusted-widget": trustedWidgetRu,
    },
    "es-ES": {
      translation: es,
      "trusted-widget": trustedWidgetEs,
    },
    "fr-FR": {
      translation: fr,
      "trusted-widget": trustedWidgetFr,
    },
    "de-DE": {
      translation: de,
      "trusted-widget": trustedWidgetDe,
    },
    "it-IT": {
      translation: it,
      "trusted-widget": trustedWidgetIt,
    },
  },
  lng: initialLanguage,
  fallbackLng: DEFAULT_SYSTEM_LANGUAGE,
  supportedLngs: [...SYSTEM_LANGUAGE_CODES],
  react: {
    useSuspense: false,
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
