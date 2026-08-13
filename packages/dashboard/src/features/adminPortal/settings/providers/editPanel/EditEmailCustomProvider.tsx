import { yupResolver } from "@hookform/resolvers/yup";
import { FC, useEffect } from "react";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { EClaimPrivacyNumber } from "src/shared/utils/enums";
import { isObjectEmpty } from "src/shared/utils/helpers";

import {
  IEmailParams,
  IProvider,
  EProviderType,
  useUpdateAvatarMutation,
  useUpdateProviderMutation,
} from "src/shared/api/provider";
import { BaseFormProvider } from "../components/BaseFormProvider";
import { ProviderHeader } from "../components/ProviderHeader";
import { buildProviderUpdatePayload, ProviderAvatars } from "../utils";
import { IEditProviderProps } from "./EditProvider";
import { EmailFormFields, emailYupSchema } from "../components/EmailFormFields";

export const EditEmailCustomProvider: FC<IEditProviderProps> = ({
  isOpen,
  onClose,
  provider,
}) => {
  const { t: translate } = useTranslation();

  const [updateProvider, updateResult] = useUpdateProviderMutation();
  const [updateAvatar] = useUpdateAvatarMutation();

  const methods = useForm<IProvider<IEmailParams>>({
    resolver: yupResolver(emailYupSchema(translate)) as any,
    mode: "onChange",
    reValidateMode: "onBlur",
    defaultValues: {
      name: "Email",
      avatar: ProviderAvatars.EMAIL_CUSTOM,
      type: EProviderType.EMAIL_CUSTOM,
      params: {
        mail_code_ttl_sec: "900",
      },
      default_public: EClaimPrivacyNumber.private,
    } as IProvider<IEmailParams>,
  });
  const {
    handleSubmit,
    control,
    reset,
    formState: { dirtyFields },
  } = methods;
  const uploadedAvatar = useWatch({ control, name: "avatar" });

  useEffect(() => {
    if (isOpen && provider) {
      reset(provider as IProvider<IEmailParams>);
    }
  }, [isOpen]);

  useEffect(() => {
    if (updateResult.isSuccess) {
      onClose();
    }
  }, [updateResult]);

  const onSubmit: SubmitHandler<IProvider<IEmailParams>> = (data) => {
    if (provider) {
      const payload = buildProviderUpdatePayload(data, dirtyFields);
      updateProvider(payload).then(() => {
        updateAvatar({
          clientId: data.client_id,
          providerId: data.id,
          avatar: uploadedAvatar,
        });
      });
    }
  };

  return (
    <BaseFormProvider<IProvider<IEmailParams>>
      isOpen={isOpen}
      onClose={onClose}
      methods={methods}
      mode="edit"
      onSubmit={handleSubmit(onSubmit)}
      disabled={updateResult.isLoading || isObjectEmpty(dirtyFields)}
    >
      <ProviderHeader
        defaultAvatar={ProviderAvatars.EMAIL_CUSTOM}
        withoutPublicStatus
      />
      <EmailFormFields
        type={EProviderType.EMAIL_CUSTOM}
        clientId={provider?.client_id}
        providerId={provider?.id}
      />
    </BaseFormProvider>
  );
};
