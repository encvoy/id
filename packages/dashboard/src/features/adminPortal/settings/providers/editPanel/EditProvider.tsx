import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import { FC, useEffect, useState } from "react";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import {
  BaseFormProvider,
  createProviderBaseSchema,
} from "src/features/adminPortal/settings/providers/components/BaseFormProvider";
import { InputField } from "src/shared/ui/components/InputBlock";
import { PasswordTextField } from "src/shared/ui/components/PasswordTextField";
import { isObjectEmpty } from "src/shared/utils/helpers";
import {
  IOauthParams,
  IProvider,
  ProviderType,
  useUpdateAvatarMutation,
  useUpdateProviderMutation,
} from "src/shared/api/provider";
import * as yup from "yup";
import { ProviderHeader } from "../components/ProviderHeader";
import styles from "./EditProvider.module.css";
import { IChipProps, ScopeChips } from "../components/ScopeChips";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { ProviderAvatars } from "src/features/adminPortal/settings/providers/utils";
import Typography from "@mui/material/Typography";

const schema = (translate: TFunction) =>
  yup.object({
    ...createProviderBaseSchema(translate),
    params: yup.object({
      issuer: yup
        .string()
        .url(translate("errors.invalidUrlFormat"))
        .max(2000, translate("errors.valueMaxLength", { maxLength: 2000 }))
        .required(translate("errors.requiredField")),
      token_endpoint: yup
        .string()
        .url(translate("errors.invalidUrlFormat"))
        .max(2000, translate("errors.valueMaxLength", { maxLength: 2000 }))
        .required(translate("errors.requiredField")),
      userinfo_endpoint: yup
        .string()
        .url(translate("errors.invalidUrlFormat"))
        .max(2000, translate("errors.valueMaxLength", { maxLength: 2000 }))
        .required(translate("errors.requiredField")),
      external_client_id: yup
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
      external_client_secret: yup
        .string()
        .max(255, translate("errors.valueMaxLength", { maxLength: 255 }))
        .matches(/^[^\n ]*$/, {
          message: translate("errors.noSpaces"),
        }),
    }),
  });

export interface IEditProviderProps {
  isOpen: boolean;
  onClose: () => void;
  provider: IProvider | null;
}

export const EditProvider: FC<IEditProviderProps> = ({
  isOpen,
  onClose,
  provider,
}) => {
  const { t: translate } = useTranslation();
  const methods = useForm<IProvider<IOauthParams>>({
    resolver: yupResolver(schema(translate)) as any,
    mode: "onChange",
    reValidateMode: "onBlur",
    context: { providerType: provider?.type },
  });

  const {
    handleSubmit,
    formState: { dirtyFields },
    reset,
    control,
  } = methods;
  const uploadedAvatar = useWatch({ control, name: "avatar" });

  const [chips, setChips] = useState<IChipProps[]>([]);
  const [updateProvider, updateResult] = useUpdateProviderMutation();
  const [updateAvatar] = useUpdateAvatarMutation();

  useEffect(() => {
    if (updateResult.isSuccess) onClose();
  }, [updateResult]);

  useEffect(() => {
    if (provider && isOpen) {
      reset(provider as IProvider<IOauthParams>);
      setChips([]);
    }
  }, [isOpen]);

  const onSubmit: SubmitHandler<IProvider<IOauthParams>> = (data) => {
    const scopes = chips.map((chip) => chip.value).join(" ");
    updateProvider({
      ...data,
      params: {
        ...data.params,
        scopes,
      },
    } as IProvider<IOauthParams>).then(() => {
      setTimeout(() => {
        updateAvatar({
          clientId: data.client_id,
          providerId: data.id,
          avatar: uploadedAvatar,
        });
      }, 1000);
    });
  };

  const ProviderAvatarMap: Record<string, string> = {
    GITHUB: ProviderAvatars.GITHUB,
    GOOGLE: ProviderAvatars.GOOGLE,
  };

  return (
    <BaseFormProvider<IProvider<IOauthParams>>
      isOpen={isOpen}
      onClose={onClose}
      methods={methods}
      isNoBackdrop={false}
      onSubmit={handleSubmit(onSubmit)}
      disabled={updateResult.isLoading || isObjectEmpty(dirtyFields)}
    >
      <ProviderHeader
        defaultAvatar={
          provider?.type ? ProviderAvatarMap[provider.type] : undefined
        }
      />

      <InputField
        name="params.external_client_id"
        label={translate("providers.custom.clientId")}
        description={translate("providers.custom.clientIdDescription")}
        required
      />

      {provider?.type === ProviderType.CUSTOM && (
        <>
          <InputField
            name="params.issuer"
            label={translate("providers.custom.issuer")}
            required
          />
          <InputField
            name="params.authorization_endpoint"
            label={translate("providers.custom.authorizationEndpoint")}
            description={translate(
              "providers.custom.authorizationEndpointDescription"
            )}
            required
          />
          <InputField
            name="params.token_endpoint"
            label={translate("providers.custom.tokenEndpoint")}
            description={translate("providers.custom.tokenEndpointDescription")}
            required
          />
          <InputField
            name="params.userinfo_endpoint"
            label={translate("providers.custom.userinfoEndpoint")}
            description={translate(
              "providers.custom.userinfoEndpointDescription"
            )}
            required
          />

          <Typography className={clsx("text-14", styles["input-title"])}>
            {translate("providers.custom.scopes")}
          </Typography>
          <ScopeChips chips={chips} setChips={setChips} />
          <Typography
            className={clsx("text-14", styles["input-subtitle"])}
            color="text.secondary"
          >
            {translate("providers.custom.scopesDescription")}
          </Typography>
        </>
      )}
    </BaseFormProvider>
  );
};
