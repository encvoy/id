import { ListProvidersPanel } from "src/features/adminPortal/settings/providers/ListProvidersPanel";
import PhotoSizeSelectActualOutlinedIcon from "@mui/icons-material/PhotoSizeSelectActualOutlined";
import styles from "./WidgetSettings.module.css";
import {
  FormProvider,
  SubmitHandler,
  useForm,
  useWatch,
} from "react-hook-form";
import { SwitchBlock } from "@encvoy-id/components";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import {
  IClientFull,
  TClientLocalizedName,
  useGetClientInfoQuery,
  useUpdateAvatarClientMutation,
  useUpdateClientMutation,
} from "src/shared/api/clients.ts";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useParams } from "react-router-dom";
import { MultiLanguageModalInputField } from "src/shared/ui/components/MultiLanguageModalInputField";
import { UploadAndDisplayImage } from "src/shared/ui/UploadAndDisplayImage.tsx";
import { useEffect, useState } from "react";
import { useDebounceEffect } from "src/shared/hooks/useDebounceEffect.ts";
import Button from "@mui/material/Button";
import { ECoverModes } from "src/shared/utils/enums";
import { WidgetColor } from "src/features/adminPortal/settings/widget/WidgetColor";
import { ViewWidget } from "src/features/adminPortal/settings/widget/ViewWidget";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { Box, IconButton, Typography } from "@mui/material";
import DOMPurify from "dompurify";
import { isObjectEmpty } from "src/shared/utils/helpers.ts";
import { html } from "@codemirror/lang-html";
import CodeMirror from "@uiw/react-codemirror";
import { useDispatch } from "react-redux";
import { setNoticeInfo } from "src/shared/slices/noticesSlice";
import { RadioGroupField } from "@encvoy-id/components";
import { SurfaceBlock } from "@encvoy-id/components";
import {
  DEFAULT_SYSTEM_LANGUAGE,
  getLocalizedTextMap,
} from "src/shared/utils/locales";

export enum EWidgetSwitches {
  title = "widget_title",
  showAvatar = "show_avatar_in_widget",
  hideCreateAccount = "hide_widget_create_account",
  hideAvatarsOfBigProviders = "hide_avatars_of_big_providers",
  hideFooter = "hide_widget_footer",
  info = "widget_info",
}

const getWidgetSettingsFormValues = (
  clientData: Partial<IClientFull> = {}
): Partial<IClientFull> => ({
  cover: clientData.cover ?? null,
  cover_mode: clientData.cover_mode ?? ECoverModes.NONE,
  hide_widget_create_account: clientData.hide_widget_create_account ?? false,
  show_avatar_in_widget: clientData.show_avatar_in_widget ?? false,
  hide_widget_header: clientData.hide_widget_header ?? false,
  hide_widget_footer: clientData.hide_widget_footer ?? false,
  hide_avatars_of_big_providers:
    clientData.hide_avatars_of_big_providers ?? false,
  widget_title: getLocalizedTextMap(
    clientData.widget_title as TClientLocalizedName | undefined,
    DEFAULT_SYSTEM_LANGUAGE
  ),
  widget_colors: clientData.widget_colors || {
    button_color: "",
    font_color: "",
    link_color: "",
  },
  widget_info: clientData.widget_info || "",
  widget_info_out: clientData.widget_info_out || "",
});

export const WidgetSettings = () => {
  const { appId = "", clientId = "" } =
    useParams<{ appId: string; clientId?: string }>();
  const { t: translate } = useTranslation();
  const dispatch = useDispatch();
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
    defaultValues: getWidgetSettingsFormValues(client),
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
      reset(getWidgetSettingsFormValues(client));
      setValueInfo(client.widget_info ?? "");
      setValueInfoOut(client.widget_info_out ?? "");
    }
  }, [client, reset]);

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

    const updatedClient = await updateClient({
      ...result,
      client_id: clientId || appId,
    }).unwrap();
    reset(getWidgetSettingsFormValues(updatedClient));
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
        <Box sx={{ padding: "0 24px 16px 0" }}>
          <Typography className="title-medium" sx={{ margin: "32px 0" }}>
            {translate("pages.widget.title")}
          </Typography>
          <div className={styles.container}>
            <SurfaceBlock
              sx={{ padding: "24px" }}
              className={styles.mainInfoBlock}
            >
              <FormProvider {...methods}>
                <MultiLanguageModalInputField
                  name="widget_title"
                  label={translate("pages.widget.widgetTitle")}
                  dataTestId="txt-settings-login-method-widget-title"
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
                      <RadioGroupField
                        name="cover_mode"
                        options={[
                          {
                            value: ECoverModes.NONE,
                            title: translate("pages.widget.coverMode.default"),
                            description: translate(
                              "pages.widget.coverModeDescription.default"
                            ),
                            dataTestId:
                              "chk-settings-login-method-cover-mode-default",
                          },
                          {
                            value: ECoverModes.INHERIT,
                            title: translate("pages.widget.coverMode.replace"),
                            description: translate(
                              "pages.widget.coverModeDescription.replace"
                            ),
                            dataTestId:
                              "chk-settings-login-method-cover-mode-forced",
                          },
                          {
                            value: ECoverModes.REPLACE,
                            title: translate("pages.widget.coverMode.inherit"),
                            description: translate(
                              "pages.widget.coverModeDescription.inherit"
                            ),
                            dataTestId:
                              "chk-settings-login-method-cover-mode-disabled",
                          },
                        ]}
                      />
                    </div>
                  </div>
                )}
              </FormProvider>
            </SurfaceBlock>

            <SurfaceBlock
              sx={{ padding: "24px" }}
              className={styles.providersBlock}
            >
              <ListProvidersPanel />
            </SurfaceBlock>

            <SurfaceBlock
              sx={{ padding: "24px" }}
              className={styles.colorsBlock}
            >
              <FormProvider {...methods}>
                <SwitchBlock
                  label={translate("pages.widget.switches.showAvatar")}
                  description={translate(
                    "pages.widget.switches.showAvatarDescription"
                  )}
                  name={EWidgetSwitches.showAvatar}
                  dataTestId="chk-settings-login-method-show-app-logo"
                />
                <SwitchBlock
                  label={translate("pages.widget.switches.hideCreateAccount")}
                  name={EWidgetSwitches.hideCreateAccount}
                  dataTestId="chk-settings-login-method-hide-create-account"
                />
                <SwitchBlock
                  label={translate("pages.widget.switches.hideFooter")}
                  description={translate(
                    "pages.widget.switches.hideFooterDescription"
                  )}
                  name={EWidgetSwitches.hideFooter}
                  dataTestId="chk-settings-login-methods-hide-footer"
                />
                <SwitchBlock
                  label={translate(
                    "pages.widget.switches.hideAvatarsOfBigProviders"
                  )}
                  name={EWidgetSwitches.hideAvatarsOfBigProviders}
                  dataTestId="chk-settings-login-method-hide-main-logo"
                />
              </FormProvider>
            </SurfaceBlock>

            <SurfaceBlock
              sx={{ padding: "24px" }}
              className={styles.settingsBlock}
            >
              <FormProvider {...methods}>
                <WidgetColor />
              </FormProvider>
            </SurfaceBlock>

            <SurfaceBlock sx={{ padding: "24px" }} className={styles.textBlock}>
              <FormProvider {...methods}>
                <Typography className={clsx("text-14", styles.infoText)}>
                  {translate("pages.widget.infoField")}
                </Typography>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div data-testid="btn-settings-login-methods-info-text-inside">
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
                  </div>
                  <Typography className={clsx("text-14", styles.infoText)}>
                    {translate("pages.widget.infoFieldOut")}
                  </Typography>
                  <div data-testid="btn-settings-login-methods-info-text-outside">
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
                  </div>
                  <Typography color="text.secondary" className="text-14">
                    {translate("pages.widget.infoFieldHtml5")}
                  </Typography>
                  <Typography color="text.secondary" className="text-14">
                    {translate("pages.widget.infoFieldDangerous")}
                  </Typography>
                  <Button
                    data-id="submit-form-button"
                    data-test-id="btn-form-save"
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
                      dispatch(
                        setNoticeInfo(translate("pages.widget.saveNoticeInfo"))
                      );
                    }}
                  >
                    {translate("actionButtons.save")}
                  </Button>
                </form>
              </FormProvider>
            </SurfaceBlock>
          </div>
          <Button
            variant="contained"
            className={styles.previewButton}
            onClick={() => setOpenModal(true)}
          >
            Open widget preview
          </Button>
        </Box>
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
