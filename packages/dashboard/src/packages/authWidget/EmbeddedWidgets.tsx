import { ComponentProps, FC, PropsWithChildren, useEffect } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import widgetI18n from "./i18n";
import { normalizeSystemLanguage } from "src/shared/utils/locales";
import {
  InfoWidget as InfoWidgetComponent,
  TrustedWidget as TrustedWidgetComponent,
} from "./components/Widget";

const EmbeddedWidgetI18nProvider: FC<PropsWithChildren> = ({ children }) => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const normalizedLocale = normalizeSystemLanguage(
      i18n.resolvedLanguage || i18n.language
    );
    const currentWidgetLocale = normalizeSystemLanguage(
      widgetI18n.resolvedLanguage || widgetI18n.language
    );

    if (currentWidgetLocale !== normalizedLocale) {
      void widgetI18n.changeLanguage(normalizedLocale);
    }
  }, [i18n.language, i18n.resolvedLanguage]);

  return <I18nextProvider i18n={widgetI18n}>{children}</I18nextProvider>;
};

export const TrustedWidget: FC<ComponentProps<typeof TrustedWidgetComponent>> =
  (props) => (
    <EmbeddedWidgetI18nProvider>
      <TrustedWidgetComponent {...props} />
    </EmbeddedWidgetI18nProvider>
  );

export const InfoWidget: FC<ComponentProps<typeof InfoWidgetComponent>> = (
  props
) => (
  <EmbeddedWidgetI18nProvider>
    <InfoWidgetComponent {...props} />
  </EmbeddedWidgetI18nProvider>
);
