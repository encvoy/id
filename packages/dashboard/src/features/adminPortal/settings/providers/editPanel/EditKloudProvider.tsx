import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import { FC, useEffect } from "react";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import { InputField } from "src/shared/ui/components/InputBlock";
import { isObjectEmpty } from "src/shared/utils/helpers";
import {
  IKloudParams,
  IProvider,
  useUpdateAvatarMutation,
  useUpdateProviderMutation,
} from "src/shared/api/provider";
import * as yup from "yup";
import {
  BaseFormProvider,
  createProviderBaseSchema,
} from "../components/BaseFormProvider";
import { PasswordTextField } from "../../../../../shared/ui/components/PasswordTextField";
import { IEditProviderProps } from "./EditProvider";
import { ProviderHeader } from "../components/ProviderHeader";
import styles from "./EditProvider.module.css";
import { ProviderAvatars } from "../utils";
import { useTranslation } from "react-i18next";
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

export const EditKloudProvider: FC<IEditProviderProps> = ({
  isOpen,
  onClose,
  provider,
}) => {
  const { t: translate } = useTranslation();
  const methods = useForm<IProvider<IKloudParams>>({
    resolver: yupResolver(schema(translate)) as any,
    mode: "onChange",
    reValidateMode: "onBlur",
  });
  const {
    handleSubmit,
    formState: { dirtyFields },
    reset,
    control,
  } = methods;
  const uploadedAvatar = useWatch({ control, name: "avatar" });

  const [updateProvider, updateResult] = useUpdateProviderMutation();
  const [updateAvatar] = useUpdateAvatarMutation();

  useEffect(() => {
    if (updateResult.isSuccess) onClose();
  }, [updateResult]);

  useEffect(() => {
    if (provider && isOpen) {
      reset(provider as IProvider<IKloudParams>);
    }
  }, [isOpen]);

  const onSubmit: SubmitHandler<IProvider<IKloudParams>> = (data) => {
    updateProvider(data).then(() => {
      setTimeout(() => {
        updateAvatar({
          clientId: data.client_id,
          providerId: data.id,
          avatar: uploadedAvatar,
        });
      }, 1000);
    });
  };

  return (
    <BaseFormProvider<IProvider<IKloudParams>>
      isOpen={isOpen}
      onClose={onClose}
      methods={methods}
      onSubmit={handleSubmit(onSubmit)}
      disabled={updateResult.isLoading || isObjectEmpty(dirtyFields)}
    >
      <ProviderHeader defaultAvatar={ProviderAvatars.KLOUD} />
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
