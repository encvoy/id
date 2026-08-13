import { yupResolver } from "@hookform/resolvers/yup";
import { FC, useEffect } from "react";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { IEditProviderProps } from "src/features/adminPortal/settings/providers/editPanel/EditProvider";
import { isObjectEmpty } from "src/shared/utils/helpers";
import {
  IWebAuthnParams,
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
import {
  buildProviderUpdatePayload,
  ProviderAvatars,
} from "../utils";
import { SwitchBlock } from "@encvoy-id/components";
export const EditWebAuthnProvider: FC<IEditProviderProps> = ({
  isOpen,
  onClose,
  provider,
}) => {
  const { t: translate } = useTranslation();
  const schema = yup.object({
    ...createProviderBaseSchema(translate),
    params: yup.object({
      authenticatorAttachment: yup.boolean().default(false),
    }),
  });
  const methods = useForm<IProvider<IWebAuthnParams>>({
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
      reset(
        {
          ...(provider as IProvider<IWebAuthnParams>),
          params: {
            authenticatorAttachment: false,
            ...((provider?.params as IWebAuthnParams | undefined) || {}),
          },
        } as IProvider<IWebAuthnParams>
      );
    }
  }, [isOpen]);

  const onSubmit: SubmitHandler<IProvider<IWebAuthnParams>> = (data) => {
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
  };

  return (
    <BaseFormProvider<IProvider<IWebAuthnParams>>
      isOpen={isOpen}
      onClose={onClose}
      methods={methods}
      onSubmit={handleSubmit(onSubmit)}
      disabled={updateResult.isLoading || isObjectEmpty(dirtyFields)}
    >
      <ProviderHeader defaultAvatar={ProviderAvatars.WEBAUTHN} />
      <SwitchBlock
        name="params.authenticatorAttachment"
        label={translate("providers.webauthn.typeAuthenticator")}
        description={translate(
          "providers.webauthn.typeAuthenticatorDescription"
        )}
        dataTestId="btn-settings-security-external-keys-use"
        defaultValue={false}
      />
    </BaseFormProvider>
  );
};
