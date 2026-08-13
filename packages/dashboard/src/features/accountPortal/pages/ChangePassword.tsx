import { yupResolver } from "@hookform/resolvers/yup";
import { FC } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { connect, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { PasswordTextField } from "@encvoy-id/components";
import { ActionButtons } from "@encvoy-id/components";
import * as yup from "yup";
import { setNoticeError } from "src/shared/slices/noticesSlice";
import { useChangePasswordMutation } from "src/shared/api/users";
import { logout } from "src/shared/utils/auth";
import { useGetRuleValidationsByFieldNameQuery } from "../../../shared/api/settings";
import { RootState } from "../../../app/store/store";
import { Typography } from "@mui/material";
import styles from "./ChangePassword.module.css";
import { SurfaceBlock } from "@encvoy-id/components";
import { getLocalizedTextValue } from "src/shared/utils/locales";

const mapStateToProps = (state: RootState) => ({
  userId: state.user.profile.id,
  organizationClientId: state.user.profile.org_id,
  systemClientId: state.app.systemClientId,
});

interface IChangePasswordProps {
  userId?: string;
  organizationClientId?: string | null;
  systemClientId: string | null;
}

export const ChangePasswordComponent: FC<IChangePasswordProps> = ({
  userId,
  organizationClientId,
  systemClientId,
}) => {
  const { t: translate, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [changePassword] = useChangePasswordMutation();

  const schema = yup.object({
    old_password: yup
      .string()
      .required(
        translate("pages.changePassword.errors.currentPasswordRequired")
      ),
    password: yup
      .string()
      .required(translate("pages.changePassword.errors.newPasswordRequired"))
      .notOneOf(
        [yup.ref("old_password")],
        translate("pages.changePassword.errors.passwordsMustDiffer")
      ),
  });
  const { data: rules } = useGetRuleValidationsByFieldNameQuery({
    client_id: organizationClientId || systemClientId || "",
    field_name: "password",
  });

  const methods = useForm<{
    password: string;
    old_password: string;
  }>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      old_password: "",
      password: "",
    },
    mode: "onChange",
  });

  const { handleSubmit } = methods;

  const onSubmit: SubmitHandler<{ old_password: string; password: string }> =
    async (data) => {
      try {
        await changePassword({
          ...data,
          userId: userId || "",
        }).unwrap();
        logout();
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
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <SurfaceBlock className={styles.container}>
              <Typography
                style={{ marginBottom: "12px" }}
                className="text-20-medium"
              >
                {translate("pages.changePassword.title")}
              </Typography>
              <Typography
                color="text.secondary"
                style={{ marginBottom: "24px" }}
                className="text-14"
              >
                {translate("pages.changePassword.description")}
              </Typography>
              <div className={styles.content}>
                <div>
                  <Typography style={{ marginBottom: 8 }} className="text-14">
                    {translate("pages.changePassword.currentPassword")}
                  </Typography>
                  <PasswordTextField
                    showText={translate("actionButtons.show")}
                    hideText={translate("actionButtons.hide")}
                    copyText={translate("actionButtons.copy")}
                    nameField="old_password"
                    dataTestId="txt-profile-password-old"
                  />
                </div>
                <div>
                  <Typography style={{ marginBottom: 8 }} className="text-14">
                    {translate("pages.changePassword.newPassword")}
                  </Typography>
                  <PasswordTextField
                    showText={translate("actionButtons.show")}
                    hideText={translate("actionButtons.hide")}
                    copyText={translate("actionButtons.copy")}
                    nameField="password"
                    dataTestId="txt-profile-password-new"
                  />
                </div>
                {rules && rules.length > 0 ? (
                  <>
                    <Typography color="text.secondary" className="text-14">
                      {translate("pages.changePassword.validationRules")}
                    </Typography>
                    <ul className={styles.rulesList}>
                      {rules.map((rule) => (
                        <li key={rule.id} style={{ marginBottom: 6 }}>
                          <Typography
                            color="text.secondary"
                            className="text-14"
                          >
                            {getLocalizedTextValue(rule.title, i18n.language)}
                          </Typography>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <Typography color="text.secondary" className="text-14">
                    {translate("pages.changePassword.noRules")}
                  </Typography>
                )}
              </div>

              <ActionButtons
                cancelText={translate("actionButtons.cancel")}
                submitButtonDataTestId="btn-profile-password-change"
                onCancel={() => navigate(-1)}
                submitText={translate("actionButtons.edit")}
              />
            </SurfaceBlock>
          </form>
        </FormProvider>
        <div className="zeroBlock"></div>
      </div>
    </div>
  );
};

export const ChangePassword = connect(mapStateToProps)(ChangePasswordComponent);
