import SwapHorizontalCircleOutlined from '@mui/icons-material/SwapHorizontalCircleOutlined';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SurfaceBlock } from '@encvoy-id/components';
import { SidePanel } from '@encvoy-id/components';
import { EClaimPrivacyNumber } from 'src/shared/utils/enums';
import { getImageURL } from 'src/shared/utils/helpers';
import { EProviderType } from '../../../../shared/api/provider';
import { CustomIcon } from '@encvoy-id/components';
import styles from './ChooseListProvidersPanel.module.css';
import { CreateEmailCustomProvider } from './createPanel/CreateEmailCustomProvider';
import { CreateEthereumProvider } from './createPanel/CreateEthereumProvider';
import { CreateHOTPProvider } from './createPanel/CreateHOTPProvider';
import { CreateKloudProvider } from './createPanel/CreateKloudProvider';
import { CreateMTLSProvider } from './createPanel/CreateMTLSProvider';
import { CreateProvider } from './createPanel/CreateProvider';
import { CreateProviderByTemplate } from './createPanel/CreateProviderByTemplate';
import { CreateTOTPProvider } from './createPanel/CreateTOTPProvider';
import { CreateWebAuthnProvider } from './createPanel/CreateWebAuthnProvider';
import { ProviderAvatars } from './utils';
import {
  createLocalizedValue,
  getLocalizedTextValue,
  TLocalizedText,
} from 'src/shared/utils/locales';

interface IChooseListProvidersPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export type TTemplate = {
  type: EProviderType;
  name: TLocalizedText;
  avatar: string;
  default_public?: EClaimPrivacyNumber;
};

export const ChooseListProvidersPanel: FC<IChooseListProvidersPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const { t: translate, i18n } = useTranslation();
  const [providerTemplate, setProviderTemplate] = useState<TTemplate>({
    type: EProviderType.CUSTOM,
    name: {},
    avatar: '',
    default_public: EClaimPrivacyNumber.private,
  });

  const [openForms, setOpenForms] = useState({
    template: false,
    custom: false,
    ethereum: false,
    mtls: false,
    webauthn: false,
    totp: false,
    hotp: false,
    kloud: false,
    email_custom: false,
  });

  const foreignProvidersTemplates: TTemplate[] = [
    {
      name: createLocalizedValue('ru-RU', 'Google', 'Google'),
      type: EProviderType.GOOGLE,
      avatar: ProviderAvatars.GOOGLE,
    },
    {
      name: createLocalizedValue('ru-RU', 'GitHub', 'GitHub'),
      type: EProviderType.GITHUB,
      avatar: ProviderAvatars.GITHUB,
    },
  ];

  const otherProvidersTemplates: TTemplate[] = [
    {
      name: createLocalizedValue('ru-RU', 'OpenID Connect', 'OpenID Connect'),
      type: EProviderType.CUSTOM,
      avatar: '',
    },
    {
      name: createLocalizedValue('ru-RU', 'WebAuthn', 'WebAuthn'),
      type: EProviderType.WEBAUTHN,
      avatar: ProviderAvatars.WEBAUTHN,
    },
    {
      name: createLocalizedValue('ru-RU', 'TOTP', 'TOTP'),
      type: EProviderType.TOTP,
      avatar: ProviderAvatars.TOTP,
    },
    {
      name: createLocalizedValue('ru-RU', 'HOTP', 'HOTP'),
      type: EProviderType.HOTP,
      avatar: ProviderAvatars.HOTP,
    },
    {
      name: createLocalizedValue('ru-RU', 'Kloud', 'Kloud'),
      type: EProviderType.KLOUD,
      avatar: ProviderAvatars.KLOUD,
    },
    {
      name: createLocalizedValue('ru-RU', 'Email', 'Email'),
      type: EProviderType.EMAIL_CUSTOM,
      avatar: ProviderAvatars.EMAIL_CUSTOM,
    },
    {
      name: createLocalizedValue('ru-RU', 'mTLS', 'mTLS'),
      type: EProviderType.MTLS,
      avatar: ProviderAvatars.MTLS,
    },
    {
      name: createLocalizedValue('ru-RU', 'Ethereum', 'Ethereum'),
      type: EProviderType.ETHEREUM,
      avatar: ProviderAvatars.ETHEREUM,
    },
  ];

  const providersTemplates = [
    ...foreignProvidersTemplates,
    ...otherProvidersTemplates,
  ];

  const typeToKey: Partial<Record<EProviderType, keyof typeof openForms>> = {
    [EProviderType.CUSTOM]: 'custom',
    [EProviderType.ETHEREUM]: 'ethereum',
    [EProviderType.MTLS]: 'mtls',
    [EProviderType.WEBAUTHN]: 'webauthn',
    [EProviderType.KLOUD]: 'kloud',
    [EProviderType.EMAIL_CUSTOM]: 'email_custom',
    [EProviderType.TOTP]: 'totp',
    [EProviderType.HOTP]: 'hotp',
  };

  const handleProviderClose = (type: string, closeChooseProvider?: boolean) => {
    setOpenForms((prev) => ({ ...prev, [type]: false }));
    if (closeChooseProvider) onClose();
  };

  const handleTemplateClick = async (template: TTemplate) => {
    const key = typeToKey[template.type];
    if (key) {
      setOpenForms((prev) => ({ ...prev, [key]: true }));
    } else {
      setProviderTemplate({
        ...providerTemplate,
        type: template.type,
        name: template.name,
        avatar: template.avatar,
      });
      setOpenForms((prev) => ({ ...prev, template: true }));
    }
  };

  return (
    <>
      <SidePanel
        buttonSubmitText={translate('actionButtons.save')}
        customAdditionalText={translate('actionButtons.create')}
        cancelText={translate('actionButtons.cancel')}
        onClose={onClose}
        isOpen={isOpen}
        title={translate('panel.chooseProviders.title')}
        description={translate('panel.chooseProviders.description')}
      >
        <List className={styles.wrapper}>
          {providersTemplates.map((template) => {
            return (
              <ListItem
                disablePadding
                key={template.type}
                onClick={() => handleTemplateClick(template)}
              >
                <SurfaceBlock className={styles.provider}>
                  <Avatar src={getImageURL(template.avatar)} className={styles.providerIcon}>
                    {!template.avatar && (
                      <CustomIcon
                        Icon={SwapHorizontalCircleOutlined}
                        color="textSecondary"
                        sx={{ width: '35px', height: '35px' }}
                      />
                    )}
                  </Avatar>
                  <Typography
                    sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
                    className="text-14"
                  >
                    {getLocalizedTextValue(template.name, i18n.language)}
                  </Typography>
                </SurfaceBlock>
              </ListItem>
            );
          })}
        </List>
      </SidePanel>

      <CreateProviderByTemplate
        isOpen={openForms.template}
        onClose={(closeChooseProvider?: boolean) => {
          handleProviderClose('template', closeChooseProvider);
        }}
        providerTemplate={providerTemplate}
      />
      <CreateProvider
        isOpen={openForms.custom}
        onClose={(closeChooseProvider?: boolean) => {
          handleProviderClose('custom', closeChooseProvider);
        }}
      />
      <CreateEthereumProvider
        isOpen={openForms.ethereum}
        onClose={(closeChooseProvider?: boolean) => {
          handleProviderClose('ethereum', closeChooseProvider);
        }}
      />
      <CreateKloudProvider
        isOpen={openForms.kloud}
        onClose={(closeChooseProvider?: boolean) => {
          handleProviderClose('kloud', closeChooseProvider);
        }}
      />
      <CreateEmailCustomProvider
        isOpen={openForms.email_custom}
        onClose={(closeChooseProvider?: boolean) => {
          handleProviderClose('email_custom', closeChooseProvider);
        }}
      />
      <CreateMTLSProvider
        isOpen={openForms.mtls}
        onClose={(closeChooseProvider?: boolean) => {
          handleProviderClose('mtls', closeChooseProvider);
        }}
      />
      <CreateWebAuthnProvider
        isOpen={openForms.webauthn}
        onClose={(closeChooseProvider?: boolean) => {
          handleProviderClose('webauthn', closeChooseProvider);
        }}
      />
      <CreateTOTPProvider
        isOpen={openForms.totp}
        onClose={(closeChooseProvider?: boolean) => {
          handleProviderClose('totp', closeChooseProvider);
        }}
      />
      <CreateHOTPProvider
        isOpen={openForms.hotp}
        onClose={(closeChooseProvider?: boolean) => {
          handleProviderClose('hotp', closeChooseProvider);
        }}
      />
    </>
  );
};
