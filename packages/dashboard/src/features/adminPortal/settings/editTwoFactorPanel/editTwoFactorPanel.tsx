import { Box, Switch, Typography } from "@mui/material";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AuthMethodTypes } from "src/shared/utils/enums";
import { ISettings, useEditSettingsMutation } from "src/shared/api/settings";
import { IProvider } from "../../../../shared/api/provider";
import { SidePanel } from "src/shared/ui/sidePanel/SidePanel";
import styles from "./editTwoFactorPanel.module.css";
import { componentBorderRadius } from "src/shared/theme/Theme";

interface IEditTwoFactorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: ISettings["two_factor_authentication"];
  providers: IProvider[];
}

export const EditTwoFactorPanel: FC<IEditTwoFactorPanelProps> = ({
  isOpen,
  onClose,
  settings,
  providers,
}) => {
  const { t: translate } = useTranslation();
  const [onTypeProviders, setOnTypeProviders] = useState<string[]>(
    settings?.controlled_methods || []
  );
  const [twoFactorProviders, setTwoFactorProviders] = useState<number[]>(
    settings?.available_provider_ids || []
  );

  useEffect(() => {
    if (settings) {
      setOnTypeProviders(settings.controlled_methods);
      setTwoFactorProviders(settings.available_provider_ids);
    }
  }, [isOpen, settings]);

  const [editSettings, { isLoading: editSettingsLoading }] =
    useEditSettingsMutation();

  const updateOnTypeProviders = (type: string, isChecked: boolean) => {
    if (isChecked) {
      setOnTypeProviders((prev) => [...prev, type]);
    } else {
      setOnTypeProviders((prev) => prev.filter((item) => item !== type));
    }
  };

  const updateTwoFactorProviders = (id: number, isChecked: boolean) => {
    if (isChecked) {
      setTwoFactorProviders((prev) => [...prev, id]);
    } else {
      setTwoFactorProviders((prev) => prev.filter((item) => item !== id));
    }
  };

  const onSubmit = async () => {
    await editSettings({
      two_factor_authentication: {
        controlled_methods: onTypeProviders,
        available_provider_ids: twoFactorProviders,
      },
    });
    onClose();
  };

  return (
    <>
      <SidePanel
        onClose={onClose}
        isOpen={isOpen}
        title={translate("panel.twoFactor.title")}
        onSubmit={onSubmit}
        disabledButtonSubmit={editSettingsLoading}
      >
        <Typography>
          {translate("panel.twoFactor.controlledMethodsTitle")}
        </Typography>
        <div className={styles.sectionContainer}>
          {(
            Object.keys(AuthMethodTypes) as Array<keyof typeof AuthMethodTypes>
          ).map((key) => (
            <Box
              sx={{ borderRadius: componentBorderRadius }}
              key={key}
              className={styles.switchRow}
            >
              <Switch
                checked={onTypeProviders.includes(key)}
                onChange={(event) =>
                  updateOnTypeProviders(key, event.target.checked)
                }
              />
              <Typography>{AuthMethodTypes[key]}</Typography>
            </Box>
          ))}
        </div>
        <div>
          <div className={styles.divider} />
        </div>
        <Typography>
          {translate("panel.twoFactor.availableProvidersTitle")}
        </Typography>
        <div className={styles.sectionContainer}>
          {providers
            .filter((provider) =>
              ["WEBAUTHN", "EMAIL", "PHONE"].includes(provider.type)
            )
            .map((provider) => (
              <Box
                key={provider.id}
                className={styles.switchRow}
                sx={{ borderRadius: componentBorderRadius }}
              >
                <Switch
                  checked={twoFactorProviders.includes(Number(provider.id))}
                  onChange={(event) =>
                    updateTwoFactorProviders(
                      Number(provider.id),
                      event.target.checked
                    )
                  }
                />
                <Typography>{provider.name}</Typography>
              </Box>
            ))}
        </div>
      </SidePanel>
    </>
  );
};
