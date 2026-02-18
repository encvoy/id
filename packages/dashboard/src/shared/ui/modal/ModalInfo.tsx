import IconButton from "@mui/material/IconButton";
import Modal from "@mui/material/Modal";
import clsx from "clsx";
import { FC, ReactNode } from "react";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { Box, Typography } from "@mui/material";
import styles from "./Modal.module.css";
import { componentBorderRadius } from "src/shared/theme/Theme";

interface IModalInfo {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export const ModalInfo: FC<IModalInfo> = ({
  isOpen,
  onClose,
  children,
  title,
}) => {
  return (
    <Modal open={isOpen} onClose={onClose}>
      <Box
        className={clsx(styles.container)}
        sx={{ borderRadius: componentBorderRadius }}
      >
        <div className={styles.header}>
          {title && <Typography className="text-20-medium">{title}</Typography>}
          <IconButton onClick={onClose} className={styles.closeButton}>
            <CloseOutlinedIcon />
          </IconButton>
        </div>
        {children}
      </Box>
    </Modal>
  );
};
