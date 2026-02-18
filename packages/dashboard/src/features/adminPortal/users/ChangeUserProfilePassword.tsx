import { yupResolver } from "@hookform/resolvers/yup";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { PasswordTextField } from "src/shared/ui/components/PasswordTextField.tsx";
import * as yup from "yup";
import { routes, tabs } from "src/shared/utils/enums";
import { isObjectEmpty } from "src/shared/utils/helpers.ts";
import { setNoticeError } from "src/shared/lib/noticesSlice";
import { useChangePasswordMutation } from "src/shared/api/users";
import { ActionButtons } from "src/shared/ui/components/ActionButtons";
import styles from "../../accountPortal/pages/ChangePassword.module.css";
import Typography from "@mui/material/Typography";
import { componentBorderRadius } from "src/shared/theme/Theme";
import { Box } from "@mui/material";

export const ChangeUserPassword = () => {
  const { t: translate } = useTranslation();
  const { appId = "", userId = "" } =
    useParams<{ appId: string; userId: string }>();
  const navigate = useNavigate();
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
    if (Object.keys(errors).length) return;

    try {
      await changePassword({ ...data, userId });
      navigate(`/${routes.system}/${appId}/${tabs.users}/${userId}`);
    } catch (error) {
      console.error(error);
      dispatch(
        setNoticeError(translate("pages.changePassword.errors.changeError"))
      );
    }
  };

  return (
    <div className="page-container">
      <div className="content">
        <Box
          sx={{ borderRadius: componentBorderRadius }}
          className={styles.container}
        >
          <Typography sx={{ marginBottom: "24px" }} className="title-medium">
            {translate("pages.changePassword.title")}
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ marginBottom: "24px" }}
            className="text-14"
          >
            {translate("pages.changePassword.description")}
          </Typography>
          <Typography sx={{ marginBottom: "8px" }} className="text-14">
            {translate("pages.changePassword.newPassword")}
          </Typography>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <PasswordTextField nameField="password" />
              <ActionButtons
                onCancel={() => navigate(-1)}
                disabled={isObjectEmpty(dirtyFields)}
                submitText={translate("actionButtons.save")}
              />
            </form>
          </FormProvider>
        </Box>
      </div>
    </div>
  );
};
