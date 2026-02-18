import { Button, Typography } from "@mui/material";
import Switch from "@mui/material/Switch";
import { useTranslation } from "react-i18next";
import {
  useGetSettingsUserQuery,
  useSetSettingsUserMutation,
} from "src/shared/api/profile";
import { ChangeEvent } from "react";
import Box from "@mui/material/Box";

export const PublicProfileBlock = ({
  onOpenDrawer,
}: {
  onOpenDrawer: () => void;
}) => {
  const { t: translate } = useTranslation();
  const { data: settingsUser } = useGetSettingsUserQuery();
  const [setSettingsUser] = useSetSettingsUserMutation();

  const handlePrivacyChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const newPrivacy = event.target.checked;
    try {
      await setSettingsUser({ profile_privacy: newPrivacy }).unwrap();
    } catch (e) {
      console.error("setSettingsUser error: ", e);
    }
  };

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
          {translate("pages.profile.publicProfile.title")}
        </Typography>
        <Switch
          checked={settingsUser?.profile_privacy || false}
          onChange={handlePrivacyChange}
          color="secondary"
          title={translate("pages.profile.publicProfile.togglePrivacy")}
        />
      </Box>
      <Typography className="text-12" color="text.secondary">
        {translate("pages.profile.publicProfile.description")}
      </Typography>
      {!settingsUser?.profile_privacy && (
        <Button
          variant="text"
          color="secondary"
          sx={{
            marginTop: "8px",
          }}
          onClick={onOpenDrawer}
        >
          {translate("pages.profile.publicProfile.button")}
        </Button>
      )}
    </>
  );
};
