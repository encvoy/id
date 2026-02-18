import { yupResolver } from "@hookform/resolvers/yup";
import { Button, Typography } from "@mui/material";
import { FC, useEffect, useState } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { connect } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { InputField } from "src/shared/ui/components/InputBlock";
import * as yup from "yup";
import { routes, tabs } from "src/shared/utils/enums";
import { IUpdateContact, useAddPhoneMutation } from "src/shared/api/profile";
import {
  useCallPhoneMutation,
  useLazyCheckPhoneExistsQuery,
} from "../../../shared/api/phone";
import { RootState } from "../../../app/store/store";
import { TUserSlice } from "../../../shared/lib/userSlice";
import { ActionButtons } from "../../../shared/ui/components/ActionButtons";
import { InputPhone } from "../../../shared/ui/InputPhone";
import styles from "./ConfirmPhone.module.css";

const mapStateToProps = ({ user }: RootState) => ({
  profile: user.profile,
});

interface IConfirmPhoneProps {
  profile: TUserSlice["profile"];
}

export const ConfirmPhoneComponent: FC<IConfirmPhoneProps> = ({ profile }) => {
  const { t: translate } = useTranslation();
  const navigate = useNavigate();
  const schema = yup.object({
    identifier: yup
      .string()
      .nullable()
      .required(translate("pages.confirmPhone.errors.phoneRequired"))
      .test(
        "international-phone",
        translate("errors.invalidPhoneFormat"),
        (value) => {
          if (!value) return false;
          const cleaned = value.replace(/[^\d+]/g, "");
          const match = cleaned.match(/^\+(\d{8,15})$/);
          if (!match) return false;

          return true;
        }
      ),
    code: yup.string(),
  });
  const [addPhone] = useAddPhoneMutation();
  const [checkPhoneExists] = useLazyCheckPhoneExistsQuery();
  const [callPhone] = useCallPhoneMutation();
  const [isPhoneCalled, setIsPhoneCalled] = useState(false);
  const [[minute, second], setTime] = useState([0, 0]);
  const [codeType, setCodeType] = useState("");
  const [codeLength, setCodeLength] = useState(0);
  const { action } = useParams<{ action: string }>();

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

  const updatePhoneNumber = (number?: string | null) => {
    return number ? (number.startsWith("+") ? number : `+${number}`) : "";
  };

  const methods = useForm<IUpdateContact>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      identifier: updatePhoneNumber(profile?.phone_number),
      code: "",
    },
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const { handleSubmit, setError, getValues, clearErrors, reset } = methods;

  useEffect(() => {
    reset({
      identifier: updatePhoneNumber(profile?.phone_number),
    });
  }, [profile]);

  const requestVerificationCode = async (phoneNumber: string) => {
    try {
      const response = await checkPhoneExists(phoneNumber).unwrap();
      if (response.isExist) {
        setError("identifier", {
          message: translate("pages.confirmPhone.errors.phoneAlreadyExists"),
        });
        return;
      }

      const result = await callPhone(phoneNumber).unwrap();
      if (result?.success) {
        setIsPhoneCalled(true);
        setTime([1, 30]);
        setCodeType(result.code_type);
        if (result?.code_length) setCodeLength(result.code_length);
      }
    } catch (e) {
      console.error("sendConfirmationCodeError ", e);
    }
  };

  const onSubmit: SubmitHandler<IUpdateContact> = async (data) => {
    if (isPhoneCalled && !data.code) {
      setError("code", {
        message: translate("pages.confirmPhone.errors.codeRequired"),
      });
      return;
    }
    if (!data.code) {
      requestVerificationCode(data.identifier);
      return;
    }

    try {
      await addPhone({
        identifier: data.identifier,
        code: data.code,
      }).unwrap();
      navigate(`/${routes.profile}/${tabs.profile}`);
    } catch (error) {
      console.error("confirmVerificationCodeError", error);
    }
  };

  const dynamicText =
    codeLength === 4
      ? translate("pages.confirmPhone.codeMessages.lastDigitsFour")
      : translate("pages.confirmPhone.codeMessages.lastDigits", {
          count: codeLength,
        });

  const showMessage = (codeType: string) => {
    switch (codeType) {
      case "number":
        return translate("pages.confirmPhone.codeMessages.number", {
          digits: dynamicText,
        });
      case "voice":
        return translate("pages.confirmPhone.codeMessages.voice");
      case "sms":
        return translate("pages.confirmPhone.codeMessages.sms");
    }
  };

  return (
    <div className="page-container">
      <div className="content">
        <div className={styles.container}>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Typography style={{ marginBottom: 24 }} className="title-medium">
                {translate(
                  `pages.confirmPhone.titles.${
                    action === "change" ? "change" : "add"
                  }`
                )}
              </Typography>
              <InputPhone
                label={translate("pages.confirmPhone.phoneLabel")}
                name="identifier"
                description={translate("pages.confirmPhone.phoneDescription")}
                disabled={isPhoneCalled}
              >
                {isPhoneCalled && (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => {
                      setIsPhoneCalled(false);
                      setTime([0, 0]);
                      clearErrors();
                    }}
                  >
                    {translate("actionButtons.edit")}
                  </Button>
                )}
              </InputPhone>
              <InputField
                label={translate("pages.confirmPhone.codeLabel")}
                name="code"
                description={
                  minute !== 0 || second !== 0
                    ? translate("pages.confirmPhone.codeDescriptionTimer", {
                        minutes: minute.toString().padStart(2, "0"),
                        seconds: second.toString().padStart(2, "0"),
                      })
                    : ""
                }
                disabled={!isPhoneCalled}
              >
                {isPhoneCalled && (
                  <Button
                    variant="contained"
                    color="secondary"
                    disabled={minute !== 0 || second !== 0}
                    onClick={() =>
                      requestVerificationCode(getValues("identifier"))
                    }
                  >
                    {translate("actionButtons.resend")}
                  </Button>
                )}
              </InputField>
              {codeType && (
                <Typography className="text-14">
                  {showMessage(codeType)}
                </Typography>
              )}
              <ActionButtons
                onCancel={() => navigate(`/${routes.profile}/${tabs.profile}`)}
                submitText={translate(
                  isPhoneCalled
                    ? "actionButtons.confirm"
                    : "actionButtons.getCode"
                )}
              />
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
};

export const ConfirmPhone = connect(mapStateToProps)(ConfirmPhoneComponent);
