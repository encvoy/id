import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import { FC, useEffect } from "react";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { InputField } from "src/shared/ui/components/InputBlock";
import { SwitchBlock } from "src/shared/ui/components/SwitchBlock";
import { UploadAndDisplayImage } from "src/shared/ui/UploadAndDisplayImage";
import * as yup from "yup";
import { isObjectEmpty } from "src/shared/utils/helpers";
import {
  IPhoneParams,
  IProvider,
  ProviderType,
  useCreateProviderMutation,
  useUpdateAvatarMutation,
  useUpdateProviderMutation,
} from "src/shared/api/provider";
import { BaseFormProvider } from "../components/BaseFormProvider";
import { PasswordTextField } from "../../../../../shared/ui/components/PasswordTextField";
import styles from "../BaseStylesProvider.module.css";
import { ProviderAvatars } from "../utils";
import Typography from "@mui/material/Typography";

interface IPhoneProviderProps {
  isOpen: boolean;
  onClose: (value?: boolean) => void;
  provider?: IProvider<IPhoneParams>;
}

const schema = (translate: TFunction) =>
  yup.object({
    is_public: yup.boolean(),
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

export const PhoneProvider: FC<IPhoneProviderProps> = ({
  isOpen,
  onClose,
  provider,
}) => {
  const { t: translate } = useTranslation();
  const { appId = "", clientId = "" } =
    useParams<{ appId: string; clientId: string }>();

  const methods = useForm<IProvider<IPhoneParams>>({
    resolver: yupResolver(schema(translate)) as any,
    mode: "onChange",
    defaultValues: {
      name: "Phone",
      avatar: ProviderAvatars.PHONE,
    },
    reValidateMode: "onBlur",
  });

  const {
    handleSubmit,
    control,
    formState: { dirtyFields },
    reset,
  } = methods;

  const [createProvider, createResult] = useCreateProviderMutation();
  const [updateProvider, updateResult] = useUpdateProviderMutation();
  const [updateAvatar] = useUpdateAvatarMutation();

  const uploadedAvatar = useWatch({ control, name: "avatar" });

  useEffect(() => {
    if (provider && isOpen) {
      reset(provider as IProvider<IPhoneParams>);
    }
  }, [isOpen]);

  useEffect(() => {
    if (createResult.isSuccess || updateResult.isSuccess) onClose(true);
  }, [createResult, updateResult]);

  const onSubmit: SubmitHandler<IProvider<IPhoneParams>> = (data) => {
    if (provider) {
      updateProvider(data).then(() => {
        setTimeout(() => {
          updateAvatar({
            clientId: data.client_id,
            providerId: data.id,
            avatar: uploadedAvatar,
          });
        }, 1000);
      });
    } else {
      createProvider({
        body: {
          ...data,
          type: ProviderType.PHONE,
        },
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
    }
  };

  return (
    <BaseFormProvider<IProvider<IPhoneParams>>
      isOpen={isOpen}
      onClose={onClose}
      methods={methods}
      onSubmit={handleSubmit(onSubmit)}
      disabled={
        createResult.isLoading ||
        updateResult.isLoading ||
        isObjectEmpty(dirtyFields)
      }
    >
      <InputField
        name="params.issuer"
        label={translate("providers.phone.issuer")}
        required
      />
      <InputField
        name="params.external_client_id"
        label={translate("providers.phone.clientId")}
        description={translate("providers.phone.clientIdDescription")}
        required
      />

      <Typography className={clsx("text-14", styles.label, styles.asterisk)}>
        {translate("providers.phone.clientSecret")}
      </Typography>
      <PasswordTextField nameField="params.external_client_secret" />
      <Typography
        className={clsx("text-14", styles.description)}
        color="text.secondary"
      >
        {translate("providers.phone.clientSecretDescription")}
      </Typography>

      <UploadAndDisplayImage
        title={translate("providers.phone.phoneImage")}
        defaultIconSrc={ProviderAvatars.PHONE}
      />

      <SwitchBlock
        name="is_public"
        label={translate("providers.phone.useForLogin")}
        description={translate("providers.phone.useForLoginDescription")}
        defaultValue={false}
      />
    </BaseFormProvider>
  );
};
