import { yupResolver } from "@hookform/resolvers/yup";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import { Typography } from "@mui/material";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Switch from "@mui/material/Switch";
import { FC, useEffect, useRef } from "react";
import {
  Controller,
  FormProvider,
  SubmitHandler,
  useForm,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import {
  IClientFull,
  useUpdateAvatarClientMutation,
  useUpdateClientMutation,
} from "src/shared/api/clients";
import {
  useGetCatalogEnabledQuery,
  useGetClientTypesQuery,
} from "src/shared/api/settings";
import { setClientProfile } from "src/shared/slices/appSlice";
import { setNoticeInfo } from "src/shared/slices/noticesSlice";
import { AccordionBlock } from "@encvoy-id/components";
import { InputField } from "@encvoy-id/components";
import { MultiLanguageModalInputField } from "src/shared/ui/components/MultiLanguageModalInputField";
import { UploadAndDisplayImage } from "src/shared/ui/UploadAndDisplayImage";
import { useSystemClientId } from "src/shared/hooks/useSystemClientId";
import {
  getDirtyFieldsValues,
  isObjectEmpty,
  refreshDashboardFavicon,
} from "src/shared/utils/helpers";
import {
  buildLocalizedTextSchema,
  DEFAULT_SYSTEM_LANGUAGE,
  getLocalizedTextMap,
  getLocalizedTextValue,
} from "src/shared/utils/locales";
import * as yup from "yup";
import styles from "./SettingsHeader.module.css";

interface ISettingsHeaderProps {
  client: IClientFull;
}

type TMainInfoFormValues = Pick<
  IClientFull,
  "name" | "description" | "avatar" | "cover" | "mini_widget"
>;

type TCatalogFormValues = Pick<
  IClientFull,
  "type_id" | "catalog" | "catalog_name"
>;

const getMainInfoFormValues = (
  clientData: Partial<IClientFull>
): TMainInfoFormValues => ({
  name: getLocalizedTextMap(clientData.name, DEFAULT_SYSTEM_LANGUAGE),
  description: clientData.description ?? "",
  avatar: clientData.avatar,
  cover: clientData.cover,
  mini_widget: clientData.mini_widget ?? false,
});

const getCatalogFormValues = (
  clientData: Partial<IClientFull>
): TCatalogFormValues => ({
  type_id: clientData.type?.id ?? clientData.type_id ?? "",
  catalog: clientData.catalog ?? false,
  catalog_name: getLocalizedTextMap(
    clientData.catalog_name,
    DEFAULT_SYSTEM_LANGUAGE
  ),
});

export const SettingsHeader: FC<ISettingsHeaderProps> = ({ client }) => {
  const { t: translate, i18n } = useTranslation();
  const dispatch = useDispatch();
  const systemClientId = useSystemClientId();
  const { appId = "", clientId = "" } =
    useParams<{ appId: string; clientId: string }>();
  const previousClientIdRef = useRef<string | undefined>(undefined);
  const [updateClient] = useUpdateClientMutation();
  const [updateAvatar] = useUpdateAvatarClientMutation();
  const { data: types = [] } = useGetClientTypesQuery();
  const { data: catalogEnabled } = useGetCatalogEnabledQuery();
  const isAdminClient = client.client_id === systemClientId;
  const localizedClientName = getLocalizedTextValue(client.name, i18n.language);

  const mainInfoSchema = yup
    .object({
      name: buildLocalizedTextSchema({
        translate,
        maxLength: 50,
      }),
      description: yup
        .string()
        .max(255, translate("errors.valueMaxLength", { maxLength: 255 }))
        .nullable(),
    })
    .required();

  const mainInfoMethods = useForm<TMainInfoFormValues>({
    resolver: yupResolver(mainInfoSchema) as any,
    defaultValues: getMainInfoFormValues(client),
    mode: "onChange",
  });

  const {
    register: registerMainInfo,
    handleSubmit: handleMainInfoSubmit,
    reset: resetMainInfo,
    formState: { dirtyFields: mainInfoDirtyFields },
  } = mainInfoMethods;

  const catalogMethods = useForm<TCatalogFormValues>({
    resolver: yupResolver(
      yup
        .object({
          catalog_name: buildLocalizedTextSchema({
            translate,
            required: false,
            maxLength: 50,
          }),
        })
        .required()
    ) as any,
    defaultValues: getCatalogFormValues(client),
    mode: "onChange",
  });

  const {
    register: registerCatalog,
    control: catalogControl,
    handleSubmit: handleCatalogSubmit,
    reset: resetCatalog,
    formState: { dirtyFields: catalogDirtyFields },
  } = catalogMethods;

  useEffect(() => {
    if (previousClientIdRef.current !== client.client_id) {
      resetMainInfo(getMainInfoFormValues(client));
      resetCatalog(getCatalogFormValues(client));
      previousClientIdRef.current = client.client_id;
    }
  }, [client, resetCatalog, resetMainInfo]);

  const onSubmitMainInfo: SubmitHandler<TMainInfoFormValues> = async (data) => {
    try {
      if (isObjectEmpty(mainInfoDirtyFields as Record<string, unknown>)) {
        return;
      }

      const payload = getDirtyFieldsValues(data, mainInfoDirtyFields);
      const { avatar, cover, ...clientPayload } = payload;
      const shouldUpdateAvatar = "avatar" in payload || "cover" in payload;

      let clientToReset = client;
      if (Object.keys(clientPayload).length > 0) {
        clientToReset = await updateClient({
          client_id: client.client_id,
          ...clientPayload,
        }).unwrap();
      }

      if (shouldUpdateAvatar) {
        clientToReset = await updateAvatar({
          avatar,
          cover,
          client_id: client.client_id,
        }).unwrap();
        if (isAdminClient) {
          refreshDashboardFavicon().catch((error) => {
            console.error("Failed to refresh the dashboard favicon", error);
          });
        }
        dispatch(setClientProfile(clientToReset));
      }

      resetMainInfo(getMainInfoFormValues(clientToReset));
      dispatch(setNoticeInfo(translate("info.infoUpdated")));
    } catch (e) {
      console.error("err", e);
    }
  };

  const onSubmitCatalog: SubmitHandler<TCatalogFormValues> = async (data) => {
    try {
      if (
        !catalogDirtyFields.type_id &&
        !catalogDirtyFields.catalog &&
        !catalogDirtyFields.catalog_name
      ) {
        return;
      }

      const payload = getDirtyFieldsValues(data, catalogDirtyFields);
      const updatedClient = await updateClient({
        client_id: client.client_id,
        ...payload,
      }).unwrap();

      resetCatalog(getCatalogFormValues(updatedClient));
      dispatch(setNoticeInfo(translate("info.infoUpdated")));
    } catch (e) {
      console.error("err", e);
    }
  };

  return (
    <>
      <Typography className="title-medium">
        {translate("pages.settings.title", {
          name: localizedClientName,
        })}
      </Typography>

      <div className={styles.content}>
        <FormProvider {...mainInfoMethods}>
          <form onSubmit={handleMainInfoSubmit(onSubmitMainInfo)}>
            <AccordionBlock
              dataTestId="ddl-settings-main-information"
              title={translate("helperText.mainInfo")}
            >
              <MultiLanguageModalInputField
                dataTestId="txt-settings-main-information-app-name"
                name="name"
                label={translate("pages.settings.labels.appName")}
                description={translate("pages.settings.descriptions.appName")}
                required
              />
              {!isAdminClient && (
                <InputField
                  dataTestId="txt-settings-main-information-app-description"
                  name="description"
                  label={translate("pages.settings.labels.appDescription")}
                  multiline
                  watchLength
                  characterCountLabel={translate("helperText.characterCount")}
                  maxCharacterCount={255}
                />
              )}
              <div>
                <UploadAndDisplayImage
                  title={translate("pages.settings.labels.appLogo")}
                  defaultIcon={LayersOutlinedIcon}
                  defaultIconSrc={
                    appId === systemClientId && !clientId
                      ? "public/default/logo.png"
                      : undefined
                  }
                />
              </div>
              {!isAdminClient && (
                <div className={styles.switchWrapper}>
                  <Typography className="text-14">
                    {translate("pages.settings.labels.displayInMiniWidget")}
                  </Typography>
                  <Switch
                    data-test-id="chk-settings-main-information-mini-widget-show"
                    defaultChecked={client?.mini_widget || false}
                    {...registerMainInfo("mini_widget")}
                  />
                </div>
              )}
              <div className={styles.buttonWrapper}>
                <Button
                  data-test-id="btn-settings-main-information-save"
                  type="submit"
                  variant="contained"
                  disabled={isObjectEmpty(
                    mainInfoDirtyFields as Record<string, unknown>
                  )}
                >
                  {translate("actionButtons.save")}
                </Button>
              </div>
            </AccordionBlock>
          </form>
        </FormProvider>

        {!isAdminClient && catalogEnabled && (
          <FormProvider {...catalogMethods}>
            <form onSubmit={handleCatalogSubmit(onSubmitCatalog)}>
              <AccordionBlock
                dataTestId="btn-settings-application-catalog"
                title={translate("pages.settings.sections.catalog")}
              >
                <MultiLanguageModalInputField
                  dataTestId="txt-settings-catalog-name"
                  name="catalog_name"
                  label={translate("pages.settings.labels.catalogName")}
                  description={translate(
                    "pages.settings.descriptions.catalogName"
                  )}
                />

                <div className={styles.selectWrapper}>
                  <Typography className={"text-14"}>
                    {translate("pages.settings.labels.appType")}
                  </Typography>
                  <Controller
                    control={catalogControl}
                    name="type_id"
                    render={({ field }) => (
                      <Select
                        data-test-id="btn-settings-catalog-app-type"
                        className={styles.select}
                        data-id="group-select"
                        onChange={(e) => {
                          field.onChange(
                            e.target.value === "empty" ? "" : e.target.value
                          );
                        }}
                        value={field.value === "" ? "empty" : field.value}
                      >
                        <MenuItem
                          data-test-id="btn-settings-catalog-app-type-empty"
                          className="custom-select"
                          key={-1}
                          value={"empty"}
                          data-id={`group-item-empty`}
                        >
                          {translate("pages.settings.otherType")}
                        </MenuItem>
                        {types.map((item, index) => (
                          <MenuItem
                            data-test-id={`btn-settings-catalog-app-type-${item.id}`}
                            className="custom-select"
                            key={index}
                            value={item.id}
                            data-id={`group-item-${item.id}`}
                          >
                            {getLocalizedTextValue(item.name, i18n.language)}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  <Typography className="text-14" color="text.secondary">
                    {translate("pages.settings.descriptions.appType")}
                  </Typography>
                </div>

                <div className={styles.switchWrapper}>
                  <Typography className="text-14">
                    {translate("pages.settings.labels.displayInCatalog")}
                  </Typography>
                  <Switch
                    data-test-id="btn-settings-catalog-app-display"
                    defaultChecked={client?.catalog || false}
                    {...registerCatalog("catalog")}
                  />
                </div>

                <div className={styles.buttonWrapper}>
                  <Button
                    data-test-id="btn-settings-catalog-save"
                    type="submit"
                    variant="contained"
                    disabled={
                      !catalogDirtyFields.type_id &&
                      !catalogDirtyFields.catalog &&
                      !catalogDirtyFields.catalog_name
                    }
                  >
                    {translate("actionButtons.save")}
                  </Button>
                </div>
              </AccordionBlock>
            </form>
          </FormProvider>
        )}
      </div>
    </>
  );
};
