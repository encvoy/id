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
  IWebAuthnParams,
  IProvider,
  EProviderType,
  useCreateProviderMutation,
  useUpdateAvatarMutation,
} from "src/shared/api/provider";
import * as yup from "yup";
import { ProviderAvatars } from "src/features/adminPortal/settings/providers/utils";
import { ProviderHeader } from "src/features/adminPortal/settings/providers/components/ProviderHeader";
import { useTranslation } from "react-i18next";
import { EClaimPrivacyNumber } from "src/shared/utils/enums";
import { SwitchBlock } from "@encvoy-id/components";

export const CreateWebAuthnProvider: FC<ICreateProvider> = ({
  isOpen,
  onClose,
}) => {
  const { appId = "", clientId = "" } =
    useParams<{ appId: string; clientId: string }>();
  const { t: translate } = useTranslation();

  const schema = yup.object({
    ...createProviderBaseSchema(translate),
    params: yup.object({
      authenticatorAttachment: yup.boolean().default(false),
    }),
  });

  const methods = useForm<IProvider<IWebAuthnParams>>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      name: "WebAuthn",
      avatar: ProviderAvatars.WEBAUTHN,
      type: EProviderType.WEBAUTHN,
      default_public: EClaimPrivacyNumber.private,
      params: {
        authenticatorAttachment: false,
      },
    } as IProvider<IWebAuthnParams>,
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

  const onSubmit: SubmitHandler<IProvider<IWebAuthnParams>> = (data) => {
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
    <BaseFormProvider<IProvider<IWebAuthnParams>>
      isOpen={isOpen}
      onClose={onClose}
      methods={methods}
      onSubmit={handleSubmit(onSubmit)}
      mode="create"
      type="WebAuthn"
      disabled={createResult.isLoading}
    >
      <ProviderHeader defaultAvatar={ProviderAvatars.WEBAUTHN} />
      <SwitchBlock
        name="params.authenticatorAttachment"
        label={translate("providers.webauthn.typeAuthenticator")}
        description={translate(
          "providers.webauthn.typeAuthenticatorDescription"
        )}
        defaultValue={false}
      />
    </BaseFormProvider>
  );
};
