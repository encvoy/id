import Drawer from "@mui/material/Drawer";
import clsx from "clsx";
import { ElementType, FC, ReactNode } from "react";
import { Typography } from "@mui/material";
import { ActionButtons } from "../components/ActionButtons";
import styles from "./SidePanel.module.css";
import { SidePanelHeader } from "./SidePanelHeader";
import { SvgIconProps } from "@mui/material/SvgIcon";
import { useTranslation } from "react-i18next";

interface ISidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  description?: string;
  isNoBackdrop?: boolean;
  onSubmit?: () => void;
  buttonSubmitText?: string;
  disabledButtonSubmit?: boolean;
  AdditionalAction?: () => void;
  customAdditionalText?: string;
  CustomAdditionalIcon?: ElementType<SvgIconProps>;
  customStyles?: string;
}
export const SidePanel: FC<ISidePanelProps> = ({
  children,
  onClose,
  isOpen,
  title,
  description,
  isNoBackdrop,
  onSubmit,
  buttonSubmitText,
  disabledButtonSubmit,
  AdditionalAction,
  customAdditionalText,
  CustomAdditionalIcon,
  customStyles,
}) => {
  const { t: translate } = useTranslation();

  return (
    <Drawer
      classes={{
        paper: clsx(styles.drawerPaper, customStyles ? customStyles : ""),
      }}
      slotProps={{
        backdrop: { className: isNoBackdrop ? styles.backdrop : "" },
      }}
      onClose={onClose}
      open={isOpen}
      anchor="right"
      variant="temporary"
    >
      <SidePanelHeader
        title={title}
        action={AdditionalAction}
        actionText={customAdditionalText}
        ActionIcon={CustomAdditionalIcon}
        onClose={onClose}
      />
      {description && (
        <div className={styles.description}>
          <Typography className="text-15" color="text.secondary">
            {description}
          </Typography>
        </div>
      )}
      {children}
      {onSubmit && (
        <ActionButtons
          onCancel={onClose}
          submitText={buttonSubmitText || translate("actionButtons.save")}
          onSubmit={onSubmit}
          disabled={disabledButtonSubmit}
        />
      )}
    </Drawer>
  );
};
