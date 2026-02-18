import ListItem from "@mui/material/ListItem";
import { FC } from "react";
import { IEmailTemplate } from "src/shared/api/settings";
import styles from "./EmailTemplate.module.css";
import { Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { componentBorderRadius } from "src/shared/theme/Theme";

type EmailTemplateProps = {
  template: IEmailTemplate;
  onClick: () => void;
};

export const EmailTemplate: FC<EmailTemplateProps> = ({
  template: { title, action } = {},
  onClick,
}) => {
  const { t: translate } = useTranslation();

  return (
    <ListItem
      data-id="email-template-item"
      className={styles.listItem}
      onClick={onClick}
      sx={{ borderRadius: componentBorderRadius }}
    >
      <div className={styles.container}>
        <div className={styles.head}>
          <Typography className="text-14">{title}</Typography>
          <Typography className="text-12" color="text.secondary">
            {action}
          </Typography>
        </div>
        <Button variant="text" onClick={onClick}>
          {translate("actionButtons.configure")}
        </Button>
      </div>
    </ListItem>
  );
};
