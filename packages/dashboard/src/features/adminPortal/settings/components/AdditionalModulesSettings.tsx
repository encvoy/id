import Box from "@mui/material/Box";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import {
  useGetCatalogEnabledQuery,
  useUpdateCatalogEnabledMutation,
} from "src/shared/api/settings";
import { setNoticeInfo } from "src/shared/slices/noticesSlice";

export const AdditionalModulesSettings = () => {
  const dispatch = useDispatch();
  const { t: translate } = useTranslation();
  const {
    data: catalogEnabled,
    refetch,
    isFetching,
  } = useGetCatalogEnabledQuery();
  const [updateCatalogEnabled] = useUpdateCatalogEnabledMutation();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (catalogEnabled !== undefined) {
      setEnabled(catalogEnabled);
    }
  }, [catalogEnabled]);

  const handleChange = async (checked: boolean) => {
    const previousValue = enabled;
    setEnabled(checked);

    try {
      await updateCatalogEnabled(checked).unwrap();
      await refetch();
      dispatch(setNoticeInfo(translate("info.infoUpdated")));
    } catch {
      setEnabled(previousValue);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "16px",
      }}
    >
      <Box>
        <Typography className="text-14">
          {translate("pages.settings.additionalModules.catalog.title")}
        </Typography>
        <Typography className="text-12" color="text.secondary">
          {translate("pages.settings.additionalModules.catalog.description")}
        </Typography>
      </Box>
      <Switch
        data-test-id="chk-settings-additional-modules-catalog"
        checked={enabled}
        disabled={isFetching || catalogEnabled === undefined}
        onChange={(_, checked) => handleChange(checked)}
      />
    </Box>
  );
};

export default AdditionalModulesSettings;
