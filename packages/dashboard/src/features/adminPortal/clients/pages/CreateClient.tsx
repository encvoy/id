import { yupResolver } from "@hookform/resolvers/yup";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import MenuItem from "@mui/material/MenuItem";
import clsx from "clsx";
import { FC, FocusEvent } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { connect } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { InputField } from "src/shared/ui/components/InputBlock";
import { tabs } from "src/shared/utils/enums";
import {
  IClientFull,
  useCreateClientMutation,
  useUpdateAvatarClientMutation,
} from "src/shared/api/clients";
import {
  useGetCatalogEnabledQuery,
  useGetClientTypesQuery,
} from "src/shared/api/settings";
import * as yup from "yup";
import { findDuplicateIndex, isUrl } from "src/shared/utils/helpers";
import { RootState } from "../../../../app/store/reducer";
import { ArrayTextFields } from "src/features/adminPortal/settings/components/SettingsArrayFields";
import { ActionButtons } from "../../../../shared/ui/components/ActionButtons";
import { SwitchBlock } from "../../../../shared/ui/components/SwitchBlock";
import { UploadAndDisplayImage } from "../../../../shared/ui/UploadAndDisplayImage";
import styles from "./CreateClient.module.css";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";

const baseUriSchema = (translate: any) =>
  yup
    .string()
    .max(2000, translate("errors.valueMaxLength", { maxLength: 2000 }))
    .test("is-url", translate("errors.invalidUrlFormat"), (value?: string) => {
      if (!value) return true;
      return isUrl(value);
    });

export const redirectUriSchema = (translate: any) =>
  baseUriSchema(translate).required(translate("errors.requiredField"));
export const UriSchema = (translate: any) => baseUriSchema(translate);

export const requestUriSchema = (translate: any) =>
  yup.object({
    value: yup
      .string()
      .required(translate("errors.requiredField"))
      .max(2000, translate("errors.valueMaxLength", { maxLength: 2000 }))
      .test(
        "is-url",
        translate("errors.invalidUrlFormat"),
        (value?: string) => {
          if (!value) return true;
          return isUrl(value);
        }
      ),
  });

interface ICreateClientProps {
  startRoutePath: string;
}

const mapStateToProps = (state: RootState) => ({
  startRoutePath: state.app.startRoutePath,
});

const CreateClientComponent: FC<ICreateClientProps> = ({ startRoutePath }) => {
  const { appId = "" } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const { t: translate } = useTranslation();
  const [createClient] = useCreateClientMutation();
  const [updateAvatar] = useUpdateAvatarClientMutation();
  const { data: types = [] } = useGetClientTypesQuery();
  const { data: catalogEnabled } = useGetCatalogEnabledQuery();

  const schema = yup
    .object({
      name: yup
        .string()
        .max(50, translate("errors.valueMaxLength", { maxLength: 50 }))
        .required(translate("errors.requiredField")),
      description: yup
        .string()
        .max(255, translate("errors.valueMaxLength", { maxLength: 255 }))
        .nullable(),
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
      post_logout_redirect_uris: yup.array().of(redirectUriSchema(translate)),
      request_uris: yup.array().of(UriSchema(translate)),
    })
    .required();

  const methods = useForm<IClientFull>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      name: "",
      avatar: null,
      description: "",
      domain: "",
      catalog: false,
      authorize_only_admins: false,
      redirect_uris: [""],
      post_logout_redirect_uris: [""],
      request_uris: [""],
    },
    mode: "onChange",
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    clearErrors,
    setError,
  } = methods;

  const onSubmit = async (data: IClientFull) => {
    const indexDuplicate = findDuplicateIndex(data.redirect_uris);
    if (indexDuplicate !== -1) {
      setError(`redirect_uris.${indexDuplicate}`, {
        type: "custom",
        message: translate("errors.valuesShouldNotRepeat"),
      });
      return;
    }
    if (Object.keys(errors).length) return;

    try {
      const { avatar, ...body } = data;
      const res = await createClient(body).unwrap();
      if (avatar || avatar === null) {
        await updateAvatar({
          avatar: avatar,
          client_id: res?.client_id,
        }).unwrap();
      }
      navigate(`/${startRoutePath}/${appId}/${tabs.clients}/${res.client_id}`);
    } catch (error) {
      console.error("Error creating application:", error);
    }
  };

  return (
    <div className="page-container">
      <div className="content">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className={styles.container}>
            <div className={styles.content}>
              <Typography className={clsx("title-medium", styles.title)}>
                {translate("pages.createClient.title")}
              </Typography>
              <Typography className={clsx("text-17", styles.subtitle)}>
                {translate("pages.createClient.sections.main")}
              </Typography>
              <InputField
                name="name"
                label={translate("pages.createClient.fields.name.label")}
                description={translate(
                  "pages.createClient.fields.name.description"
                )}
                required
              />
              <InputField
                name="description"
                label={translate("pages.createClient.fields.description.label")}
                multiline
                watchLength
              />
              <UploadAndDisplayImage
                title={translate("pages.createClient.fields.avatar.label")}
                defaultIcon={LayersOutlinedIcon}
              />
              {catalogEnabled && (
                <>
                  <Typography className={clsx("text-14", styles.inputTitle)}>
                    {translate("pages.createClient.fields.type")}
                  </Typography>
                  <Select
                    {...register("type_id", {
                      required: true,
                      onBlur: (event: FocusEvent<HTMLInputElement>) => {
                        setValue("type_id", event.target.value);
                      },
                      onChange: () => {
                        if (errors.type_id) clearErrors("type_id");
                      },
                    })}
                    defaultValue={"empty"}
                    className={styles.select}
                    data-id="group-select"
                  >
                    <MenuItem
                      className="custom-select"
                      key={"empty"}
                      value={"empty"}
                      data-id={`group-item-empty`}
                    >
                      {translate("pages.createClient.fields.typeOther")}
                    </MenuItem>
                    {types.map((item, index) => (
                      <MenuItem
                        className="custom-select"
                        key={index}
                        value={item.id}
                        data-id={`group-item-${item.id}`}
                      >
                        {item.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <SwitchBlock
                    name="catalog"
                    label={translate("pages.createClient.fields.catalog")}
                    defaultValue={false}
                  />
                </>
              )}
              <SwitchBlock
                name="authorize_only_admins"
                label={translate(
                  "pages.createClient.fields.authorize_only_admins"
                )}
                defaultValue={false}
              />
            </div>

            <div className={styles.divider} />

            <div className={styles.content}>
              <Typography className={clsx("text-17", styles.subtitle)}>
                {translate("pages.createClient.sections.params")}
              </Typography>

              <InputField
                name="domain"
                label={translate("pages.createClient.fields.domain.label")}
                description={translate(
                  "pages.createClient.fields.domain.description"
                )}
                required
              />

              <ArrayTextFields
                name="redirect_uris"
                title={translate("pages.createClient.fields.redirectUri.label")}
                description={translate(
                  "pages.createClient.fields.redirectUri.description"
                )}
                required
              />

              <ArrayTextFields
                name="post_logout_redirect_uris"
                title={translate("pages.createClient.fields.postLogout.label")}
                description={translate(
                  "pages.createClient.fields.postLogout.description"
                )}
                required
              />

              <ArrayTextFields
                name="request_uris"
                title={translate("pages.createClient.fields.requestUri.label")}
                description={translate(
                  "pages.createClient.fields.requestUri.description"
                )}
              />

              <ActionButtons
                onCancel={() => navigate(-1)}
                submitText={translate("actionButtons.create")}
              />
            </div>
          </form>
          <div className="zeroBlock"></div>
        </FormProvider>
      </div>
    </div>
  );
};

export const CreateClient = connect(mapStateToProps)(CreateClientComponent);
