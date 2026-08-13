import { Box, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useSetSettingsUserMutation } from "src/shared/api/profile";
import { IUserProfile } from "src/shared/api/users";
import { setNoticeError, setNoticeInfo } from "src/shared/slices/noticesSlice";
import { setUserProfile } from "src/shared/slices/userSlice";
import { SystemLanguageSelect } from "src/shared/ui/components/SystemLanguageSelect";
import {
  normalizeSystemLanguage,
  syncStoredSystemLanguage,
  TSystemLanguage,
} from "src/shared/utils/locales";

interface IProfileLocaleSettingsProps {
  profile: IUserProfile;
}

export const ProfileLocaleSettings: FC<IProfileLocaleSettingsProps> = ({
  profile,
}) => {
  const dispatch = useDispatch();
  const { t: translate, i18n } = useTranslation();
  const [setSettingsUser, { isLoading }] = useSetSettingsUserMutation();
  const savedLocale = normalizeSystemLanguage(
    profile.locale || i18n.resolvedLanguage || i18n.language
  );
  const [draftLocale, setDraftLocale] = useState<TSystemLanguage>(savedLocale);

  useEffect(() => {
    setDraftLocale(savedLocale);
  }, [savedLocale]);

  const handleSave = async () => {
    if (!profile.id) {
      return;
    }

    const normalizedLocale = normalizeSystemLanguage(draftLocale);

    try {
      await setSettingsUser({ locale: normalizedLocale }).unwrap();
      dispatch(setUserProfile({ ...profile, locale: normalizedLocale }));
      syncStoredSystemLanguage(normalizedLocale);

      if (
        normalizeSystemLanguage(i18n.resolvedLanguage || i18n.language) !==
        normalizedLocale
      ) {
        void i18n.changeLanguage(normalizedLocale);
      }

      dispatch(setNoticeInfo(translate("info.infoUpdated")));
    } catch (error) {
      console.error("setSettingsUser locale error:", error);
      dispatch(setNoticeError(translate("info.updateError")));
    }
  };

  return (
    <Box sx={{ mb: "16px" }}>
      <Typography className="text-14">
        {translate("pages.profile.locale.title")}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <SystemLanguageSelect
          sx={{ display: "flex", maxWidth: 350, margin: "4px 0" }}
          dataTestId="ddl-profile-locale-selection"
          dataId="profile-locale-select"
          optionTestIdPrefix="btn-profile-locale-language"
          value={draftLocale}
          onChange={setDraftLocale}
          disabled={isLoading}
        />
        <Button
          data-test-id="btn-profile-locale-save"
          type="button"
          variant="contained"
          disabled={!profile.id || isLoading || draftLocale === savedLocale}
          onClick={handleSave}
        >
          {translate("actionButtons.save")}
        </Button>
      </Box>
      <Typography className="text-12" color="text.secondary">
        {translate("pages.profile.locale.description")}
      </Typography>
    </Box>
  );
};
