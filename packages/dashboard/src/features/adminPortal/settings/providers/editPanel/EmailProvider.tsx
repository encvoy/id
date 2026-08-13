import { yupResolver } from "@hookform/resolvers/yup";
import { FC, useEffect } from "react";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { isObjectEmpty } from "src/shared/utils/helpers";
import {
  IEmailParams,
  IProvider,
  EProviderType,
  useCreateProviderMutation,
  useUpdateAvatarMutation,
  useUpdateProviderMutation,
} from "src/shared/api/provider";
import { BaseFormProvider } from "../components/BaseFormProvider";
import { buildProviderUpdatePayload, ProviderAvatars } from "../utils";
import { ProviderHeader } from "../components/ProviderHeader";
import { EmailFormFields, emailYupSchema } from "../components/EmailFormFields";
import { IEditProviderProps } from "./EditProvider";

export const EmailProvider: FC<IEditProviderProps> = ({
  isOpen,
  onClose,
  provider,
}) => {
  const { t: translate } = useTranslation();
  const { appId = "", clientId = "" } =
    useParams<{ appId: string; clientId: string }>();

  const [createProvider, createResult] = useCreateProviderMutation();
  const [updateProvider, updateResult] = useUpdateProviderMutation();
  const [updateAvatar] = useUpdateAvatarMutation();

  const methods = useForm<IProvider<IEmailParams>>({
    resolver: yupResolver(emailYupSchema(translate)) as any,
    mode: "onChange",
    reValidateMode: "onBlur",
    defaultValues: {
      name: "Email Service",
      avatar: ProviderAvatars.EMAIL,
    } as IProvider<IEmailParams>,
  });
  const {
    handleSubmit,
    control,
    formState: { dirtyFields },
    reset,
  } = methods;

  const uploadedAvatar = useWatch({ control, name: "avatar" });

  useEffect(() => {
    if (provider && isOpen) {
      reset(provider as IProvider<IEmailParams>);
    }
  }, [isOpen]);

  useEffect(() => {
    if (createResult.isSuccess || updateResult.isSuccess) onClose();
  }, [createResult, updateResult]);

  const onSubmit: SubmitHandler<IProvider<IEmailParams>> = (data) => {
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
          type: EProviderType.EMAIL,
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
    <BaseFormProvider<IProvider<IEmailParams>>
      isOpen={isOpen}
      onClose={onClose}
      methods={methods}
      onSubmit={handleSubmit(onSubmit)}
      title={translate("providers.email.postalService")}
      disabled={
        createResult.isLoading ||
        updateResult.isLoading ||
        isObjectEmpty(dirtyFields)
      }
    >
      <ProviderHeader defaultAvatar={ProviderAvatars.EMAIL} />
      <EmailFormFields
        type={EProviderType.EMAIL}
        clientId={provider?.client_id || clientId || appId}
        providerId={provider?.id}
      />
    </BaseFormProvider>
  );
};
