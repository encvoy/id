import pkg from "../../../package.json";
import Typography from "@mui/material/Typography";
import styles from "./Footer.module.css";
import { useTranslation } from "react-i18next";
import { useGetSettingsQuery } from "src/shared/api/settings";
import { getLocalizedTextValue } from "src/shared/utils/locales";
import { withAppPublicUrl } from "src/shared/utils/appBasePath";

export const Footer = () => {
  const { t: translate, i18n } = useTranslation();
  const {
    data: dataSettings,
    isLoading,
    isFetching,
  } = useGetSettingsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const defaultManualUrl = withAppPublicUrl("/docs/id/");
  const copyright = dataSettings?.copyright
    ? getLocalizedTextValue(dataSettings.copyright, i18n.language)
    : "";
  const manualUrl = dataSettings?.manual_url || defaultManualUrl;

  if (isLoading || isFetching) {
    return null;
  }

  return (
    <div className={styles.footer}>
      <div className={styles.footerContainer}>
        <Typography className="text-12">
          <a
            href={"https://encvoy.es/en/"}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            v{pkg.version}
          </a>
        </Typography>
        <Typography color="text.secondary" className="text-12">
          |
        </Typography>
        <Typography color="text.secondary" className="text-12">
          {copyright}
        </Typography>
        <Typography color="text.secondary" className="text-12">
          |
        </Typography>
        <Typography color="text.secondary" className="text-12">
          <a
            href={manualUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            {translate("helperText.help")}
          </a>
        </Typography>
      </div>
    </div>
  );
};
