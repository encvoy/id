import ListItem from "@mui/material/ListItem";
import { FC } from "react";
import { IEmailTemplate } from "src/shared/api/provider";
import styles from "./EmailTemplate.module.css";
import clsx from "clsx";
import { Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { SurfaceBlock } from "@encvoy-id/components";

type EmailTemplateProps = {
  template: IEmailTemplate;
  onClick: () => void;
  configureDataTestId?: string;
  selected?: boolean;
};

export const EmailTemplate: FC<EmailTemplateProps> = ({
  template: { title, action } = {},
  onClick,
  configureDataTestId,
  selected = false,
}) => {
  const { t: translate } = useTranslation();

  return (
    <ListItem disablePadding data-id="email-template-item" onClick={onClick}>
      <SurfaceBlock className={clsx(styles.template, selected && styles.selected)}>
        <div className={styles.container}>
          <div className={styles.head}>
            <Typography className="text-14">{title}</Typography>
            <Typography className="text-12" color="text.secondary">
              {action}
            </Typography>
          </div>
          <Button
            variant="text"
            onClick={onClick}
            data-test-id={configureDataTestId}
          >
            {translate("actionButtons.configure")}
          </Button>
        </div>
      </SurfaceBlock>
    </ListItem>
  );
};
