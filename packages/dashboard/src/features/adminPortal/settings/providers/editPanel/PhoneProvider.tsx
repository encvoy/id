import { yupResolver } from "@hookform/resolvers/yup";
import Typography from "@mui/material/Typography";
import clsx from "clsx";
import { TFunction } from "i18next";
import { FC, useEffect } from "react";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import {
  IPhoneParams,
  IProvider,
  EProviderType,
  useCreateProviderMutation,
  useUpdateAvatarMutation,
  useUpdateProviderMutation,
} from "src/shared/api/provider";
import { InputField } from "@encvoy-id/components";
import { isObjectEmpty } from "src/shared/utils/helpers";
import * as yup from "yup";
import { PasswordTextField } from "@encvoy-id/components";
import styles from "../BaseStylesProvider.module.css";
import {
  BaseFormProvider,
  createProviderBaseSchema,
} from "../components/BaseFormProvider";
import { buildProviderUpdatePayload, ProviderAvatars } from "../utils";
import { ProviderHeader } from "../components/ProviderHeader";

interface IPhoneProviderProps {
  isOpen: boolean;
  onClose: (value?: boolean) => void;
  provider?: IProvider<IPhoneParams>;
}

const schema = (translate: TFunction) =>
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
    } as IProvider<IPhoneParams>,
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
      const payload = buildProviderUpdatePayload(data, dirtyFields);
      updateProvider(payload).then(() => {
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
          type: EProviderType.PHONE,
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
      <ProviderHeader defaultAvatar={ProviderAvatars.PHONE} />
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

      <Typography className={clsx("text-14", styles.label, "asterisk")}>
        {translate("providers.phone.clientSecret")}
      </Typography>
      <PasswordTextField
        showText={translate("actionButtons.show")}
        hideText={translate("actionButtons.hide")}
        copyText={translate("actionButtons.copy")}
        nameField="params.external_client_secret"
      />
      <Typography
        className={clsx("text-14", styles.description)}
        color="text.secondary"
      >
        {translate("providers.phone.clientSecretDescription")}
      </Typography>
    </BaseFormProvider>
  );
};
