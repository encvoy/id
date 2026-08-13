import Drawer from "@mui/material/Drawer";
import clsx from "clsx";
import { ElementType, FC, ReactNode } from "react";
import { Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { ActionButtons } from "./ActionButtons";
import styles from "./SidePanel.module.css";
import { SidePanelHeader } from "./SidePanelHeader";
import { SvgIconProps } from "@mui/material/SvgIcon";

export interface SidePanelProps {
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
  paperSx?: SxProps<Theme>;
  actionButtonDataTestId?: string;
  closeButtonDataTestId?: string;
  submitButtonDataTestId?: string;
  cancelButtonDataTestId?: string;
  cancelText?: string;
}
export const SidePanel: FC<SidePanelProps> = ({
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
  paperSx,
  actionButtonDataTestId,
  closeButtonDataTestId,
  submitButtonDataTestId,
  cancelButtonDataTestId,
  cancelText = "Cancel",
}) => {
  return (
    <Drawer
      classes={{
        paper: clsx(styles.drawerPaper, customStyles ? customStyles : ""),
      }}
      slotProps={{
        backdrop: { className: isNoBackdrop ? styles.backdrop : "" },
        paper: { sx: paperSx },
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
        actionButtonDataTestId={actionButtonDataTestId}
        closeButtonDataTestId={closeButtonDataTestId}
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
          submitText={buttonSubmitText || "Save"}
          cancelText={cancelText}
          onSubmit={onSubmit}
          disabled={disabledButtonSubmit}
          submitButtonDataTestId={submitButtonDataTestId}
          cancelButtonDataTestId={cancelButtonDataTestId}
        />
      )}
    </Drawer>
  );
};
