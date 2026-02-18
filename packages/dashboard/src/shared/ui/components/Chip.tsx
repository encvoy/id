import { Typography, useTheme } from "@mui/material";
import Box from "@mui/material/Box";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { buttonBorderRadius } from "src/shared/theme/Theme";

export type ChipStatusType = "default" | "active" | "error";

interface IChipProps {
  status: ChipStatusType;
  customText?: string;
}

export const Chip: FC<IChipProps> = ({ status, customText }) => {
  const { t: translate } = useTranslation();
  const theme = useTheme();

  let backgroundColor = theme.palette.background.paper;
  let color = theme.palette.text.secondary;
  let text = customText;

  if (status === "active") {
    backgroundColor = theme.palette.primary.main;
    color = theme.palette.primary.contrastText;
    if (!customText) text = translate("statuses.active");
  } else if (status === "error") {
    color = theme.palette.error.main;
    if (!customText) text = translate("statuses.expired");
  } else {
    if (!customText) text = translate("statuses.inactive");
  }

  return (
    <Box
      sx={{
        padding: "6px 12px",
        background: backgroundColor,
        marginRight: "8px",
        marginBottom: "4px",
        borderRadius: buttonBorderRadius,
      }}
    >
      <Typography className="text-12" sx={{ color }}>
        {text}
      </Typography>
    </Box>
  );
};
