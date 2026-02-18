import { yupResolver } from "@hookform/resolvers/yup";
import { FC, useEffect } from "react";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { IEditProviderProps } from "src/features/adminPortal/settings/providers/editPanel/EditProvider";
import { isObjectEmpty } from "src/shared/utils/helpers";
import {
  IProvider,
  useUpdateAvatarMutation,
  useUpdateProviderMutation,
} from "src/shared/api/provider";
import * as yup from "yup";
import {
  BaseFormProvider,
  createProviderBaseSchema,
} from "../components/BaseFormProvider";
import { ProviderHeader } from "../components/ProviderHeader";
import { ProviderAvatars } from "../utils";
export const EditWebAuthnProvider: FC<IEditProviderProps> = ({
  isOpen,
  onClose,
  provider,
}) => {
  const { t: translate } = useTranslation();
  const schema = yup.object({
    ...createProviderBaseSchema(translate),
  });
  const methods = useForm<IProvider>({
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
      reset(provider as IProvider);
    }
  }, [isOpen]);

  const onSubmit: SubmitHandler<IProvider> = (data) => {
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
    <BaseFormProvider<IProvider>
      isOpen={isOpen}
      onClose={onClose}
      methods={methods}
      onSubmit={handleSubmit(onSubmit)}
      disabled={updateResult.isLoading || isObjectEmpty(dirtyFields)}
    >
      <ProviderHeader defaultAvatar={ProviderAvatars.WEBAUTHN} />
    </BaseFormProvider>
  );
};
