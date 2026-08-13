import { ElementType, FC } from "react";
import {
  Box,
  Button,
  Tooltip,
  IconButton,
  SvgIconProps,
  Typography,
} from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import PostAddOutlinedIcon from "@mui/icons-material/PostAddOutlined";
import { CustomIcon } from "./CustomIcon";

export interface SidePanelHeaderProps {
  title: string;
  onClose: () => void;
  action?: () => void;
  actionText?: string;
  ActionIcon?: ElementType<SvgIconProps>;
  actionButtonDataTestId?: string;
  closeButtonDataTestId?: string;
}

export const SidePanelHeader: FC<SidePanelHeaderProps> = ({
  title,
  onClose,
  action,
  actionText,
  ActionIcon,
  actionButtonDataTestId,
  closeButtonDataTestId,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "20px",
        paddingBottom: "26px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: "12px",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Typography sx={{ maxWidth: "400px" }} className="title-medium">
          {title}
        </Typography>
        {action && (
          <Tooltip title={actionText || "Create"} arrow>
            <Button
              data-test-id={actionButtonDataTestId}
              variant="contained"
              color="secondary"
              onClick={action}
              sx={{ flexShrink: 0 }}
              startIcon={
                ActionIcon ? (
                  <ActionIcon sx={{ width: "30px", height: "30px" }} />
                ) : (
                  <PostAddOutlinedIcon sx={{ width: "30px", height: "30px" }} />
                )
              }
            />
          </Tooltip>
        )}
      </Box>
      <IconButton onClick={onClose} data-test-id={closeButtonDataTestId}>
        <CustomIcon Icon={CloseOutlinedIcon} color="textSecondary" />
      </IconButton>
    </Box>
  );
};
