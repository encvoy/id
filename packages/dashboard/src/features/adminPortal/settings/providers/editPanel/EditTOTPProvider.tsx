import { yupResolver } from "@hookform/resolvers/yup";
import { FC, useEffect } from "react";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import { IEditProviderProps } from "src/features/adminPortal/settings/providers/editPanel/EditProvider";
import {
  BaseFormProvider,
  createProviderBaseSchema,
} from "src/features/adminPortal/settings/providers/components/BaseFormProvider";
import { InputField } from "src/shared/ui/components/InputBlock";
import { isObjectEmpty } from "src/shared/utils/helpers";
import {
  IProvider,
  IOTPParams,
  useUpdateAvatarMutation,
  useUpdateProviderMutation,
} from "src/shared/api/provider";
import * as yup from "yup";
import { ProviderHeader } from "../components/ProviderHeader";
import { ProviderAvatars } from "../utils";
import { useTranslation } from "react-i18next";

export const EditTOTPProvider: FC<IEditProviderProps> = ({
  isOpen,
  onClose,
  provider,
}) => {
  const { t: translate } = useTranslation();
  const schema = yup.object({
    ...createProviderBaseSchema(translate),
    params: yup.object({
      digits: yup
        .number()
        .oneOf([6, 8], translate("providers.otp.digitsValidation"))
        .default(6),
      period: yup
        .number()
        .min(15, translate("providers.otp.periodMin"))
        .max(300, translate("providers.otp.periodMax"))
        .default(30),
      algorithm: yup
        .string()
        .oneOf(["SHA1", "SHA256", "SHA512"])
        .default("SHA1"),
    }),
  });
  const methods = useForm<IProvider<IOTPParams>>({
    resolver: yupResolver(schema) as any,
    mode: "onBlur",
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
    if (provider) {
      reset(provider as IProvider<IOTPParams>);
    }
  }, [isOpen]);

  const onSubmit: SubmitHandler<IProvider<IOTPParams>> = (data) => {
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
    <BaseFormProvider<IProvider<IOTPParams>>
      isOpen={isOpen}
      onClose={onClose}
      methods={methods}
      onSubmit={handleSubmit(onSubmit)}
      disabled={updateResult.isLoading || isObjectEmpty(dirtyFields)}
    >
      <ProviderHeader defaultAvatar={ProviderAvatars.TOTP} />

      <InputField
        name="params.digits"
        label={translate("providers.otp.digits")}
        description={translate("providers.otp.digitsDescription")}
        placeholder="6"
      />

      <InputField
        name="params.period"
        label={translate("providers.otp.period")}
        description={translate("providers.otp.periodDescription")}
        placeholder="30"
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
