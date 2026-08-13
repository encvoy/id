import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import Tooltip from "@mui/material/Tooltip";
import { useTheme } from "@mui/material/styles";
import { FC } from "react";
import { CustomIcon } from "./CustomIcon";

export interface ContactStatusIndicatorProps {
  verified?: boolean | null;
  unverifiedText?: string;
}

export const ContactStatusIndicator: FC<ContactStatusIndicatorProps> = ({
  verified,
  unverifiedText = "Unverified contact",
}) => {
  const theme = useTheme();

  if (verified !== false) {
    return null;
  }

  return (
    <Tooltip
      arrow
      title={unverifiedText}
    >
      <span
        data-test-id="ico-contact-unverified"
        style={{ display: "inline-flex", alignItems: "center" }}
      >
        <CustomIcon
          Icon={ErrorOutlineRoundedIcon}
          color="custom"
          colorHex={theme.palette.warning.main}
          sx={{ width: 20, height: 20 }}
        />
      </span>
    </Tooltip>
  );
};
