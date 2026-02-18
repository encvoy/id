import { ListProvidersPanel } from "src/features/adminPortal/settings/providers/ListProvidersPanel";
import PhotoSizeSelectActualOutlinedIcon from "@mui/icons-material/PhotoSizeSelectActualOutlined";
import styles from "./Widget.module.css";
import {
  Controller,
  FormProvider,
  SubmitHandler,
  useForm,
  useWatch,
} from "react-hook-form";
import { SwitchBlock } from "src/shared/ui/components/SwitchBlock.tsx";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import {
  IClientFull,
  useGetClientInfoQuery,
  useUpdateAvatarClientMutation,
  useUpdateClientMutation,
} from "src/shared/api/clients.ts";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useParams } from "react-router-dom";
import { InputField } from "src/shared/ui/components/InputBlock.tsx";
import { UploadAndDisplayImage } from "src/shared/ui/UploadAndDisplayImage.tsx";
import { useEffect, useState } from "react";
import { useDebounceEffect } from "src/shared/hooks/useDebounceEffect.ts";
import Button from "@mui/material/Button";
import { ECoverModes } from "src/shared/utils/enums";
import { WidgetColor } from "src/features/adminPortal/settings/widget/components/WidgetColor.tsx";
import { ViewWidget } from "src/features/adminPortal/settings/widget/components/ViewWidget.tsx";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { FormControlLabel, IconButton, Radio, Typography } from "@mui/material";
import DOMPurify from "dompurify";
import Box from "@mui/material/Box";
import { isObjectEmpty } from "src/shared/utils/helpers.ts";
import { html } from "@codemirror/lang-html";
import CodeMirror from "@uiw/react-codemirror";
import { componentBorderRadius } from "src/shared/theme/Theme";

export enum EWidgetSwitches {
  title = "widget_title",
  showAvatar = "show_avatar_in_widget",
  hideCreateAccount = "hide_widget_create_account",
  hideAvatarsOfBigProviders = "hide_avatars_of_big_providers",
  hideFooter = "hide_widget_footer",
  info = "widget_info",
}

export const Widget = () => {
  const { appId = "", clientId = "" } =
    useParams<{ appId: string; clientId?: string }>();
  const { t: translate } = useTranslation();
  const [updateClient] = useUpdateClientMutation();
  const [updateAvatar] = useUpdateAvatarClientMutation();
  const { data: client } = useGetClientInfoQuery({
    id: clientId || appId,
  });
  const [valueInfo, setValueInfo] = useState("");
  const [valueInfoOut, setValueInfoOut] = useState("");
  const [openModal, setOpenModal] = useState(false);

  const schema = yup.object({
    widget_colors: yup
      .object({
        button_color: yup
          .string()
          .required(translate("errors.requiredField"))
          .matches(
            /^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/,
            translate("errors.hexColor")
          ),
        font_color: yup
          .string()
          .required(translate("errors.requiredField"))
          .matches(
            /^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/,
            translate("errors.hexColor")
          ),
        link_color: yup
          .string()
          .required(translate("errors.requiredField"))
          .matches(
            /^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/,
            translate("errors.hexColor")
          ),
      })
      .required(),
  });

  const methods = useForm<IClientFull>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      hide_widget_create_account: client?.hide_widget_create_account || false,
      show_avatar_in_widget: client?.show_avatar_in_widget || false,
      hide_widget_header: client?.hide_widget_header || false,
      hide_widget_footer: client?.hide_widget_footer || false,
      hide_avatars_of_big_providers:
        client?.hide_avatars_of_big_providers || false,
      widget_title: client?.widget_title || "",
      widget_colors: client?.widget_colors || {
        button_color: "",
        font_color: "",
      },
      widget_info: client?.widget_info || "",
    },
    mode: "onBlur",
    reValidateMode: "onBlur",
  });
  const {
    control,
    handleSubmit,
    formState: { dirtyFields },
    reset,
    setValue,
  } = methods;

  useEffect(() => {
    if (client) {
      reset(client);
      setValueInfo(client?.widget_info);
      setValueInfoOut(client?.widget_info_out);
    }
  }, [client?.name]);

  const onSubmit: SubmitHandler<IClientFull> = async (data) => {
    const payload: Partial<IClientFull> = (
      Object.keys(dirtyFields) as Array<keyof typeof data>
    ).reduce(
      (acc, field) => ({ ...acc, [field]: data[field] }),
      {} as Partial<IClientFull>
    );
    const { cover, ...result } = payload;

    if (cover || cover === null) {
      await updateAvatar({
        cover: cover,
        client_id: clientId || appId,
      }).unwrap();
    }

    if (isObjectEmpty(payload)) return;

    const client = await updateClient({
      ...result,
      client_id: clientId || appId,
    }).unwrap();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { widget_title, ...body } = client;
    reset(body);
  };

  const widget = useWatch({ control });
  useDebounceEffect(
    () => {
      handleSubmit(onSubmit)();
    },
    400,
    [widget]
  );

  return (
    <div className="page-container">
      <div className={clsx(styles.content, "content_max")}>
        <div className={styles.settings}>
          <Typography className={clsx("title-medium", styles.title)}>
            {translate("pages.widget.title")}
          </Typography>
          <div className={styles.container}>
            <Box
              sx={{ borderRadius: componentBorderRadius }}
              className={clsx(styles.block, styles.mainInfoBlock)}
            >
              <FormProvider {...methods}>
                <InputField
                  name="widget_title"
                  label={translate("pages.widget.widgetTitle")}
                  description={translate(
                    "pages.widget.widgetTitleDescription",
                    { value: "APP_NAME" }
                  )}
                />
                <UploadAndDisplayImage
                  title={translate("pages.widget.appCover")}
                  nameFieldForm="cover"
                  defaultIcon={PhotoSizeSelectActualOutlinedIcon}
                  aspect={3 / 2}
                  maxImageSize={10}
                  figure="rectangle"
                />
                {!clientId && (
                  <div className={styles.fieldWrapper}>
                    <Typography className="text-14">
                      {translate("pages.widget.coverModeTitle")}
                    </Typography>
                    <div className={styles.radioWrapper}>
                      <Controller
                        control={control}
                        name={"cover_mode"}
                        render={({ field: { onChange, value } }) => (
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "16px",
                            }}
                          >
                            <FormControlLabel
                              label={
                                <>
                                  <Typography className="text-14">
                                    {translate(
                                      "pages.widget.coverMode.default"
                                    )}
                                  </Typography>
                                  <Typography className="text-12">
                                    {translate(
                                      "pages.widget.coverModeDescription.default"
                                    )}
                                  </Typography>
                                </>
                              }
                              checked={value === ECoverModes.NONE}
                              onClick={() => onChange(ECoverModes.NONE)}
                              control={<Radio disableRipple />}
                            />
                            <FormControlLabel
                              label={
                                <>
                                  <Typography className="text-14">
                                    {translate(
                                      "pages.widget.coverMode.replace"
                                    )}
                                  </Typography>
                                  <Typography className="text-12">
                                    {translate(
                                      "pages.widget.coverModeDescription.replace"
                                    )}
                                  </Typography>
                                </>
                              }
                              checked={value === ECoverModes.INHERIT}
                              onClick={() => onChange(ECoverModes.INHERIT)}
                              control={<Radio disableRipple />}
                            />
                            <FormControlLabel
                              label={
                                <>
                                  <Typography className="text-14">
                                    {translate(
                                      "pages.widget.coverMode.inherit"
                                    )}
                                  </Typography>
                                  <Typography className="text-12">
                                    {translate(
                                      "pages.widget.coverModeDescription.inherit"
                                    )}
                                  </Typography>
                                </>
                              }
                              checked={value === ECoverModes.REPLACE}
                              onClick={() => onChange(ECoverModes.REPLACE)}
                              control={<Radio disableRipple />}
                            />
                          </Box>
                        )}
                      />
                    </div>
                  </div>
                )}
              </FormProvider>
            </Box>

            <Box
              sx={{ borderRadius: componentBorderRadius }}
              className={clsx(styles.block, styles.providersBlock)}
            >
              <ListProvidersPanel />
            </Box>

            <Box
              sx={{ borderRadius: componentBorderRadius }}
              className={clsx(styles.block, styles.colorsBlock)}
            >
              <FormProvider {...methods}>
                <SwitchBlock
                  label={translate("pages.widget.switches.showAvatar")}
                  description={translate(
                    "pages.widget.switches.showAvatarDescription"
                  )}
                  name={EWidgetSwitches.showAvatar}
                />
                <SwitchBlock
                  label={translate("pages.widget.switches.hideCreateAccount")}
                  name={EWidgetSwitches.hideCreateAccount}
                />
                <SwitchBlock
                  label={translate("pages.widget.switches.hideFooter")}
                  description={translate(
                    "pages.widget.switches.hideFooterDescription"
                  )}
                  name={EWidgetSwitches.hideFooter}
                />
                <SwitchBlock
                  label={translate(
                    "pages.widget.switches.hideAvatarsOfBigProviders"
                  )}
                  name={EWidgetSwitches.hideAvatarsOfBigProviders}
                />
              </FormProvider>
            </Box>

            <Box
              sx={{ borderRadius: componentBorderRadius }}
              className={clsx(styles.block, styles.settingsBlock)}
            >
              <FormProvider {...methods}>
                <WidgetColor />
              </FormProvider>
            </Box>

            <Box
              sx={{ borderRadius: componentBorderRadius }}
              className={clsx(styles.block, styles.textBlock)}
            >
              <FormProvider {...methods}>
                <Typography className={clsx("text-14", styles.infoText)}>
                  {translate("pages.widget.infoField")}
                </Typography>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <CodeMirror
                    value={valueInfo}
                    height="200px"
                    extensions={[html()]}
                    placeholder={translate("pages.widget.HtmlField")}
                    onChange={(value) => {
                      setValueInfo(value);
                    }}
                    className={styles.codeMirror}
                  />
                  <Typography className={clsx("text-14", styles.infoText)}>
                    {translate("pages.widget.infoFieldOut")}
                  </Typography>
                  <CodeMirror
                    value={valueInfoOut}
                    height="200px"
                    extensions={[html()]}
                    placeholder={translate("pages.widget.HtmlField")}
                    onChange={(value) => {
                      setValueInfoOut(value);
                    }}
                    className={styles.codeMirror}
                  />
                  <Typography color="text.secondary" className="text-14">
                    {translate("pages.widget.infoFieldHtml5")}
                  </Typography>
                  <Typography color="text.secondary" className="text-14">
                    {translate("pages.widget.infoFieldDangerous")}
                  </Typography>
                  <Button
                    data-id="submit-form-button"
                    className={styles.submitButton}
                    variant="contained"
                    onClick={() => {
                      const allowedTargets = [
                        "_blank",
                        "_self",
                        "_parent",
                        "_top",
                      ];
                      DOMPurify.addHook("beforeSanitizeAttributes", (node) => {
                        if (node.tagName === "A") {
                          const t = node.getAttribute("target");
                          if (allowedTargets.includes(t as string)) {
                            node.setAttribute("data-dp-target", t as string);
                          }
                        }
                      });
                      DOMPurify.addHook("afterSanitizeAttributes", (node) => {
                        if (node.tagName === "A") {
                          const preserved = node.getAttribute("data-dp-target");
                          if (preserved) {
                            node.setAttribute("target", preserved);
                            node.setAttribute("rel", "noopener noreferrer");
                            node.removeAttribute("data-dp-target");
                          }
                        }
                      });
                      setValue(
                        "widget_info",
                        DOMPurify.sanitize(valueInfo, {
                          ADD_ATTR: ["href", "target", "rel"],
                        }),
                        {
                          shouldDirty: true,
                        }
                      );
                      setValue(
                        "widget_info_out",
                        DOMPurify.sanitize(valueInfoOut, {
                          ADD_ATTR: ["href", "target", "rel"],
                        }),
                        {
                          shouldDirty: true,
                        }
                      );
                    }}
                  >
                    {translate("actionButtons.save")}
                  </Button>
                </form>
              </FormProvider>
            </Box>
          </div>
          <Button
            variant="contained"
            className={styles.previewButton}
            onClick={() => setOpenModal(true)}
          >
            Открыть превью виджета
          </Button>
        </div>
        <div
          className={clsx(
            styles.widgetWrapper,
            openModal && styles.widgetWrapperMobile
          )}
        >
          <IconButton
            className={styles.modalClose}
            data-id="side-panel-close-button"
            onClick={() => setOpenModal(false)}
          >
            <CloseOutlinedIcon className={styles.modalCloseIcon} />
          </IconButton>
          <ViewWidget />
        </div>
      </div>
    </div>
  );
};
