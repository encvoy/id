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
  IEmailParams,
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

interface IEmailProviderProps {
  isOpen: boolean;
  onClose: (value?: boolean) => void;
  provider?: IProvider<IEmailParams>;
}

const schema = (translate: TFunction) =>
  yup.object({
    is_public: yup.boolean(),
    params: yup.object({
      root_mail: yup
        .string()
        .required(translate("errors.requiredField"))
        .max(255, translate("errors.valueMaxLength", { maxLength: 255 }))
        .email(translate("errors.invalidEmailFormat")),
      mail_hostname: yup
        .string()
        .max(2000, translate("errors.valueMaxLength", { maxLength: 2000 }))
        .required(translate("errors.requiredField")),
      mail_port: yup
        .string()
        .required(translate("errors.requiredField"))
        .min(1, translate("errors.valueMinLength", { minLength: 1 }))
        .max(5, translate("errors.valueMaxLength", { maxLength: 5 }))
        .matches(/^[^\n ]*$/, {
          message: translate("errors.noSpaces"),
        }),
      mail_password: yup.string().required(translate("errors.requiredField")),
      mail_code_ttl_sec: yup
        .string()
        .required(translate("errors.requiredField"))
        .matches(/^[^\n ]*$/, {
          message: translate("errors.noSpaces"),
        }),
    }),
  });

export const EmailProvider: FC<IEmailProviderProps> = ({
  isOpen,
  onClose,
  provider,
}) => {
  const { t: translate } = useTranslation();

  const { appId = "", clientId = "" } =
    useParams<{ appId: string; clientId: string }>();

  const methods = useForm<IProvider<IEmailParams>>({
    resolver: yupResolver(schema(translate)) as any,
    mode: "onChange",
    reValidateMode: "onBlur",
    defaultValues: {
      name: "E-mail",
      avatar: ProviderAvatars.EMAIL,
    },
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
      reset(provider as IProvider<IEmailParams>);
    }
  }, [isOpen]);

  useEffect(() => {
    if (createResult.isSuccess || updateResult.isSuccess) onClose(true);
  }, [createResult, updateResult]);

  const onSubmit: SubmitHandler<IProvider<IEmailParams>> = (data) => {
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
          type: ProviderType.EMAIL,
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
    <BaseFormProvider<IProvider<IEmailParams>>
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
        name="params.root_mail"
        label={translate("providers.email.rootMail")}
        description={translate("providers.email.rootMailDescription")}
        required
      />
      <InputField
        name="params.mail_hostname"
        label={translate("providers.email.mailHostname")}
        description={translate("providers.email.mailHostnameDescription")}
        required
      />
      <InputField
        name="params.mail_port"
        label={translate("providers.email.mailPort")}
        description={translate("providers.email.mailPortDescription")}
        required
      />

      <Typography className={clsx("text-14", styles.label, styles.asterisk)}>
        {translate("providers.email.mailPassword")}
      </Typography>
      <PasswordTextField nameField="params.mail_password" />
      <Typography
        className={clsx("text-14", styles.description)}
        color="text.secondary"
      >
        {translate("providers.email.mailPasswordDescription")}
      </Typography>

      <UploadAndDisplayImage
        title={translate("providers.email.mailImage")}
        defaultIconSrc={ProviderAvatars.EMAIL}
      />

      <InputField
        name="params.mail_code_ttl_sec"
        label={translate("providers.email.mailCodeTtlSec")}
        description={translate("providers.email.mailCodeTtlSecDescription")}
        required
      />

      <SwitchBlock
        name="is_public"
        label={translate("providers.email.useForLogin")}
        description={translate("providers.email.useForLoginDescription")}
        defaultValue={false}
      />
    </BaseFormProvider>
  );
};
