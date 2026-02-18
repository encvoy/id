import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ru from "./locales/ru.json";

i18n.use(initReactI18next).init({
  resources: {
    "en-US": {
      "trusted-widget": en,
    },
    "ru-RU": {
      "trusted-widget": ru,
    },
  },
  lng: localStorage.getItem("locale") || "ru-RU",
});

export default i18n;
