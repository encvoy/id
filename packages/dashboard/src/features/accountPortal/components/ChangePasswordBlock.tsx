import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Link from "@mui/material/Link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export const ChangePasswordBlock = ({
  passwordUpdateDate,
  navigateTo,
}: {
  passwordUpdateDate: Date;
  navigateTo: string;
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
        <Link component={RouterLink} to={navigateTo}>
          {translate("actionButtons.edit")}
        </Link>
      </Box>
      <Typography className="text-12" color="text.secondary">
        {translate("helperText.lastChanged")}:{" "}
        {passwordUpdateDate.toLocaleDateString(currentLanguage)}
      </Typography>
    </>
  );
};
