import { yupResolver } from "@hookform/resolvers/yup";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import clsx from "clsx";
import { FC, useEffect } from "react";
import {
  Controller,
  FormProvider,
  SubmitHandler,
  useForm,
} from "react-hook-form";
import { useDispatch } from "react-redux";
import { IconsLibrary } from "src/shared/ui/components/IconLibrary";
import { InputField } from "src/shared/ui/components/InputBlock";
import {
  findDuplicateIndex,
  isObjectEmpty,
  isUrl,
} from "src/shared/utils/helpers";
import { setNoticeInfo } from "src/shared/lib/noticesSlice";
import { IClientFull, useUpdateClientMutation } from "src/shared/api/clients";
import * as yup from "yup";
import { CLIENT_ID } from "src/shared/utils/constants";
import { UriSchema, redirectUriSchema } from "../../clients/pages/CreateClient";
import { PasswordTextField } from "../../../../shared/ui/components/PasswordTextField";
import { AccordionBlock } from "src/shared/ui/components/AccordionBlock";
import { ArrayTextFields } from "./SettingsArrayFields";
import styles from "./SettingsParams.module.css";
import { useTranslation } from "react-i18next";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";

export enum EAuthMethodType {
  client_secret_basic = "client_secret_basic",
  client_secret_post = "client_secret_post",
  client_secret_jwt = "client_secret_jwt",
  private_key_jwt = "private_key_jwt",
  none = "none",
}

export enum ESigningAlgTypes {
  RS256 = "RS256",
  PS256 = "PS256",
}

export enum ESubjectTypeVariant {
  public = "public",
  pairwise = "pairwise",
}

export enum EApplicationTypeVariant {
  web = "web",
  native = "native",
}

export enum EResponseTypes {
  code_token = "code token",
  code_id_token_token = "code id_token token",
  code_id_token = "code id_token",
  code = "code",
  id_token = "id_token",
  none = "none",
}

export enum EGrantTypes {
  authorization_code = "authorization_code",
  implicit = "implicit",
  refresh_token = "refresh_token",
}

interface ISettingsHeaderProps {
  client: IClientFull;
}

export const SettingsParams: FC<ISettingsHeaderProps> = ({ client }) => {
  const { t: translate } = useTranslation();
  const dispatch = useDispatch();
  const [updateClient, updateClientResult] = useUpdateClientMutation();

  const schema = yup.object({
    client_id: yup
      .string()
      .max(255, translate("errors.valueMaxLength", { maxLength: 255 }))
      .required(translate("errors.requiredField"))
      .matches(/^[^\n ]*$/, {
        message: translate("errors.noSpaces"),
      })
      .matches(/^[A-Za-z0-9_-]+$/, {
        message: translate("pages.settings.errors.allowedChars"),
      }),
    client_secret: yup
      .string()
      .max(255, translate("errors.valueMaxLength", { maxLength: 255 }))
      .required(translate("errors.requiredField")),
    domain: yup
      .string()
      .max(2000, translate("errors.valueMaxLength", { maxLength: 2000 }))
      .test(
        "is-url",
        translate("errors.invalidUrlFormat"),
        (value?: string) => {
          if (!value) return true;
          return isUrl(value);
        }
      )
      .required(translate("errors.requiredField")),
    redirect_uris: yup.array().of(redirectUriSchema(translate)),
    post_logout_redirect_uris: yup.array().of(UriSchema(translate)),
    request_uris: yup.array().of(UriSchema(translate)),
    access_token_ttl: yup
      .number()
      .typeError(translate("errors.mustBeNumber"))
      .min(0, translate("errors.mustBePositiveNumber"))
      .required(translate("errors.requiredField")),
    refresh_token_ttl: yup
      .number()
      .typeError(translate("errors.mustBeNumber"))
      .min(0, translate("errors.mustBePositiveNumber"))
      .required(translate("errors.requiredField")),
  });

  const methods = useForm<IClientFull>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      ...client,
      redirect_uris:
        client.redirect_uris.length === 0 ? [""] : client.redirect_uris,
      post_logout_redirect_uris:
        client.post_logout_redirect_uris.length === 0
          ? [""]
          : client.post_logout_redirect_uris,
      request_uris:
        client.request_uris.length === 0 ? [""] : client.request_uris,
    },
    mode: "onChange",
  });

  const {
    register,
    control,
    setValue,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
    watch,
    setError,
  } = methods;

  useEffect(() => {
    if (updateClientResult.isSuccess) {
      dispatch(setNoticeInfo(translate("info.infoUpdated")));
    }
  }, [updateClientResult]);

  const onSubmit: SubmitHandler<IClientFull> = async (data) => {
    try {
      const indexDuplicate = findDuplicateIndex(data.redirect_uris);
      if (indexDuplicate !== -1) {
        setError(`redirect_uris.${indexDuplicate}`, {
          message: translate("errors.valuesShouldNotRepeat"),
        });
        return;
      }
      if (Object.keys(errors).length) return;
      const payload: Partial<IClientFull> = (
        Object.keys(dirtyFields) as Array<keyof typeof data>
      ).reduce(
        (acc, field) => ({ ...acc, [field]: data[field] }),
        {} as Partial<IClientFull>
      );

      await updateClient({ client_id: client.client_id, ...payload }).unwrap();
      reset(data);
    } catch (e) {
      console.error("err", e);
    }
  };

  const watchResponseTypes = watch("response_types") || [];
  const watchGrantTypes = watch("grant_types") || [];
  const isAdminClient = client.client_id === CLIENT_ID;

  return (
    <>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <AccordionBlock title={translate("pages.settings.sections.params")}>
            <InputField
              name="client_id"
              label={translate("pages.settings.labels.clientId")}
              description={translate("pages.settings.descriptions.clientId")}
              disabled
            >
              <IconsLibrary
                type="copy"
                onClick={() => navigator.clipboard.writeText(client.client_id)}
              />
            </InputField>

            <Typography
              className={clsx(
                "text-14",
                styles.asterisk,
                styles["input-title"]
              )}
            >
              {translate("pages.settings.labels.clientSecret")}
            </Typography>
            <PasswordTextField
              nameField={"client_secret"}
              showCopyButton
              disabled={isAdminClient}
            />
            <Typography
              className={clsx("text-14", styles["input-subtitle"])}
              color="text.secondary"
            >
              {translate("pages.settings.descriptions.clientSecret")}
            </Typography>
            <InputField
              name="domain"
              label={translate("pages.settings.labels.domain")}
              required
              disabled={isAdminClient}
              description={translate("pages.settings.descriptions.domain")}
            />
            <div className={styles["switch-wrapper"]}>
              <div>
                <Typography className="text-14">
                  {translate("pages.settings.labels.restrictedAccess")}
                </Typography>
                <Typography className="text-12" color="text.secondary">
                  {translate("pages.settings.descriptions.restrictedAccess")}
                </Typography>
              </div>
              <Switch
                defaultChecked={client?.authorize_only_admins || false}
                {...register("authorize_only_admins")}
              />
            </div>
            <div className={styles["switch-wrapper"]}>
              <div>
                <Typography className="text-14">
                  {translate("pages.settings.labels.onlyEmployees")}
                </Typography>
                <Typography className="text-12" color="text.secondary">
                  {translate("pages.settings.descriptions.onlyEmployees")}
                </Typography>
              </div>
              <Switch
                defaultChecked={client?.authorize_only_employees || false}
                {...register("authorize_only_employees")}
              />
            </div>

            <ArrayTextFields
              name="redirect_uris"
              title={translate("pages.settings.labels.redirectUri")}
              description={translate("pages.settings.descriptions.redirectUri")}
              required
              disabled={isAdminClient}
            />

            <ArrayTextFields
              name="post_logout_redirect_uris"
              title={translate("pages.settings.labels.postLogoutUri")}
              description={translate(
                "pages.settings.descriptions.postLogoutUri"
              )}
              required
              disabled={isAdminClient}
            />

            <ArrayTextFields
              name="request_uris"
              title={translate("pages.settings.labels.requestUri")}
              description={translate("pages.settings.descriptions.requestUri")}
              disabled={isAdminClient}
            />

            <Typography className={clsx("text-14", styles["input-title"])}>
              {translate("pages.settings.labels.responseTypes")}
            </Typography>
            <div className={styles["type-buttons-wrapper"]}>
              {Object.values(EResponseTypes)?.map((type) => (
                <Button
                  variant={
                    watchResponseTypes?.find((findType) => findType === type)
                      ? "contained"
                      : "outlined"
                  }
                  className={styles.typeButton}
                  disabled={
                    isAdminClient ||
                    (type === EResponseTypes.code ||
                    type === EResponseTypes.none
                      ? false
                      : !watchGrantTypes?.includes(EGrantTypes.implicit))
                  }
                  onClick={() => {
                    setValue(
                      "response_types",
                      watchResponseTypes.find((findType) => findType === type)
                        ? watchResponseTypes.filter(
                            (filterType) => filterType !== type
                          )
                        : [...watchResponseTypes, type],
                      { shouldDirty: true }
                    );
                  }}
                  key={type}
                >
                  {type}
                </Button>
              ))}
            </div>
            <Typography className={clsx("text-14", styles["input-title"])}>
              {translate("pages.settings.labels.grantTypes")}
            </Typography>
            <div className={styles["type-buttons-wrapper"]}>
              {Object.values(EGrantTypes).map((type) => (
                <Button
                  className={styles.typeButton}
                  variant={
                    watchGrantTypes?.find((findType) => findType === type)
                      ? "contained"
                      : "outlined"
                  }
                  onClick={() => {
                    const newGrantTypes = watchGrantTypes.find(
                      (findType) => findType === type
                    )
                      ? watchGrantTypes.filter(
                          (filterType) => filterType !== type
                        )
                      : [...watchGrantTypes, type];
                    if (!newGrantTypes.includes(EGrantTypes.implicit))
                      setValue(
                        "response_types",
                        watchResponseTypes.filter(
                          (type) =>
                            type === EResponseTypes.code ||
                            type === EResponseTypes.none
                        )
                      );

                    setValue("grant_types", newGrantTypes, {
                      shouldDirty: true,
                    });
                  }}
                  disabled={isAdminClient}
                  key={type}
                >
                  {type}
                </Button>
              ))}
            </div>
            <Typography className={clsx("text-14", styles["input-title"])}>
              {translate("pages.settings.labels.tokenAuthMethod")}
            </Typography>
            <Controller
              control={control}
              name="token_endpoint_auth_method"
              defaultValue={EAuthMethodType.client_secret_basic}
              render={({ field }) => (
                <Select
                  disabled={isAdminClient}
                  style={{ width: "100%", marginBottom: 32 }}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                >
                  {Object.keys(EAuthMethodType).map((variant) => (
                    <MenuItem
                      key={variant}
                      value={variant}
                      className="custom-select"
                    >
                      {variant}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            <Typography className={clsx("text-14", styles["input-title"])}>
              {translate("pages.settings.labels.introspectionAuthMethod")}
            </Typography>
            <Controller
              control={control}
              name="introspection_endpoint_auth_method"
              defaultValue={EAuthMethodType.client_secret_basic}
              render={({ field }) => (
                <Select
                  disabled={isAdminClient}
                  style={{ width: "100%", marginBottom: 32 }}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                >
                  {Object.keys(EAuthMethodType).map((variant) => (
                    <MenuItem
                      key={variant}
                      value={variant}
                      className="custom-select"
                    >
                      {variant}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            <Typography className={clsx("text-14", styles["input-title"])}>
              {translate("pages.settings.labels.revocationAuthMethod")}
            </Typography>
            <Controller
              control={control}
              name="revocation_endpoint_auth_method"
              defaultValue={EAuthMethodType.client_secret_basic}
              render={({ field }) => (
                <Select
                  disabled={isAdminClient}
                  style={{ width: "100%", marginBottom: 32 }}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                >
                  {Object.keys(EAuthMethodType).map((variant) => (
                    <MenuItem
                      key={variant}
                      value={variant}
                      className="custom-select"
                    >
                      {variant}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            <Typography className={clsx("text-14", styles["input-title"])}>
              {translate("pages.settings.labels.idTokenSignAlg")}
            </Typography>
            <Controller
              control={control}
              name="id_token_signed_response_alg"
              render={({ field }) => (
                <Select
                  disabled={isAdminClient}
                  style={{ width: "100%" }}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                >
                  {Object.keys(ESigningAlgTypes).map((variant) => (
                    <MenuItem
                      key={variant}
                      value={variant}
                      className="custom-select"
                    >
                      {variant}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            <div className={styles["switch-wrapper"]}>
              <Typography className="text-14">
                {translate("pages.settings.labels.requireAuthTime")}
              </Typography>
              <Switch
                defaultChecked={client?.require_auth_time || false}
                {...register("require_auth_time")}
              />
            </div>
            <Typography className={clsx("text-14", styles["input-title"])}>
              {translate("pages.settings.labels.subjectType")}
            </Typography>
            <Controller
              control={control}
              name="subject_type"
              defaultValue={ESubjectTypeVariant.public}
              render={({ field }) => (
                <Select
                  disabled={isAdminClient}
                  style={{ width: "100%", marginBottom: 32 }}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                >
                  {["public", "pairwise"].map((type) => (
                    <MenuItem key={type} value={type} className="custom-select">
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            <Typography className={clsx("text-14", styles["input-title"])}>
              {translate("pages.settings.labels.applicationType")}
            </Typography>
            <Controller
              control={control}
              name="application_type"
              defaultValue={EApplicationTypeVariant.web}
              render={({ field }) => (
                <Select
                  disabled={isAdminClient}
                  style={{ width: "100%", marginBottom: 32 }}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  IconComponent={KeyboardArrowDownOutlinedIcon}
                >
                  {["web", "native"].map((type) => (
                    <MenuItem key={type} value={type} className="custom-select">
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            <InputField
              required
              name="access_token_ttl"
              label={translate("pages.settings.labels.accessTokenTtl")}
              description={translate(
                "pages.settings.descriptions.accessTokenTtl"
              )}
            />
            <InputField
              required
              name="refresh_token_ttl"
              label={translate("pages.settings.labels.refreshTokenTtl")}
              description={translate(
                "pages.settings.descriptions.refreshTokenTtl"
              )}
            />
            <div className={styles["submit-buttons"]}>
              <Button
                className={styles["create-button"]}
                type="submit"
                variant="contained"
                disabled={isObjectEmpty(dirtyFields)}
              >
                {translate("actionButtons.save")}
              </Button>
            </div>
          </AccordionBlock>
        </form>
      </FormProvider>
    </>
  );
};
