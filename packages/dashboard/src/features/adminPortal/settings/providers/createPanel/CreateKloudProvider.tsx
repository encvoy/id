import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import { FC, useEffect } from "react";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import { useParams } from "react-router-dom";
import { InputField } from "src/shared/ui/components/InputBlock";
import * as yup from "yup";
import {
  IKloudParams,
  IProvider,
  ProviderType,
  useCreateProviderMutation,
  useUpdateAvatarMutation,
} from "src/shared/api/provider";
import {
  BaseFormProvider,
  createProviderBaseSchema,
} from "../components/BaseFormProvider";
import { PasswordTextField } from "../../../../../shared/ui/components/PasswordTextField";
import styles from "../BaseStylesProvider.module.css";
import { ICreateProvider } from "src/features/adminPortal/settings/providers/createPanel/CreateProvider";
import { ProviderAvatars } from "src/features/adminPortal/settings/providers/utils";
import { ProviderHeader } from "src/features/adminPortal/settings/providers/components/ProviderHeader";
import { useTranslation } from "react-i18next";
import { EClaimPrivacyNumber } from "src/shared/utils/enums";
import Typography from "@mui/material/Typography";

const schema = (translate: (key: string, options?: any) => string) =>
  yup.object({
    ...createProviderBaseSchema(translate),
    params: yup.object({
      issuer: yup
        .string()
        .url(translate("errors.invalidUrlFormat"))
        .min(1, translate("errors.requiredField"))
        .max(2000, translate("errors.valueMaxLength", { maxLength: 2000 }))
        .nullable(true)
        .transform((v) => (typeof v === "undefined" ? null : v)),
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
    }),
  });

export const CreateKloudProvider: FC<ICreateProvider> = ({
  isOpen,
  onClose,
}) => {
  const { appId = "", clientId = "" } =
    useParams<{ appId: string; clientId: string }>();
  const { t: translate } = useTranslation();
  const methods = useForm<IProvider<IKloudParams>>({
    resolver: yupResolver(schema(translate)) as any,
    defaultValues: {
      name: "Kloud",
      avatar: ProviderAvatars.KLOUD,
      type: ProviderType.KLOUD,
      params: {},
      default_public: EClaimPrivacyNumber.private,
    },
    mode: "onChange",
    reValidateMode: "onBlur",
  });

  const { handleSubmit, reset, control } = methods;
  const uploadedAvatar = useWatch({ control, name: "avatar" });

  const [createProvider, createResult] = useCreateProviderMutation();
  const [updateAvatar] = useUpdateAvatarMutation();

  useEffect(() => {
    reset();
  }, [isOpen]);

  useEffect(() => {
    if (createResult.isSuccess) onClose(true);
  }, [createResult]);

  const onSubmit: SubmitHandler<IProvider<IKloudParams>> = (data) => {
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
    <BaseFormProvider<IProvider<IKloudParams>>
      methods={methods}
      onSubmit={handleSubmit(onSubmit)}
      isOpen={isOpen}
      onClose={onClose}
      mode="create"
      type="Kloud"
      disabled={createResult.isLoading}
    >
      <ProviderHeader
        defaultAvatar={ProviderAvatars.KLOUD}
        withoutPublicStatus
      />
      <InputField
        name="params.external_client_id"
        label={translate("providers.kloud.clientId")}
        description={translate("providers.kloud.clientIdDescription")}
        required
      />

      <Typography className={clsx("text-14", styles.asterisk, styles.label)}>
        {translate("providers.kloud.clientSecret")}
      </Typography>
      <PasswordTextField nameField="params.external_client_secret" />
      <Typography
        className={clsx("text-14", styles.description)}
        color="text.secondary"
      >
        {translate("providers.kloud.clientSecretDescription")}
      </Typography>

      <InputField
        name="params.issuer"
        label={translate("providers.kloud.issuer")}
        description={translate("providers.kloud.issuerDescription")}
        required
      />
    </BaseFormProvider>
  );
};
