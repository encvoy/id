import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import clsx from "clsx";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { CustomIcon } from "@encvoy-id/components";
import { PasswordTextField } from "@encvoy-id/components";
import styles from "../BaseStylesProvider.module.css";
import { useDispatch, useSelector } from "react-redux";
import { useFormContext } from "react-hook-form";
import {
  EProviderType,
  useSendTestEmailProviderMutation,
} from "src/shared/api/provider";
import { RootState } from "src/app/store/store";
import { setNoticeError, setNoticeInfo } from "src/shared/slices/noticesSlice";
import { tabs } from "src/shared/utils/enums";
import * as yup from "yup";
import { createProviderBaseSchema } from "./BaseFormProvider";
import { TFunction } from "i18next";
import { InputField } from "@encvoy-id/components";

export const emailYupSchema = (translate: TFunction) =>
  yup.object({
    ...createProviderBaseSchema(translate),
    params: yup.object({
      root_mail: yup
        .string()
        .required(translate("errors.requiredField"))
        .max(255, translate("errors.valueMaxLength", { maxLength: 255 }))
        .email(translate("errors.invalidEmailFormat")),
      mail_hostname: yup
        .string()
        .max(2000, translate("errors.valueMaxLength", { maxLength: 2000 }))
        .required(translate("errors.requiredField")),
      mail_port: yup
        .string()
        .required(translate("errors.requiredField"))
        .matches(/^\d+$/, translate("errors.mustBeNumber"))
        .test(
          "mail-port-range",
          translate("errors.invalidPort"),
          (value) =>
            value === undefined ||
            (Number(value) >= 1 && Number(value) <= 65535)
        ),
      mail_password: yup.string().required(translate("errors.requiredField")),
      mail_code_ttl_sec: yup
        .string()
        .required(translate("errors.requiredField"))
        .matches(/^[1-9]\d*$/, translate("errors.mustBePositiveNumber"))
        .max(10, translate("errors.valueMaxLength", { maxLength: 10 })),
      alias: yup
        .string()
        .max(255, translate("errors.valueMaxLength", { maxLength: 255 })),
    }),
  });

interface IEmailFormFieldsProps {
  type: EProviderType.EMAIL | EProviderType.EMAIL_CUSTOM;
  clientId?: string;
  providerId?: string;
}

export const EmailFormFields: FC<IEmailFormFieldsProps> = ({
  type,
  clientId,
  providerId,
}) => {
  const { t: translate } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const startRoutePath = useSelector(
    (state: RootState) => state.app.startRoutePath
  );
  const { appId = "", clientId: routeClientId = "" } =
    useParams<{ appId: string; clientId?: string }>();
  const { trigger, getValues } = useFormContext();
  const [isSendIconAnimating, setIsSendIconAnimating] = useState(false);

  const [sendTestEmailProvider, sendTestEmailResult] =
    useSendTestEmailProviderMutation();

  const handleSendTestEmailClick = () => {
    setIsSendIconAnimating(true);

    setTimeout(() => {
      setIsSendIconAnimating(false);
      handleSendTestEmail();
    }, 500);
  };

  const handleSendTestEmail = async () => {
    const isValid = await trigger([
      "params.root_mail",
      "params.mail_hostname",
      "params.mail_port",
      "params.mail_password",
      "params.mail_code_ttl_sec",
      "params.alias",
    ]);
    if (!isValid) return;

    const targetClientId = clientId || routeClientId;
    const params = getValues("params");
    if (!params) return;

    try {
      await sendTestEmailProvider({
        clientId: targetClientId,
        type: type,
        params,
      }).unwrap();

      dispatch(setNoticeInfo(translate("info.testEmailSent")));
    } catch {
      dispatch(setNoticeError(translate("info.testEmailSendError")));
    }
  };

  const handleOpenEmailTemplates = () => {
    if (!providerId) {
      return;
    }

    const targetClientId = clientId || routeClientId;
    const targetRoute =
      targetClientId && targetClientId !== appId
        ? `/${startRoutePath}/${appId}/${tabs.clients}/${targetClientId}/${tabs.emailTemplates}/${providerId}`
        : `/${startRoutePath}/${appId}/${tabs.emailTemplates}/${providerId}`;

    navigate(targetRoute);
  };

  return (
    <>
      <InputField
        name="params.root_mail"
        label={translate("providers.email.rootMail")}
        description={translate("providers.email.rootMailDescription")}
        dataTestId="txt-settings-email-main-adress"
        required
      />

      <InputField
        name="params.alias"
        label={translate("providers.email.alias")}
        description={translate("providers.email.aliasDescription")}
        dataTestId="txt-settings-email-sender-alias"
      />

      <InputField
        name="params.mail_hostname"
        label={translate("providers.email.mailHostname")}
        description={translate("providers.email.mailHostnameDescription")}
        dataTestId="txt-settings-email-smtp-server"
        required
      />
      <InputField
        name="params.mail_port"
        label={translate("providers.email.mailPort")}
        description={translate("providers.email.mailPortDescription")}
        dataTestId="txt-settings-email-smtp-port"
        type="number"
        inputProps={{ min: 1, max: 65535, step: 1 }}
        required
      />

      <Typography className={clsx("text-14", styles.label, "asterisk")}>
        {translate("providers.email.mailPassword")}
      </Typography>
      <PasswordTextField
        showText={translate("actionButtons.show")}
        hideText={translate("actionButtons.hide")}
        copyText={translate("actionButtons.copy")}
        nameField="params.mail_password"
        dataTestId="txt-settings-email-password"
      />
      <Typography
        className={clsx("text-14", styles.description)}
        color="text.secondary"
      >
        {translate("providers.email.mailPasswordDescription")}
      </Typography>

      <InputField
        name="params.mail_code_ttl_sec"
        label={translate("providers.email.mailCodeTtlSec")}
        description={translate("providers.email.mailCodeTtlSecDescription")}
        dataTestId="txt-settings-email-verification-code"
        type="number"
        inputProps={{ min: 1, step: 1 }}
        required
      />

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          gap: "20px",
        }}
      >
        <Box>
          <Typography className={clsx("text-14", styles.label)}>
            {translate("providers.email.sendTestEmail")}
          </Typography>
          <Typography
            className={clsx("text-14", styles.description)}
            color="text.secondary"
          >
            {translate("providers.email.sendTestEmailDescription")}
          </Typography>
        </Box>
        <Button
          type="button"
          className={styles.iconButton}
          variant="contained"
          color="secondary"
          onClick={handleSendTestEmailClick}
          disabled={sendTestEmailResult.isLoading}
          data-test-id="btn-settings-email-send-test"
          startIcon={
            <CustomIcon
              Icon={SendOutlinedIcon}
              color="secondaryContrast"
              className={clsx(
                styles.iconSend,
                isSendIconAnimating && styles.iconAnimate
              )}
            />
          }
        />
      </Box>

      {clientId && providerId && (
        <>
          <Box sx={{ marginTop: "24px" }}>
            <div className={styles.fieldRow}>
              <Typography className="text-14">
                {translate("panel.mailTemplate.title")}
              </Typography>
              <Button
                type="button"
                variant="text"
                onClick={handleOpenEmailTemplates}
                data-test-id="btn-settings-email-templates-settings"
              >
                {translate("actionButtons.configure")}
              </Button>
            </div>
            <Typography
              className={clsx("text-14", styles.description)}
              color="text.secondary"
            >
              {translate("panel.mailTemplate.description")}
            </Typography>
          </Box>
        </>
      )}
    </>
  );
};
