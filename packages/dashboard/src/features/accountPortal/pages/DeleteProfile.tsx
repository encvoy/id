import { yupResolver } from "@hookform/resolvers/yup";
import { FC } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { connect, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import { setNoticeError } from "src/shared/lib/noticesSlice";
import { useDeleteUserMutation } from "src/shared/api/users";
import { TUserSlice } from "src/shared/lib/userSlice";
import { logout } from "src/shared/utils/auth";
import { RootState } from "../../../app/store/store";
import { Typography } from "@mui/material";
import { PasswordTextField } from "../../../shared/ui/components/PasswordTextField.tsx";
import { ActionButtons } from "../../../shared/ui/components/ActionButtons";
import styles from "./DeleteProfile.module.css";

const mapStateToProps = (state: RootState) => ({
  userId: state.user.profile.id,
});

interface IDeleteProfileComponent {
  userId?: TUserSlice["profile"]["id"];
}

const DeleteProfileComponent: FC<IDeleteProfileComponent> = ({ userId }) => {
  const { t: translate } = useTranslation();

  const schema = yup.object({
    password: yup.string().required(translate("errors.requiredField")),
  });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [deleteUser] = useDeleteUserMutation();

  const methods = useForm<{ password: string }>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      password: "",
    },
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const { handleSubmit, setError } = methods;

  const onSubmit: SubmitHandler<{ password: string }> = async (data) => {
    if (userId) {
      try {
        await deleteUser({ id: userId, password: data.password }).unwrap();
        logout();
      } catch (error: any) {
        if (error?.data?.message) {
          setError("password", { message: error?.data?.message });
          return;
        }

        console.error("Error:", error);
        dispatch(
          setNoticeError(
            `${translate("pages.deleteAccount.errors.deletionError")}: ${
              error?.data
            }`
          )
        );
      }
    }
  };

  return (
    <div className="page-container">
      <div className="content">
        <div className={styles.container}>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Typography
                sx={{ marginBottom: "24px" }}
                className="title-medium"
              >
                {translate("pages.deleteAccount.title")}
              </Typography>
              <Typography
                color="custom.error"
                sx={{ marginBottom: "24px" }}
                className="text-14"
              >
                {translate("pages.deleteAccount.description")}
              </Typography>
              <Typography
                color="text.secondary"
                className="text-14"
                sx={{ marginBottom: "8px" }}
              >
                {translate("pages.deleteAccount.passwordConfirmation")}
              </Typography>
              <PasswordTextField nameField="password" />
              <ActionButtons
                onCancel={() => navigate(-1)}
                submitText={translate("actionButtons.delete")}
                onSubmit={handleSubmit(onSubmit)}
              />
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
};

export const DeleteProfile = connect(mapStateToProps)(DeleteProfileComponent);
