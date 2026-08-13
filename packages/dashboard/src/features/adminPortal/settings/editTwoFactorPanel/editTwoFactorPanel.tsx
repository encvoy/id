import { Switch, Typography } from '@mui/material';
import { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthMethodTypes } from 'src/shared/utils/enums';
import { ISettings, useEditSettingsMutation } from 'src/shared/api/settings';
import { EProviderType, IProvider } from '../../../../shared/api/provider';
import { SidePanel } from '@encvoy-id/components';
import styles from './editTwoFactorPanel.module.css';
import { SurfaceBlock } from '@encvoy-id/components';
import { getLocalizedTextValue } from 'src/shared/utils/locales';

interface IEditTwoFactorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: ISettings['two_factor_authentication'];
  providers: IProvider[];
}

export const EditTwoFactorPanel: FC<IEditTwoFactorPanelProps> = ({
  isOpen,
  onClose,
  settings,
  providers,
}) => {
  const { t: translate, i18n } = useTranslation();
  const [onTypeProviders, setOnTypeProviders] = useState<string[]>(
    settings?.controlled_methods || [],
  );
  const [twoFactorProviders, setTwoFactorProviders] = useState<string[]>(
    settings?.available_provider_ids || [],
  );

  useEffect(() => {
    if (settings) {
      setOnTypeProviders(settings.controlled_methods);
      setTwoFactorProviders(settings.available_provider_ids);
    }
  }, [isOpen, settings]);

  const [editSettings, { isLoading: editSettingsLoading }] = useEditSettingsMutation();

  const updateOnTypeProviders = (type: string, isChecked: boolean) => {
    if (isChecked) {
      setOnTypeProviders((prev) => [...prev, type]);
    } else {
      setOnTypeProviders((prev) => prev.filter((item) => item !== type));
    }
  };

  const updateTwoFactorProviders = (id: string, isChecked: boolean) => {
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
        buttonSubmitText={translate('actionButtons.save')}
        customAdditionalText={translate('actionButtons.create')}
        cancelText={translate('actionButtons.cancel')}
        onClose={onClose}
        isOpen={isOpen}
        title={translate('panel.twoFactor.title')}
        closeButtonDataTestId="btn-modal-close"
        onSubmit={onSubmit}
        disabledButtonSubmit={editSettingsLoading}
        cancelButtonDataTestId="btn-form-cancel"
        submitButtonDataTestId="btn-form-save"
      >
        <Typography>{translate('panel.twoFactor.controlledMethodsTitle')}</Typography>
        <div className={styles.sectionContainer}>
          {(Object.keys(AuthMethodTypes) as Array<keyof typeof AuthMethodTypes>).map((key) => (
            <SurfaceBlock key={key} className={styles.switchRow}>
              <Switch
                data-test-id={`chk-settings-access-2fa-${key}`}
                checked={onTypeProviders.includes(key)}
                onChange={(event) => updateOnTypeProviders(key, event.target.checked)}
              />
              <Typography>{AuthMethodTypes[key]}</Typography>
            </SurfaceBlock>
          ))}
        </div>
        <div>
          <div className={styles.divider} />
        </div>
        <Typography>{translate('panel.twoFactor.availableProvidersTitle')}</Typography>
        <div className={styles.sectionContainer}>
          {providers
            .filter((provider) =>
              [
                EProviderType.WEBAUTHN,
                EProviderType.EMAIL,
                EProviderType.PHONE,
                EProviderType.TOTP,
                EProviderType.HOTP,
                '',
              ].includes(provider.type),
            )
            .map((provider) => (
              <SurfaceBlock key={provider.id} className={styles.switchRow}>
                <Switch
                  data-test-id={`chk-settings-access-2fa-provider-${provider.id}`}
                  checked={twoFactorProviders.includes(provider.id)}
                  onChange={(event) => updateTwoFactorProviders(provider.id, event.target.checked)}
                />
                <Typography>{getLocalizedTextValue(provider.name, i18n.language)}</Typography>
              </SurfaceBlock>
            ))}
        </div>
      </SidePanel>
    </>
  );
};
