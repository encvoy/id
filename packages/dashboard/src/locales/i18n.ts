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
  //debug: true,
  lng: localStorage.getItem("locale") || "en-US",
});

export default i18n;
