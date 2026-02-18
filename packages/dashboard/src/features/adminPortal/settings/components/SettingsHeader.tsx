import { yupResolver } from "@hookform/resolvers/yup";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import { FC, useEffect } from "react";
import {
  Controller,
  FormProvider,
  SubmitHandler,
  useForm,
} from "react-hook-form";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { InputField } from "src/shared/ui/components/InputBlock";
import { UploadAndDisplayImage } from "src/shared/ui/UploadAndDisplayImage";
import { isObjectEmpty } from "src/shared/utils/helpers";
import { setNoticeInfo } from "src/shared/lib/noticesSlice";
import {
  IClientFull,
  useUpdateAvatarClientMutation,
  useUpdateClientMutation,
} from "src/shared/api/clients";
import * as yup from "yup";
import { CLIENT_ID } from "src/shared/utils/constants";
import {
  useGetCatalogEnabledQuery,
  useGetClientTypesQuery,
} from "src/shared/api/settings";
import styles from "./SettingsHeader.module.css";
import { useTranslation } from "react-i18next";
import { AccordionBlock } from "src/shared/ui/components/AccordionBlock";
import Select from "@mui/material/Select";
import { Typography } from "@mui/material";

interface ISettingsHeaderProps {
  client: IClientFull;
}

export const SettingsHeader: FC<ISettingsHeaderProps> = ({ client }) => {
  const { t: translate } = useTranslation();
  const dispatch = useDispatch();
  const { appId = "", clientId = "" } =
    useParams<{ appId: string; clientId: string }>();
  const [updateClient, updateClientResult] = useUpdateClientMutation();
  const [updateAvatar] = useUpdateAvatarClientMutation();
  const { data: types = [] } = useGetClientTypesQuery();
  const { data: catalogEnabled } = useGetCatalogEnabledQuery();
  const isAdminClient = client.client_id === CLIENT_ID;

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
    })
    .required();

  const methods = useForm<IClientFull>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      name: client.name,
      description: client.description,
      type_id: client?.type?.id || "empty",
      avatar: client.avatar,
      cover: client.cover,
      mini_widget: client.mini_widget,
      catalog: client.catalog || false,
    },
    mode: "onChange",
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = methods;

  useEffect(() => {
    if (updateClientResult.isSuccess) {
      dispatch(setNoticeInfo(translate("info.infoUpdated")));
    }
  }, [updateClientResult]);

  const onSubmit: SubmitHandler<IClientFull> = async (data) => {
    try {
      if (Object.keys(errors).length) return;

      const payload: Partial<IClientFull> = (
        Object.keys(dirtyFields) as Array<keyof typeof data>
      ).reduce(
        (acc, field) => ({ ...acc, [field]: data[field] }),
        {} as Partial<IClientFull>
      );

      const { avatar, cover, ...res } = payload;
      await updateClient({ client_id: client.client_id, ...res }).unwrap();

      if (avatar || avatar === null || cover || cover === null) {
        await updateAvatar({
          avatar: avatar,
          cover: cover,
          client_id: client?.client_id,
        }).unwrap();
      }

      reset(data);
    } catch (e) {
      console.error("err", e);
    }
  };

  return (
    <>
      <Typography className="title-medium">
        {translate("pages.settings.title", { name: client.name })}
      </Typography>

      <FormProvider {...methods}>
        <form className={styles.content} onSubmit={handleSubmit(onSubmit)}>
          <AccordionBlock title={translate("helperText.mainInfo")}>
            <InputField
              name="name"
              label={translate("pages.settings.labels.appName")}
              description={translate("pages.settings.descriptions.appName")}
              required
            />
            {!isAdminClient && (
              <InputField
                name="description"
                label={translate("pages.settings.labels.appDescription")}
                multiline
                watchLength
              />
            )}
            <div>
              <UploadAndDisplayImage
                title={translate("pages.settings.labels.appLogo")}
                defaultIcon={LayersOutlinedIcon}
                defaultIconSrc={
                  appId === CLIENT_ID && !clientId
                    ? "public/default/logo.png"
                    : undefined
                }
              />
            </div>
            {!isAdminClient && (
              <>
                <div className={styles.switchWrapper}>
                  <Typography className="text-14">
                    {translate("pages.settings.labels.displayInMiniWidget")}
                  </Typography>
                  <Switch
                    defaultChecked={client?.mini_widget || false}
                    {...register("mini_widget")}
                  />
                </div>
              </>
            )}
            <div className={styles.buttonWrapper}>
              <Button
                type="submit"
                variant="contained"
                disabled={isObjectEmpty(dirtyFields, ["type", "catalog"])}
              >
                {translate("actionButtons.save")}
              </Button>
            </div>
          </AccordionBlock>

          {!isAdminClient && catalogEnabled && (
            <AccordionBlock
              title={translate("pages.settings.sections.catalog")}
            >
              <div className={styles.selectWrapper}>
                <Typography className={"text-14"}>
                  {translate("pages.settings.labels.appType")}
                </Typography>
                <Controller
                  control={control}
                  name="type_id"
                  render={({ field }) => (
                    <Select
                      className={styles.select}
                      defaultValue={client?.type?.id ?? ""}
                      data-id="group-select"
                      onChange={(e) => {
                        field.onChange(
                          e.target.value === "empty" ? "" : e.target.value
                        );
                      }}
                      value={field.value === "" ? "empty" : field.value}
                    >
                      <MenuItem
                        className="custom-select"
                        key={-1}
                        value={"empty"}
                        data-id={`group-item-empty`}
                      >
                        {translate("pages.settings.otherType")}
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
                  defaultChecked={client?.catalog || false}
                  {...register("catalog")}
                />
              </div>

              <div className={styles.buttonWrapper}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!dirtyFields.type_id && !dirtyFields.catalog}
                >
                  {translate("actionButtons.save")}
                </Button>
              </div>
            </AccordionBlock>
          )}
        </form>
      </FormProvider>
    </>
  );
};
