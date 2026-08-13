import { yupResolver } from "@hookform/resolvers/yup";
import { FC, useEffect, useMemo, useState } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { connect, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import { setNoticeError } from "src/shared/slices/noticesSlice";
import { IDeleteUserResult, useDeleteUserMutation } from "src/shared/api/users";
import { TUserSlice } from "src/shared/slices/userSlice";
import { logout } from "src/shared/utils/auth";
import { RootState } from "../../../app/store/store";
import { Typography } from "@mui/material";
import Button from "@mui/material/Button";
import { PasswordTextField } from "@encvoy-id/components";
import { ActionButtons } from "@encvoy-id/components";
import { SurfaceBlock } from "@encvoy-id/components";
import styles from "./DeleteProfile.module.css";

const mapStateToProps = (state: RootState) => ({
  userId: state.user.profile.id,
});

interface IDeleteProfileComponent {
  userId?: TUserSlice["profile"]["id"];
}

const DeleteProfileComponent: FC<IDeleteProfileComponent> = ({ userId }) => {
  const { t: translate } = useTranslation();
  const [deleteResult, setDeleteResult] = useState<IDeleteUserResult | null>(
    null
  );

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

  useEffect(() => {
    if (!deleteResult) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void logout();
    }, 20000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [deleteResult]);

  const successMessage = useMemo(() => {
    if (!deleteResult) {
      return "";
    }

    if (deleteResult.mode === "deleted") {
      return translate("pages.deleteAccount.success.immediate");
    }

    if (deleteResult.mode === "archived") {
      return translate(
        deleteResult.restore_allowed
          ? "pages.deleteAccount.success.archived"
          : "pages.deleteAccount.success.archivedNoRestore"
      );
    }

    return translate(
      deleteResult.restore_allowed
        ? "pages.deleteAccount.success.scheduled"
        : "pages.deleteAccount.success.scheduledNoRestore",
      {
        days: deleteResult.retention_days,
      }
    );
  }, [deleteResult, translate]);

  const onSubmit: SubmitHandler<{ password: string }> = async (data) => {
    if (userId) {
      try {
        const result = await deleteUser({
          id: userId,
          password: data.password,
        }).unwrap();
        setDeleteResult(result);
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
        <SurfaceBlock className={styles.container}>
          <Typography
            style={{ marginBottom: "12px" }}
            className="text-20-medium"
          >
            {translate(
              deleteResult
                ? "pages.deleteAccount.success.title"
                : "pages.deleteAccount.title"
            )}
          </Typography>

          {deleteResult ? (
            <>
              <Typography
                color="text.secondary"
                sx={{ marginBottom: "16px" }}
                className="text-14"
              >
                {successMessage}
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ marginBottom: "24px" }}
                className="text-14"
              >
                {translate("pages.deleteAccount.success.sessionsRevoked")}
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ marginBottom: "24px" }}
                className="text-14"
              >
                {translate("pages.deleteAccount.success.redirect", {
                  seconds: 20,
                })}
              </Typography>
              <Button variant="contained" onClick={() => void logout()}>
                {translate("pages.deleteAccount.success.exitNow")}
              </Button>
            </>
          ) : (
            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <Typography
                  color="text.secondary"
                  sx={{ marginBottom: "24px" }}
                  className="text-14"
                >
                  {translate("pages.deleteAccount.description")}
                </Typography>
                <Typography className="text-14" sx={{ marginBottom: "8px" }}>
                  {translate("pages.deleteAccount.passwordConfirmation")}
                </Typography>
                <PasswordTextField
                  showText={translate("actionButtons.show")}
                  hideText={translate("actionButtons.hide")}
                  copyText={translate("actionButtons.copy")}
                  nameField="password"
                />
                <ActionButtons
                  cancelText={translate("actionButtons.cancel")}
                  onCancel={() => navigate(-1)}
                  submitText={translate("actionButtons.delete")}
                  onSubmit={handleSubmit(onSubmit)}
                />
              </form>
            </FormProvider>
          )}
        </SurfaceBlock>
      </div>
    </div>
  );
};

export const DeleteProfile = connect(mapStateToProps)(DeleteProfileComponent);
