import pkg from "../../../package.json";
import { COPYRIGHT, MANUAL_URL } from "src/shared/utils/constants";
import Typography from "@mui/material/Typography";
import styles from "./Footer.module.css";
import { useTranslation } from "react-i18next";

export const Footer = () => {
  const { t: translate, i18n } = useTranslation();

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
          {COPYRIGHT[i18n.language]}
        </Typography>
        <Typography color="text.secondary" className="text-12">
          |
        </Typography>
        <Typography color="text.secondary" className="text-12">
          <a
            href={MANUAL_URL ? MANUAL_URL : window.location.origin + "/docs"}
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
