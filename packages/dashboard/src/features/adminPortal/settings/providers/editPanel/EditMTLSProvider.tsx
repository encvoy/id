import { yupResolver } from "@hookform/resolvers/yup";
import { FC, useEffect } from "react";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import { IEditProviderProps } from "src/features/adminPortal/settings/providers/editPanel/EditProvider";
import {
  BaseFormProvider,
  createProviderBaseSchema,
} from "src/features/adminPortal/settings/providers/components/BaseFormProvider";
import { isObjectEmpty } from "src/shared/utils/helpers";
import {
  IMTLSParams,
  IProvider,
  useUpdateAvatarMutation,
  useUpdateProviderMutation,
} from "src/shared/api/provider";
import * as yup from "yup";
import { ProviderHeader } from "../components/ProviderHeader";
import { ProviderAvatars } from "../utils";
import { useTranslation } from "react-i18next";
import { InputField } from "src/shared/ui/components/InputBlock";

export const EditMTLSProvider: FC<IEditProviderProps> = ({
  isOpen,
  onClose,
  provider,
}) => {
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
    if (provider) {
      reset(provider as IProvider<IMTLSParams>);
    }
  }, [isOpen]);

  const onSubmit: SubmitHandler<IProvider<IMTLSParams>> = (data) => {
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
    <BaseFormProvider<IProvider<IMTLSParams>>
      isOpen={isOpen}
      onClose={onClose}
      methods={methods}
      onSubmit={handleSubmit(onSubmit)}
      disabled={updateResult.isLoading || isObjectEmpty(dirtyFields)}
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
