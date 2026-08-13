import { createInstance } from "i18next";
import en from "./locales/en.json";
import ru from "./locales/ru.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import de from "./locales/de.json";
import it from "./locales/it.json";
import {
  DEFAULT_SYSTEM_LANGUAGE,
  SYSTEM_LANGUAGE_CODES,
} from "src/shared/utils/locales";

const widgetI18n = createInstance();

void widgetI18n.init({
  resources: {
    "en-US": {
      "trusted-widget": en,
    },
    "ru-RU": {
      "trusted-widget": ru,
    },
    "es-ES": {
      "trusted-widget": es,
    },
    "fr-FR": {
      "trusted-widget": fr,
    },
    "de-DE": {
      "trusted-widget": de,
    },
    "it-IT": {
      "trusted-widget": it,
    },
  },
  lng: DEFAULT_SYSTEM_LANGUAGE,
  defaultNS: "trusted-widget",
  fallbackLng: DEFAULT_SYSTEM_LANGUAGE,
  supportedLngs: [...SYSTEM_LANGUAGE_CODES],
  react: {
    useSuspense: false,
  },
  interpolation: {
    escapeValue: false,
  },
});

export default widgetI18n;
