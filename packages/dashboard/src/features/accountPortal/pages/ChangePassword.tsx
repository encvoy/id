import { yupResolver } from "@hookform/resolvers/yup";
import { FC } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { connect, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { PasswordTextField } from "src/shared/ui/components/PasswordTextField";
import { ActionButtons } from "src/shared/ui/components/ActionButtons";
import * as yup from "yup";
import { setNoticeError } from "src/shared/lib/noticesSlice";
import { useChangePasswordMutation } from "src/shared/api/users";
import { logout } from "src/shared/utils/auth";
import { useGetRuleValidationsByFieldNameQuery } from "../../../shared/api/settings";
import { RootState } from "../../../app/store/store";
import { Box, Typography } from "@mui/material";
import styles from "./ChangePassword.module.css";
import { componentBorderRadius } from "src/shared/theme/Theme";

const mapStateToProps = (state: RootState) => ({
  userId: state.user.profile.id,
});

interface IChangePasswordProps {
  userId?: string;
}

export const ChangePasswordComponent: FC<IChangePasswordProps> = ({
  userId,
}) => {
  const { t: translate } = useTranslation();
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
  const { data: rules } = useGetRuleValidationsByFieldNameQuery("password");

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
        <Box
          className={styles.container}
          sx={{ borderRadius: componentBorderRadius }}
        >
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Typography style={{ marginBottom: 24 }} className="title-medium">
                {translate("pages.changePassword.title")}
              </Typography>
              <Typography
                color="text.secondary"
                style={{ marginBottom: 24 }}
                className="text-14"
              >
                {translate("pages.changePassword.description")}
              </Typography>
              <div className={styles.content}>
                <div>
                  <Typography style={{ marginBottom: 8 }} className="text-14">
                    {translate("pages.changePassword.currentPassword")}
                  </Typography>
                  <PasswordTextField nameField="old_password" />
                </div>
                <div>
                  <Typography style={{ marginBottom: 8 }} className="text-14">
                    {translate("pages.changePassword.newPassword")}
                  </Typography>
                  <PasswordTextField nameField="password" />
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
                            {rule.title}
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
                onCancel={() => navigate(-1)}
                submitText={translate("actionButtons.edit")}
              />
            </form>
          </FormProvider>
        </Box>
        <div className="zeroBlock"></div>
      </div>
    </div>
  );
};

export const ChangePassword = connect(mapStateToProps)(ChangePasswordComponent);
