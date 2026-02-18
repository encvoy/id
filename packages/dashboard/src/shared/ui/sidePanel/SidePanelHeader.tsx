import { ElementType, FC } from "react";
import {
  Button,
  Tooltip,
  IconButton,
  SvgIconProps,
  Typography,
} from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import PostAddOutlinedIcon from "@mui/icons-material/PostAddOutlined";
import styles from "./SidePanelHeader.module.css";
import { useTranslation } from "react-i18next";

interface ISidePanelHeaderProps {
  title: string;
  onClose: () => void;
  action?: () => void;
  actionText?: string;
  ActionIcon?: ElementType<SvgIconProps>;
}

export const SidePanelHeader: FC<ISidePanelHeaderProps> = ({
  title,
  onClose,
  action,
  actionText,
  ActionIcon,
}) => {
  const { t: translate } = useTranslation();

  return (
    <div className={styles.header}>
      <div className={styles.container}>
        <Typography className="title-medium">{title}</Typography>
        {action && (
          <Tooltip
            title={actionText || translate("actionButtons.create")}
            arrow
            className={styles.tooltip}
          >
            <Button
              data-id="side-panel-create-button"
              variant="contained"
              color="secondary"
              onClick={action}
              startIcon={
                ActionIcon ? (
                  <ActionIcon className={styles.buttonIcon} />
                ) : (
                  <PostAddOutlinedIcon className={styles.buttonIcon} />
                )
              }
            />
          </Tooltip>
        )}
      </div>
      <IconButton data-id="side-panel-close-button" onClick={onClose}>
        <CloseOutlinedIcon />
      </IconButton>
    </div>
  );
};
