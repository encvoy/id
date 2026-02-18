import { yupResolver } from "@hookform/resolvers/yup";
import { FC, useEffect } from "react";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import { useParams } from "react-router-dom";
import { ICreateProvider } from "src/features/adminPortal/settings/providers/createPanel/CreateProvider";
import {
  BaseFormProvider,
  createProviderBaseSchema,
} from "src/features/adminPortal/settings/providers/components/BaseFormProvider";
import { InputField } from "src/shared/ui/components/InputBlock";
import {
  IProvider,
  IOTPParams,
  ProviderType,
  useCreateProviderMutation,
  useUpdateAvatarMutation,
} from "src/shared/api/provider";
import * as yup from "yup";
import { ProviderAvatars } from "src/features/adminPortal/settings/providers/utils";
import { ProviderHeader } from "src/features/adminPortal/settings/providers/components/ProviderHeader";
import { useTranslation } from "react-i18next";
import { EClaimPrivacyNumber } from "src/shared/utils/enums";

export const CreateHOTPProvider: FC<ICreateProvider> = ({
  isOpen,
  onClose,
}) => {
  const { appId = "", clientId = "" } =
    useParams<{ appId: string; clientId: string }>();
  const { t: translate } = useTranslation();

  const schema = yup.object({
    ...createProviderBaseSchema(translate),
    params: yup.object({
      digits: yup
        .number()
        .oneOf([6, 8], translate("providers.otp.digitsValidation"))
        .default(6),
      counter: yup
        .number()
        .min(0, translate("providers.otp.counterMin"))
        .default(0),
      algorithm: yup
        .string()
        .oneOf(["SHA1", "SHA256", "SHA512"])
        .default("SHA1"),
    }),
  });

  const methods = useForm<IProvider<IOTPParams>>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      name: "HOTP (HMAC-based One-Time Password)",
      avatar: ProviderAvatars.HOTP,
      type: ProviderType.HOTP,
      default_public: EClaimPrivacyNumber.private,
      params: {
        digits: 6,
        counter: 0,
        algorithm: "SHA1",
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

  const onSubmit: SubmitHandler<IProvider<IOTPParams>> = (data) => {
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
    <BaseFormProvider<IProvider<IOTPParams>>
      isOpen={isOpen}
      onClose={onClose}
      methods={methods}
      onSubmit={handleSubmit(onSubmit)}
      mode="create"
      type="HOTP"
      disabled={createResult.isLoading}
    >
      <ProviderHeader defaultAvatar={ProviderAvatars.HOTP} />

      <InputField
        name="params.digits"
        label={translate("providers.otp.digits")}
        description={translate("providers.otp.digitsDescription")}
        placeholder="6"
      />

      <InputField
        name="params.counter"
        label={translate("providers.otp.counter")}
        description={translate("providers.otp.counterDescription")}
        placeholder="0"
        disabled
      />

      <InputField
        name="params.algorithm"
        label={translate("providers.otp.algorithm")}
        description={translate("providers.otp.algorithmDescription")}
        placeholder="SHA1"
      />
    </BaseFormProvider>
  );
};
