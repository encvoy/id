import { yupResolver } from "@hookform/resolvers/yup";
import { FC, useEffect } from "react";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import { useParams } from "react-router-dom";
import { ICreateProvider } from "src/features/adminPortal/settings/providers/createPanel/CreateProvider";
import {
  BaseFormProvider,
  createProviderBaseSchema,
} from "src/features/adminPortal/settings/providers/components/BaseFormProvider";
import {
  IMTLSParams,
  IProvider,
  ProviderType,
  useCreateProviderMutation,
  useUpdateAvatarMutation,
} from "src/shared/api/provider";
import * as yup from "yup";
import { ProviderAvatars } from "src/features/adminPortal/settings/providers/utils";
import { ProviderHeader } from "src/features/adminPortal/settings/providers/components/ProviderHeader";
import { useTranslation } from "react-i18next";
import { EClaimPrivacyNumber } from "src/shared/utils/enums";
import { InputField } from "src/shared/ui/components/InputBlock";

export const CreateMTLSProvider: FC<ICreateProvider> = ({
  isOpen,
  onClose,
}) => {
  const { appId = "", clientId = "" } =
    useParams<{ appId: string; clientId: string }>();
  const { t: translate } = useTranslation();
  const schema = yup.object({
    ...createProviderBaseSchema(translate),
    params: yup.object({
      issuer: yup
        .string()
        .url(translate("errors.invalidUrlFormat"))
        .min(1, translate("errors.requiredField"))
        .max(2000, translate("errors.valueMaxLength", { maxLength: 2000 }))
        .nullable(true)
        .transform((v) => (typeof v === "undefined" ? null : v)),
    }),
  });

  const methods = useForm<IProvider<IMTLSParams>>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      name: "mTLS",
      avatar: ProviderAvatars.MTLS,
      type: ProviderType.MTLS,
      default_public: EClaimPrivacyNumber.private,
      params: {
        issuer: document.location.origin + ":3443",
      },
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

  const onSubmit: SubmitHandler<IProvider<IMTLSParams>> = (data) => {
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
    <BaseFormProvider<IProvider<IMTLSParams>>
      isOpen={isOpen}
      onClose={onClose}
      methods={methods}
      onSubmit={handleSubmit(onSubmit)}
      mode="create"
      type="mTLS"
      disabled={createResult.isLoading}
    >
      <ProviderHeader defaultAvatar={ProviderAvatars.MTLS} />
      <InputField
        name="params.issuer"
        label={translate("providers.mtls.issuer")}
        description={translate("providers.mtls.issuerDescription")}
      />
    </BaseFormProvider>
  );
};
