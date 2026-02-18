import { yupResolver } from "@hookform/resolvers/yup";
import { FC, useEffect } from "react";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import {
  BaseFormProvider,
  createProviderBaseSchema,
} from "src/features/adminPortal/settings/providers/components/BaseFormProvider";
import * as yup from "yup";
import { isObjectEmpty } from "src/shared/utils/helpers";
import {
  IProvider,
  useUpdateAvatarMutation,
  useUpdateProviderMutation,
} from "src/shared/api/provider";
import { ProviderHeader } from "../components/ProviderHeader";
import { ProviderAvatars } from "../utils";
import { IEditProviderProps } from "./EditProvider";
import { useTranslation } from "react-i18next";

export const EditEthereumProvider: FC<IEditProviderProps> = ({
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
    if (isOpen) {
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
      <ProviderHeader defaultAvatar={ProviderAvatars.ETHEREUM} />
    </BaseFormProvider>
  );
};
