import { yupResolver } from "@hookform/resolvers/yup";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import clsx from "clsx";
import { FC, useEffect, useState } from "react";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { IconsLibrary } from "@encvoy-id/components";
import { InputField } from "@encvoy-id/components";
import { EClaimPrivacyNumber } from "src/shared/utils/enums";
import { APP_PUBLIC_URL } from "src/shared/utils/appBasePath";
import * as yup from "yup";
import {
  IOauthParams,
  IProvider,
  EProviderType,
  useCreateProviderMutation,
  useUpdateAvatarMutation,
} from "../../../../../shared/api/provider";
import { PasswordTextField } from "@encvoy-id/components";
import styles from "../BaseStylesProvider.module.css";
import {
  BaseFormProvider,
  createProviderBaseSchema,
} from "../components/BaseFormProvider";
import { ProviderHeader } from "../components/ProviderHeader";
import { IChipProps, ScopeChips } from "../components/ScopeChips";

const schema = (translate: (key: string, options?: any) => string) =>
  yup.object({
    ...createProviderBaseSchema(translate),
    params: yup.object({
      external_client_id: yup
        .string()
        .max(255, translate("errors.valueMaxLength", { maxLength: 255 }))
        .required(translate("errors.requiredField"))
        .matches(/^[^\n ]*$/, {
          message: translate("errors.noSpaces"),
        }),
      external_client_secret: yup
        .string()
        .max(255, translate("errors.valueMaxLength", { maxLength: 255 }))
        .required(translate("errors.requiredField"))
        .matches(/^[^\n ]*$/, {
          message: translate("errors.noSpaces"),
        }),
      authorization_endpoint: yup
        .string()
        .url(translate("errors.invalidUrlFormat"))
        .max(2000, translate("errors.valueMaxLength", { maxLength: 2000 }))
        .required(translate("errors.requiredField")),
      token_endpoint: yup
        .string()
        .url(translate("errors.invalidUrlFormat"))
        .max(2000, translate("errors.valueMaxLength", { maxLength: 2000 }))
        .required(translate("errors.requiredField")),
      issuer: yup
        .string()
        .url(translate("errors.invalidUrlFormat"))
        .max(2000, translate("errors.valueMaxLength", { maxLength: 2000 }))
        .required(translate("errors.requiredField")),
      userinfo_endpoint: yup
        .string()
        .url(translate("errors.invalidUrlFormat"))
        .max(2000, translate("errors.valueMaxLength", { maxLength: 2000 }))
        .required(translate("errors.requiredField")),
      mapping: yup
        .string()
        .max(2000, translate("errors.valueMaxLength", { maxLength: 2000 })),
    }),
  });

export interface ICreateProvider {
  isOpen: boolean;
  onClose: (createChooseProvider?: boolean) => void;
  defaultAvatar?: string;
}

export const CreateProvider: FC<ICreateProvider> = ({ isOpen, onClose }) => {
  const { appId = "", clientId = "" } =
    useParams<{ appId: string; clientId: string }>();
  const { t: translate } = useTranslation();

  const methods = useForm<IProvider<IOauthParams>>({
    resolver: yupResolver(schema(translate)) as any,
    defaultValues: {
      type: EProviderType.CUSTOM,
      default_public: EClaimPrivacyNumber.private,
    },
    mode: "onChange",
    reValidateMode: "onBlur",
  });
  const { handleSubmit, reset, control } = methods;
  const uploadedAvatar = useWatch({ control, name: "avatar" });

  const [chips, setChips] = useState<IChipProps[]>([]);
  const [createProvider, createResult] = useCreateProviderMutation();
  const [updateAvatar] = useUpdateAvatarMutation();

  useEffect(() => {
    return () => {
      reset();
      setChips([]);
    };
  }, [isOpen]);

  useEffect(() => {
    if (createResult.isSuccess) onClose(true);
  }, [createResult]);

  const onSubmit: SubmitHandler<IProvider<IOauthParams>> = (data) => {
    const scopes = chips.map((chip) => chip.value).join(" ");
    createProvider({
      body: {
        ...data,
        params: {
          ...data.params,
          ...(scopes && { scopes }),
        },
      } as IProvider<IOauthParams>,
      clientId: clientId || appId,
    })
      .unwrap()
      .then((provider) => {
        if (provider.id) {
          setTimeout(() => {
            updateAvatar({
              clientId: clientId || appId,
              providerId: provider.id,
              avatar: uploadedAvatar,
            }).unwrap();
          }, 1000);
        }
      });
  };

  return (
    <BaseFormProvider<IProvider<IOauthParams>>
      methods={methods}
      onSubmit={handleSubmit(onSubmit)}
      isOpen={isOpen}
      onClose={onClose}
      mode="create"
      disabled={createResult.isLoading}
    >
      <ProviderHeader />
      <InputField
        name="params.external_client_id"
        label={translate("providers.custom.clientId")}
        dataTestId="txt-settings-login-method-resource-id"
        description={translate("providers.custom.clientIdDescription")}
        required
      />

      <Typography className={clsx("text-14", "asterisk", styles.label)}>
        {translate("providers.custom.clientSecret")}
      </Typography>
      <PasswordTextField
        showText={translate("actionButtons.show")}
        hideText={translate("actionButtons.hide")}
        copyText={translate("actionButtons.copy")}
        nameField="params.external_client_secret"
        dataTestId="txt-settings-login-method-secret-key"
      />
      <Typography
        className={clsx("text-14", styles.description)}
        color="text.secondary"
      >
        {translate("providers.custom.clientSecretDescription")}
      </Typography>

      <Typography className={clsx("text-14", styles.label)}>
        {translate("providers.custom.redirectUri")}
      </Typography>
      <TextField
        value={`${APP_PUBLIC_URL}/api/interaction/code`}
        disabled
        className="custom"
        fullWidth
        variant="standard"
      >
        <IconsLibrary
          title={translate("toolTips.copy")}
          type="copy"
          onClick={() =>
            navigator.clipboard.writeText(
              `${APP_PUBLIC_URL}/api/interaction/code`
            )
          }
        />
      </TextField>
      <Typography
        className={clsx("text-14", styles.description)}
        color="text.secondary"
      >
        {translate("providers.custom.redirectUriDescription")}
      </Typography>

      <InputField
        name="params.issuer"
        label={translate("providers.custom.issuer")}
        dataTestId="txt-settings-login-method-server-base-url"
        required
      />
      <InputField
        name="params.authorization_endpoint"
        label={translate("providers.custom.authorizationEndpoint")}
        dataTestId="txt-settings-login-method-auth-url"
        description={translate(
          "providers.custom.authorizationEndpointDescription"
        )}
        required
      />
      <InputField
        name="params.token_endpoint"
        label={translate("providers.custom.tokenEndpoint")}
        dataTestId="txt-settings-login-method-token-url"
        description={translate("providers.custom.tokenEndpointDescription")}
        required
      />
      <InputField
        name="params.userinfo_endpoint"
        label={translate("providers.custom.userinfoEndpoint")}
        dataTestId="txt-settings-login-method-userinfo-url"
        description={translate("providers.custom.userinfoEndpointDescription")}
        required
      />

      <ScopeChips
        chips={chips}
        setChips={setChips}
        title={translate("providers.custom.scopes")}
        description={translate("providers.custom.scopesDescription")}
        inputDataTestId="txt-settings-login-method-scopes"
      />
    </BaseFormProvider>
  );
};
