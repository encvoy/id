import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { IconButton, Typography, useTheme } from "@mui/material";
import Box from "@mui/material/Box";
import { FC } from "react";
export type ChipStatusType = "default" | "active" | "error";

export interface StatusChipProps {
  customText?: {
    active?: string;
    error?: string;
    default?: string;
  };
  status?: ChipStatusType;
  onClick?: () => void;
  onClickButton?: () => void;
}

export const Chip: FC<StatusChipProps> = ({
  status = "default",
  customText,
  onClick,
  onClickButton,
}) => {
  const theme = useTheme();

  let backgroundColor = theme.palette.action.selected;
  let color = theme.palette.text.primary;
  let text = "";

  switch (status) {
    case "active":
      backgroundColor = theme.palette.primary.main;
      color = theme.palette.primary.contrastText;
      text = customText?.active || "Active";
      break;
    case "error":
      color = theme.palette.error.main;
      text = customText?.error || "Error";
      break;
    default:
      text = customText?.default || "Inactive";
      break;
  }

  return (
    <Box
      sx={(theme) => ({
        display: "flex",
        alignItems: "center",
        width: "fit-content",
        padding: "6px 12px",
        background: backgroundColor,
        marginRight: "8px",
        marginBottom: "4px",
        borderRadius: theme.encvoy.buttonBorderRadius,
        cursor: onClick ? "pointer" : "default",
      })}
      onClick={onClick && (() => onClick())}
    >
      <Typography className="text-12" sx={{ color }}>
        {text}
      </Typography>
      {onClickButton && (
        <IconButton sx={{ p: 0 }} onClick={() => onClickButton()}>
          <CloseOutlinedIcon sx={{ width: "16px", height: "16px" }} />
        </IconButton>
      )}
    </Box>
  );
};
