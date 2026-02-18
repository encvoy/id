import SwapHorizontalCircleOutlined from "@mui/icons-material/SwapHorizontalCircleOutlined";
import ListItem from "@mui/material/ListItem";
import clsx from "clsx";
import { FC, useState } from "react";
import { EClaimPrivacyNumber } from "src/shared/utils/enums";
import { ProviderType } from "../../../../shared/api/provider";
import { SidePanel } from "src/shared/ui/sidePanel/SidePanel";
import styles from "./ChooseListProvidersPanel.module.css";
import { CreateEthereumProvider } from "./createPanel/CreateEthereumProvider";
import { CreateKloudProvider } from "./createPanel/CreateKloudProvider";
import { CreateMTLSProvider } from "./createPanel/CreateMTLSProvider";
import { CreateProvider } from "./createPanel/CreateProvider";
import { CreateProviderByTemplate } from "./createPanel/CreateProviderByTemplate";
import { CreateWebAuthnProvider } from "./createPanel/CreateWebAuthnProvider";
import { CreateTOTPProvider } from "./createPanel/CreateTOTPProvider";
import { CreateHOTPProvider } from "./createPanel/CreateHOTPProvider";
import { ProviderAvatars } from "./utils";
import Avatar from "@mui/material/Avatar";
import { useTranslation } from "react-i18next";
import { getImageURL } from "src/shared/utils/helpers";
import { CustomIcon } from "../../../../shared/ui/components/CustomIcon";
import { CreateEmailCustomProvider } from "./createPanel/CreateEmailCustomProvider";
import Typography from "@mui/material/Typography";

interface IChooseListProvidersPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export type TTemplate = {
  type: ProviderType;
  name: string;
  avatar: string;
  default_public?: EClaimPrivacyNumber;
};

export const ChooseListProvidersPanel: FC<IChooseListProvidersPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const { t: translate } = useTranslation();
  const [providerTemplate, setProviderTemplate] = useState<TTemplate>({
    type: ProviderType.CUSTOM,
    name: "",
    avatar: "",
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

  const providersTemplates: TTemplate[] = [
    {
      name: "Google",
      type: ProviderType.GOOGLE,
      avatar: ProviderAvatars.GOOGLE,
    },
    {
      name: "GitHub",
      type: ProviderType.GITHUB,
      avatar: ProviderAvatars.GITHUB,
    },
    {
      name: "OpenID Connect",
      type: ProviderType.CUSTOM,
      avatar: "",
    },
    {
      name: "WebAuthn",
      type: ProviderType.WEBAUTHN,
      avatar: ProviderAvatars.WEBAUTHN,
    },
    {
      name: "TOTP",
      type: ProviderType.TOTP,
      avatar: ProviderAvatars.TOTP,
    },
    {
      name: "HOTP",
      type: ProviderType.HOTP,
      avatar: ProviderAvatars.HOTP,
    },
    // {
    //   name: "Kloud",
    //   type: ProviderType.KLOUD,
    //   avatar: ProviderAvatars.KLOUD,
    // },
    {
      name: "Email",
      type: ProviderType.EMAIL_CUSTOM,
      avatar: ProviderAvatars.EMAIL_CUSTOM,
    },
    {
      name: "mTLS",
      type: ProviderType.MTLS,
      avatar: ProviderAvatars.MTLS,
    },
    {
      name: "Ethereum",
      type: ProviderType.ETHEREUM,
      avatar: ProviderAvatars.ETHEREUM,
    },
  ];

  const typeToKey: Partial<Record<ProviderType, keyof typeof openForms>> = {
    [ProviderType.CUSTOM]: "custom",
    [ProviderType.ETHEREUM]: "ethereum",
    [ProviderType.MTLS]: "mtls",
    [ProviderType.WEBAUTHN]: "webauthn",
    [ProviderType.KLOUD]: "kloud",
    [ProviderType.EMAIL_CUSTOM]: "email_custom",
    [ProviderType.TOTP]: "totp",
    [ProviderType.HOTP]: "hotp",
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
        onClose={onClose}
        isOpen={isOpen}
        title={translate("panel.chooseProviders.title")}
        description={translate("panel.chooseProviders.description")}
      >
        <div className={styles.wrapper}>
          {providersTemplates.map((template) => {
            return (
              <ListItem
                key={template.type}
                className={styles.provider}
                onClick={() => handleTemplateClick(template)}
              >
                <Avatar
                  src={getImageURL(template.avatar)}
                  className={styles.providerIcon}
                >
                  {!template.avatar && (
                    <CustomIcon
                      Icon={SwapHorizontalCircleOutlined}
                      color="textSecondary"
                      sx={{ width: "35px", height: "35px" }}
                    />
                  )}
                </Avatar>
                <Typography className={clsx("text-14", styles.providerName)}>
                  {template.name}
                </Typography>
              </ListItem>
            );
          })}
        </div>
      </SidePanel>

      <CreateProviderByTemplate
        isOpen={openForms.template}
        onClose={(closeChooseProvider?: boolean) => {
          handleProviderClose("template", closeChooseProvider);
        }}
        providerTemplate={providerTemplate}
      />
      <CreateProvider
        isOpen={openForms.custom}
        onClose={(closeChooseProvider?: boolean) => {
          handleProviderClose("custom", closeChooseProvider);
        }}
      />
      <CreateEthereumProvider
        isOpen={openForms.ethereum}
        onClose={(closeChooseProvider?: boolean) => {
          handleProviderClose("ethereum", closeChooseProvider);
        }}
      />
      <CreateKloudProvider
        isOpen={openForms.kloud}
        onClose={(closeChooseProvider?: boolean) => {
          handleProviderClose("kloud", closeChooseProvider);
        }}
      />
      <CreateEmailCustomProvider
        isOpen={openForms.email_custom}
        onClose={(closeChooseProvider?: boolean) => {
          handleProviderClose("email_custom", closeChooseProvider);
        }}
      />
      <CreateMTLSProvider
        isOpen={openForms.mtls}
        onClose={(closeChooseProvider?: boolean) => {
          handleProviderClose("mtls", closeChooseProvider);
        }}
      />
      <CreateWebAuthnProvider
        isOpen={openForms.webauthn}
        onClose={(closeChooseProvider?: boolean) => {
          handleProviderClose("webauthn", closeChooseProvider);
        }}
      />
      <CreateTOTPProvider
        isOpen={openForms.totp}
        onClose={(closeChooseProvider?: boolean) => {
          handleProviderClose("totp", closeChooseProvider);
        }}
      />
      <CreateHOTPProvider
        isOpen={openForms.hotp}
        onClose={(closeChooseProvider?: boolean) => {
          handleProviderClose("hotp", closeChooseProvider);
        }}
      />
    </>
  );
};
