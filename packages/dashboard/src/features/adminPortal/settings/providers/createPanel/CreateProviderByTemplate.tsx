import { yupResolver } from "@hookform/resolvers/yup";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import clsx from "clsx";
import { FC, useEffect } from "react";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { ProviderHeader } from "src/features/adminPortal/settings/providers/components/ProviderHeader";
import { IconsLibrary } from "@encvoy-id/components";
import { InputField } from "@encvoy-id/components";
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
import { TTemplate } from "../ChooseListProvidersPanel";
import {
  BaseFormProvider,
  createProviderBaseSchema,
} from "../components/BaseFormProvider";

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
        .matches(/^[^\n ]*$/, {
          message: translate("errors.noSpaces"),
        })
        .required(translate("errors.requiredField")),
    }),
  });

interface ICreateProviderTemplateProps {
  isOpen: boolean;
  onClose: (createChooseProvider?: boolean) => void;
  providerTemplate: TTemplate;
}

export const CreateProviderByTemplate: FC<ICreateProviderTemplateProps> = ({
  isOpen,
  onClose,
  providerTemplate,
}) => {
  const { appId = "", clientId = "" } =
    useParams<{ appId: string; clientId: string }>();
  const { t: translate } = useTranslation();
  const methods = useForm<IProvider<IOauthParams>>({
    resolver: yupResolver(schema(translate)) as any,
    mode: "onChange",
    reValidateMode: "onBlur",
    context: { providerType: providerTemplate.type },
  });
  const { handleSubmit, reset, control } = methods;
  const uploadedAvatar = useWatch({ control, name: "avatar" });

  const [createProvider, createResult] = useCreateProviderMutation();
  const [updateAvatar] = useUpdateAvatarMutation();

  useEffect(() => {
    if (providerTemplate) {
      reset(providerTemplate as IProvider<IOauthParams>);
    }
  }, [isOpen]);

  useEffect(() => {
    if (createResult.isSuccess) onClose(true);
  }, [createResult]);

  const onSubmit: SubmitHandler<IProvider<IOauthParams>> = (data) => {
    createProvider({
      body: data,
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
      type={providerTemplate.type}
      disabled={createResult.isLoading}
    >
      <ProviderHeader defaultAvatar={providerTemplate.avatar} />
      <InputField
        name="params.external_client_id"
        label={translate("providers.template.clientId")}
        dataTestId="txt-settings-login-method-resource-id"
        description={translate("providers.template.clientIdDescription")}
        required
      />

      <>
          <Typography className={clsx("text-14", "asterisk", styles.label)}>
            {translate("providers.template.clientSecret")}
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
            {translate("providers.template.clientSecretDescription")}
          </Typography>
      </>

      <Typography className={clsx("text-14", styles.label)}>
        {translate("providers.template.redirectUri")}
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
        {translate("providers.template.redirectUriDescription")}
      </Typography>
    </BaseFormProvider>
  );
};
