import { yupResolver } from "@hookform/resolvers/yup";
import TextField from "@mui/material/TextField";
import clsx from "clsx";
import { FC, useEffect } from "react";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import { useParams } from "react-router-dom";
import { IconsLibrary } from "src/shared/ui/components/IconLibrary";
import { InputField } from "src/shared/ui/components/InputBlock";
import * as yup from "yup";
import { DOMAIN } from "../../../../../shared/utils/constants";
import {
  IProvider,
  ProviderType,
  useCreateProviderMutation,
  useUpdateAvatarMutation,
} from "../../../../../shared/api/provider";
import {
  BaseFormProvider,
  createProviderBaseSchema,
} from "../components/BaseFormProvider";
import { PasswordTextField } from "../../../../../shared/ui/components/PasswordTextField";
import styles from "../BaseStylesProvider.module.css";
import { ProviderAvatars } from "../utils";
import { ProviderHeader } from "../components/ProviderHeader";
import { ICreateProvider } from "src/features/adminPortal/settings/providers/createPanel/CreateProvider";
import { useTranslation } from "react-i18next";
import { EClaimPrivacyNumber } from "src/shared/utils/enums";
import Typography from "@mui/material/Typography";

export const CreateEthereumProvider: FC<ICreateProvider> = ({
  isOpen,
  onClose,
}) => {
  const { appId = "", clientId = "" } =
    useParams<{ appId: string; clientId: string }>();
  const { t: translate } = useTranslation();

  const schema = yup.object({
    ...createProviderBaseSchema(translate),
    params: yup.object({
      external_client_id: yup
        .string()
        .max(255, translate("errors.valueMaxLength", { maxLength: 255 }))
        .required(translate("errors.requiredField"))
        .matches(/^[^\n ]*$/, {
          message: translate("errors.noSpaces"),
        }),
      external_client_secret: yup
        .string()
        .max(255, translate("errors.valueMaxLength", { maxLength: 255 }))
        .matches(/^[^\n ]*$/, {
          message: translate("errors.noSpaces"),
        }),
    }),
  });

  const methods = useForm<IProvider>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      name: "Ethereum",
      avatar: ProviderAvatars.ETHEREUM,
      type: ProviderType.ETHEREUM,
      params: {},
      default_public: EClaimPrivacyNumber.private,
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

  const onSubmit: SubmitHandler<IProvider> = (data) => {
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
    <BaseFormProvider<IProvider>
      methods={methods}
      onSubmit={handleSubmit(onSubmit)}
      isOpen={isOpen}
      onClose={onClose}
      mode="create"
      type="Ethereum"
      disabled={createResult.isLoading}
    >
      <ProviderHeader defaultAvatar={ProviderAvatars.ETHEREUM} />
      <InputField
        name="params.external_client_id"
        label={translate("providers.ethereum.contractAddress")}
        description={translate("providers.ethereum.contractAddressDescription")}
        required
      />

      <Typography className={clsx("text-14", styles.asterisk, styles.label)}>
        {translate("providers.ethereum.privateKey")}
      </Typography>
      <PasswordTextField nameField="params.external_client_secret" />
      <Typography
        className={clsx("text-14", styles.description)}
        color="text.secondary"
      >
        {translate("providers.ethereum.privateKeyDescription")}
      </Typography>

      <Typography className={clsx("text-14", styles.label)}>
        {translate("providers.ethereum.callbackUrl")}
      </Typography>
      <TextField
        value={DOMAIN + "/api/interaction/code"}
        disabled
        className="custom"
        fullWidth
        variant="standard"
      >
        <IconsLibrary
          type="copy"
          onClick={() =>
            navigator.clipboard.writeText(DOMAIN + "/api/interaction/code")
          }
        />
      </TextField>
      <Typography
        className={clsx("text-14", styles.description)}
        color="text.secondary"
      >
        {translate("providers.ethereum.callbackUrlDescription")}
      </Typography>
    </BaseFormProvider>
  );
};
