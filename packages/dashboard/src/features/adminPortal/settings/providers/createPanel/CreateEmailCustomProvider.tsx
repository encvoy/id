import { yupResolver } from "@hookform/resolvers/yup";
import { FC, useEffect } from "react";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { EClaimPrivacyNumber } from "src/shared/utils/enums";
import {
  IEmailParams,
  IProvider,
  EProviderType,
  useCreateProviderMutation,
  useUpdateAvatarMutation,
} from "src/shared/api/provider";
import { BaseFormProvider } from "../components/BaseFormProvider";
import { ProviderHeader } from "../components/ProviderHeader";
import { ProviderAvatars } from "../utils";
import { ICreateProvider } from "./CreateProvider";
import { EmailFormFields, emailYupSchema } from "../components/EmailFormFields";

export const CreateEmailCustomProvider: FC<ICreateProvider> = ({
  isOpen,
  onClose,
}) => {
  const { t: translate } = useTranslation();
  const { appId = "", clientId = "" } =
    useParams<{ appId: string; clientId: string }>();

  const [createProvider, createResult] = useCreateProviderMutation();
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
  const { handleSubmit, control, reset } = methods;
  const uploadedAvatar = useWatch({ control, name: "avatar" });

  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen]);

  useEffect(() => {
    if (createResult.isSuccess) onClose(true);
  }, [createResult]);

  const onSubmit: SubmitHandler<IProvider<IEmailParams>> = (data) => {
    createProvider({
      body: {
        ...data,
        type: EProviderType.EMAIL_CUSTOM,
      },
      clientId: clientId || appId,
    })
      .unwrap()
      .then((provider) => {
        if (provider.id) {
          updateAvatar({
            clientId: clientId || appId,
            providerId: provider.id,
            avatar: uploadedAvatar,
          }).unwrap();
        }
      });
  };

  return (
    <BaseFormProvider<IProvider<IEmailParams>>
      isOpen={isOpen}
      onClose={onClose}
      methods={methods}
      mode="create"
      type="Email"
      onSubmit={handleSubmit(onSubmit)}
      disabled={createResult.isLoading}
    >
      <ProviderHeader defaultAvatar={ProviderAvatars.EMAIL_CUSTOM} />
      <EmailFormFields type={EProviderType.EMAIL_CUSTOM} />
    </BaseFormProvider>
  );
};
