import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Link from "@mui/material/Link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export const TokensBlock = ({ navigateTo }: { navigateTo: string }) => {
  const { t: translate } = useTranslation();

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "start",
          justifyContent: "space-between",
          marginTop: "16px",
        }}
      >
        <Typography className="text-14">
          {translate("pages.tokens.title")}
        </Typography>
        <Link
          data-test-id="lnk-profile-additional-tokens-edit"
          component={RouterLink}
          to={navigateTo}
        >
          {translate("actionButtons.configure")}
        </Link>
      </Box>
      <Typography className="text-12" color="text.secondary">
        {translate("pages.profile.security.additionalTokensDescription")}
      </Typography>
    </>
  );
};
