import { yupResolver } from "@hookform/resolvers/yup";
import { Button, Typography } from "@mui/material";
import { FC, useEffect, useState } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { connect } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { InputField } from "src/shared/ui/components/InputBlock";
import * as yup from "yup";
import { routes, tabs } from "src/shared/utils/enums";
import { IUpdateContact, useChangeEmailMutation } from "src/shared/api/profile";
import {
  useLazyCheckEmailQuery,
  useLazyCheckStatusVerificationQuery,
  useSendEmailCodeMutation,
} from "../../../shared/api/verification";
import { RootState } from "../../../app/store/store";
import { TUserSlice } from "../../../shared/lib/userSlice";
import { ActionButtons } from "../../../shared/ui/components/ActionButtons";
import styles from "./ConfirmEmail.module.css";

const mapStateToProps = ({ user }: RootState) => ({
  profile: user.profile,
});

type TConfirmEmailComponent = {
  profile: TUserSlice["profile"];
};

export const ConfirmEmailComponent: FC<TConfirmEmailComponent> = ({
  profile,
}) => {
  const { t: translate } = useTranslation();
  const navigate = useNavigate();

  const schema = yup.object({
    identifier: yup
      .string()
      .required(translate("pages.confirmEmail.errors.emailRequired"))
      .max(
        255,
        translate("pages.confirmEmail.errors.emailTooLong", { maxLength: 255 })
      )
      .email(translate("pages.confirmEmail.errors.emailInvalid")),
    code: yup.string(),
  });

  const methods = useForm<IUpdateContact>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      identifier: profile?.email || "",
      code: "",
    },
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const { handleSubmit, setError, getValues, clearErrors, reset } = methods;

  const [changeEmail] = useChangeEmailMutation();
  const [checkEmail] = useLazyCheckEmailQuery();
  const [checkStatusVerification] = useLazyCheckStatusVerificationQuery();
  const [isMailSent, setIsMailSent] = useState(false);
  const [[minute, second], setTime] = useState([0, 0]);
  const { action } = useParams<{ action: string }>();
  const [sendEmailCode, { isLoading: sendEmailCodeLoading }] =
    useSendEmailCodeMutation();
  const [isConfirmedLink, setIsConfirmedLink] = useState(false);

  useEffect(() => {
    reset({
      identifier: profile?.email,
    });
  }, [profile]);

  const requestVerificationCode = async (email: string, resend: boolean) => {
    try {
      const response = await checkEmail(email).unwrap();
      if (response.isExist && response.uniqueRule) {
        setError("identifier", {
          message: translate("pages.confirmEmail.errors.emailAlreadyExists"),
        });
        return;
      }

      await sendEmailCode({
        email: email,
        name: profile.nickname,
        resend,
      }).unwrap();

      setIsMailSent(true);
      setTime([0, 10]);
    } catch (e) {
      console.error("requestVerificationCodeError ", e);
    }
  };

  const onSubmit: SubmitHandler<IUpdateContact> = async (data) => {
    if (isMailSent && !data.code && !isConfirmedLink) {
      setError("code", {
        message: translate("pages.confirmEmail.errors.codeRequired"),
      });
      return;
    }
    if (!data.code && !isConfirmedLink) {
      await requestVerificationCode(data.identifier, false);
      return;
    }

    try {
      await changeEmail(data).unwrap();
      navigate(`/${routes.profile}/${tabs.profile}`);
    } catch (error) {
      console.error("confirmVerificationCodeError", error);
    }
  };

  useEffect(() => {
    let interval: number | null = null;
    if (isMailSent) {
      interval = window.setInterval(() => {
        const email = methods.getValues("identifier");
        if (email) {
          checkStatusVerification(email).then((response: any) => {
            if (response?.data?.status) {
              setIsConfirmedLink(true);
            }
          });
        }
      }, 3000);
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isMailSent]);

  useEffect(() => {
    if (isConfirmedLink && isMailSent) {
      handleSubmit(onSubmit)();
    }
  }, [isConfirmedLink]);

  useEffect(() => {
    const timerID = setInterval(() => {
      if (minute === 0 && second === 0) {
        return;
      } else if (second === 0) {
        setTime([minute - 1, 59]);
      } else {
        setTime([minute, second - 1]);
      }
    }, 1000);

    return () => clearInterval(timerID);
  }, [minute, second]);

  return (
    <div className="page-container">
      <div className="content">
        <div className={styles.container}>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Typography style={{ marginBottom: 24 }} className="title-medium">
                {translate(
                  `pages.confirmEmail.titles.${
                    action === "change" ? "change" : "add"
                  }`
                )}
              </Typography>
              <InputField
                label={translate("pages.confirmEmail.emailLabel")}
                name="identifier"
                description={translate("pages.confirmEmail.emailDescription")}
                disabled={isMailSent}
              >
                {isMailSent && (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => {
                      setIsMailSent(false);
                      setTime([0, 0]);
                      clearErrors();
                    }}
                  >
                    {translate("actionButtons.edit")}
                  </Button>
                )}
              </InputField>
              <InputField
                label={translate("pages.confirmEmail.codeLabel")}
                name="code"
                description={
                  minute !== 0 || second !== 0
                    ? translate("pages.confirmEmail.codeDescriptionTimer", {
                        minutes: minute.toString().padStart(2, "0"),
                        seconds: second.toString().padStart(2, "0"),
                      })
                    : ""
                }
                disabled={!isMailSent}
              >
                {isMailSent && (
                  <Button
                    variant="contained"
                    color="secondary"
                    disabled={minute !== 0 || second !== 0}
                    onClick={() =>
                      requestVerificationCode(getValues("identifier"), true)
                    }
                  >
                    {translate("actionButtons.resend")}
                  </Button>
                )}
              </InputField>
              <ActionButtons
                onCancel={() => navigate(`/${routes.profile}/${tabs.profile}`)}
                submitText={translate(
                  isMailSent ? "actionButtons.confirm" : "actionButtons.getCode"
                )}
                disabled={sendEmailCodeLoading}
              />
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
};

export const ConfirmEmail = connect(mapStateToProps)(ConfirmEmailComponent);
