import IconButton from "@mui/material/IconButton";
import Modal from "@mui/material/Modal";
import { FC, ReactNode } from "react";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { Box, Typography } from "@mui/material";
import { CustomIcon } from "./CustomIcon";

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
        onClick={(event) => {
          event.stopPropagation();
        }}
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
        sx={(theme) => ({
          background: "var(--mui-palette-background-default)",
          padding: "24px",
          width: "500px",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          outline: "none",
          borderRadius: theme.encvoy.componentBorderRadius,
        })}
      >
        <Box sx={{ display: "flex", marginBottom: "16px" }}>
          {title && <Typography className="text-20-medium">{title}</Typography>}
          <IconButton
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
            sx={{ marginLeft: "auto" }}
          >
            <CustomIcon
              Icon={CloseOutlinedIcon}
              color="textSecondary"
              data-test-id="btn-close-modal"
            />
          </IconButton>
        </Box>
        {children}
      </Box>
    </Modal>
  );
};
