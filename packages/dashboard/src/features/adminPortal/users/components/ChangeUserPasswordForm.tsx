import Typography from "@mui/material/Typography";
import { yupResolver } from "@hookform/resolvers/yup";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { setNoticeError, setNoticeInfo } from "src/shared/slices/noticesSlice";
import { useChangePasswordMutation } from "src/shared/api/users";
import { ActionButtons } from "@encvoy-id/components";
import { PasswordTextField } from "@encvoy-id/components";
import { SurfaceBlock } from "@encvoy-id/components";
import { isObjectEmpty } from "src/shared/utils/helpers.ts";
import * as yup from "yup";
import styles from "../../../accountPortal/pages/ChangePassword.module.css";

interface IChangeUserPasswordFormProps {
  userId: string;
  onCancel?: () => void;
  onSuccess?: () => void;
  embedded?: boolean;
}

export const ChangeUserPasswordForm = ({
  userId,
  onCancel,
  onSuccess,
  embedded = false,
}: IChangeUserPasswordFormProps) => {
  const { t: translate } = useTranslation();
  const dispatch = useDispatch();
  const [changePassword] = useChangePasswordMutation();

  const schema = yup.object({
    password: yup
      .string()
      .required(translate("pages.changePassword.errors.newPasswordRequired")),
  });

  const methods = useForm<{
    password: string;
  }>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      password: "",
    },
    mode: "onChange",
  });

  const {
    handleSubmit,
    formState: { errors, dirtyFields },
  } = methods;

  const onSubmit: SubmitHandler<{ password: string }> = async (data) => {
    if (Object.keys(errors).length || !userId) return;

    try {
      await changePassword({ ...data, userId }).unwrap();
      dispatch(setNoticeInfo(translate("info.infoUpdated")));
      onSuccess?.();
    } catch (error) {
      console.error(error);
      dispatch(
        setNoticeError(translate("pages.changePassword.errors.changeError"))
      );
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <SurfaceBlock className={embedded ? undefined : styles.container}>
          <Typography sx={{ marginBottom: "12px" }} className="text-20-medium">
            {translate("pages.changePassword.title")}
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ marginBottom: "24px" }}
            className="text-14"
          >
            {translate("pages.changePassword.description")}
          </Typography>
          <Typography sx={{ marginBottom: "8px" }} className="text-14 asterisk">
            {translate("pages.changePassword.newPassword")}
          </Typography>
          <PasswordTextField
            showText={translate("actionButtons.show")}
            hideText={translate("actionButtons.hide")}
            copyText={translate("actionButtons.copy")}
            nameField="password"
          />
          <ActionButtons
            cancelText={translate("actionButtons.cancel")}
            onCancel={onCancel}
            disabled={isObjectEmpty(dirtyFields)}
            submitText={translate("actionButtons.save")}
          />
        </SurfaceBlock>
      </form>
    </FormProvider>
  );
};
