import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Link from "@mui/material/Link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export const ChangePasswordBlock = ({
  passwordUpdateDate,
  navigateTo,
  onClick,
}: {
  passwordUpdateDate: Date;
  navigateTo?: string;
  onClick?: () => void;
}) => {
  const { t: translate, i18n } = useTranslation();
  const currentLanguage = i18n.language;

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "start",
          justifyContent: "space-between",
        }}
      >
        <Typography className="text-14">
          {translate("helperText.password")}
        </Typography>
        {onClick ? (
          <Link
            component="button"
            type="button"
            onClick={onClick}
            data-test-id="lnk-profile-change-password"
          >
            {translate("actionButtons.edit")}
          </Link>
        ) : (
          <Link
            component={RouterLink}
            to={navigateTo || ""}
            data-test-id="lnk-profile-change-password"
          >
            {translate("actionButtons.edit")}
          </Link>
        )}
      </Box>
      <Typography className="text-12" color="text.secondary">
        {translate("helperText.lastChanged")}:{" "}
        {passwordUpdateDate.toLocaleDateString(currentLanguage)}
      </Typography>
    </>
  );
};
