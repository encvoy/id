import { html } from "@codemirror/lang-html";
import CodeMirror from "@uiw/react-codemirror";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import clsx from "clsx";
import { FC, SyntheticEvent, useEffect, useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import {
  EGetProviderAction,
  IEmailTemplate,
  IEmailTemplatePresets,
  useGetProviderEmailTemplatePresetsQuery,
  useGetProviderEmailTemplatesQuery,
  usePreviewProviderEmailTemplateMutation,
  useGetProvidersQuery,
  useUpdateProviderEmailTemplateMutation,
} from "src/shared/api/provider";
import { useGetSettingsQuery } from "src/shared/api/settings";
import { setNoticeError, setNoticeInfo } from "src/shared/slices/noticesSlice";
import { InputField } from "@encvoy-id/components";
import { SurfaceBlock } from "@encvoy-id/components";
import { EEmailAction } from "src/shared/utils/enums";
import { isObjectEmpty } from "src/shared/utils/helpers";
import { getLocalizedTextValue } from "src/shared/utils/locales";
import { ViewEmailTemplate } from "../editEmailTemplatesPanel/ViewEmailTemplate";
import baseStyles from "./Settings.module.css";
import styles from "./EmailTemplatesSettings.module.css";

type TTemplateListMode = "locale" | "action";
type TWorkspaceMode = "edit" | "preview";

const EMAIL_ACTION_ORDER = [
  EEmailAction.account_create,
  EEmailAction.confirmation_code,
  EEmailAction.confirmation_link,
  EEmailAction.password_change,
  EEmailAction.password_recover,
  EEmailAction.invite,
];

const LOCALE_ORDER = ["en-US", "ru-RU", "fr-FR", "es-ES", "de-DE", "it-IT"];

const getTemplateTestId = (template: IEmailTemplate) => {
  if (template.action === EEmailAction.account_create) {
    return "btn-settings-email-templates-registration";
  }
  if (template.action === EEmailAction.confirmation_code) {
    return "btn-settings-email-templates-confirmation-code";
  }
  if (template.action === EEmailAction.confirmation_link) {
    return "btn-settings-email-templates-confirmation-link";
  }
  if (template.action === EEmailAction.password_change) {
    return "btn-settings-email-templates-password-change";
  }
  if (template.action === EEmailAction.password_recover) {
    return "btn-settings-email-templates-password-reset";
  }

  return "btn-settings-email-templates-invitation";
};

const getLocaleOrder = (locale: string) => {
  const index = LOCALE_ORDER.indexOf(locale);

  return index === -1 ? LOCALE_ORDER.length : index;
};

const getActionOrder = (action: string) => {
  const index = EMAIL_ACTION_ORDER.indexOf(action as EEmailAction);

  return index === -1 ? EMAIL_ACTION_ORDER.length : index;
};

export const EmailTemplatesSettings: FC = () => {
  const { t: translate, i18n } = useTranslation();
  const dispatch = useDispatch();
  const {
    appId = "",
    clientId = "",
    providerId = "",
  } = useParams<{ appId: string; clientId?: string; providerId: string }>();
  const currentClientId = clientId || appId;
  const [listMode, setListMode] = useState<TTemplateListMode>("locale");
  const [workspaceMode, setWorkspaceMode] = useState<TWorkspaceMode>("edit");
  const [selectedLocale, setSelectedLocale] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>();
  const [renderedPreviewHtml, setRenderedPreviewHtml] = useState("");

  const { data: settings, isLoading: isSettingsLoading } =
    useGetSettingsQuery();
  const { data: providers = [] } = useGetProvidersQuery(
    {
      client_id: currentClientId,
      query: {
        action: EGetProviderAction.all,
      },
    },
    { skip: !currentClientId }
  );
  const { data: templates = [], isLoading: isTemplatesLoading } =
    useGetProviderEmailTemplatesQuery(
      {
        clientId: currentClientId,
        providerId,
      },
      { skip: !currentClientId || !providerId }
    );
  const [updateEmailTemplate, updateEmailTemplateResult] =
    useUpdateProviderEmailTemplateMutation();
  const [previewEmailTemplate] = usePreviewProviderEmailTemplateMutation();

  const defaultLocale = settings?.i18n?.default_language || "ru-RU";

  const provider = useMemo(
    () => providers.find((item) => item.id === providerId),
    [providers, providerId]
  );

  const methods = useForm<IEmailTemplate>({
    mode: "all",
  });
  const {
    control,
    handleSubmit,
    formState: { dirtyFields },
    register,
    reset,
    setValue,
  } = methods;

  const watchContent = useWatch({
    control,
    name: "content",
    defaultValue: "",
  });

  const localeOptions = useMemo(
    () => [
      {
        value: "en-US",
        label: translate("pages.settings.locale.english"),
      },
      {
        value: "ru-RU",
        label: translate("pages.settings.locale.russian"),
      },
      {
        value: "fr-FR",
        label: translate("pages.settings.locale.french"),
      },
      {
        value: "es-ES",
        label: translate("pages.settings.locale.spanish"),
      },
      {
        value: "de-DE",
        label: translate("pages.settings.locale.german"),
      },
      {
        value: "it-IT",
        label: translate("pages.settings.locale.italian"),
      },
    ],
    [translate]
  );

  const actionOptions = useMemo(
    () =>
      EMAIL_ACTION_ORDER.map((action) => {
        const preferredTemplate =
          templates.find(
            (item) => item.action === action && item.locale === selectedLocale
          ) ||
          templates.find(
            (item) => item.action === action && item.locale === defaultLocale
          ) ||
          templates.find((item) => item.action === action);

        if (!preferredTemplate) {
          return null;
        }

        return {
          value: action,
          label: preferredTemplate.title,
        };
      }).filter(Boolean) as Array<{ value: string; label: string }>,
    [defaultLocale, selectedLocale, templates]
  );

  const visibleTemplates = useMemo(() => {
    const nextTemplates = templates.filter((template) =>
      listMode === "locale"
        ? template.locale === selectedLocale
        : template.action === selectedAction
    );

    return [...nextTemplates].sort((left, right) => {
      if (listMode === "locale") {
        return getActionOrder(left.action) - getActionOrder(right.action);
      }

      return getLocaleOrder(left.locale) - getLocaleOrder(right.locale);
    });
  }, [listMode, selectedAction, selectedLocale, templates]);

  const selectedTemplate = useMemo(() => {
    if (!selectedTemplateId) {
      return undefined;
    }

    return visibleTemplates.find((item) => item.id === selectedTemplateId);
  }, [selectedTemplateId, visibleTemplates]);

  const { data: templatePresets, isFetching: isPresetsLoading } =
    useGetProviderEmailTemplatePresetsQuery(
      {
        clientId: currentClientId,
        providerId,
        action: selectedTemplate?.action || "",
        query: selectedTemplate
          ? { locale: selectedTemplate.locale }
          : undefined,
      },
      {
        skip: !currentClientId || !providerId || !selectedTemplate?.action,
      }
    );

  useEffect(() => {
    register("content");
  }, [register]);

  useEffect(() => {
    if (selectedLocale || isSettingsLoading) {
      return;
    }

    setSelectedLocale(defaultLocale);
  }, [defaultLocale, isSettingsLoading, selectedLocale]);

  useEffect(() => {
    if (!actionOptions.length) {
      return;
    }

    if (actionOptions.some((item) => item.value === selectedAction)) {
      return;
    }

    setSelectedAction(actionOptions[0].value);
  }, [actionOptions, selectedAction]);

  useEffect(() => {
    if (!visibleTemplates.length) {
      setSelectedTemplateId(undefined);
      return;
    }

    setSelectedTemplateId((currentId) => {
      if (currentId && visibleTemplates.some((item) => item.id === currentId)) {
        return currentId;
      }

      return visibleTemplates[0].id;
    });
  }, [visibleTemplates]);

  useEffect(() => {
    setRenderedPreviewHtml("");
  }, [selectedTemplate?.id]);

  useEffect(() => {
    if (workspaceMode !== "preview" || !selectedTemplate) {
      return;
    }

    if (!watchContent?.trim()) {
      setRenderedPreviewHtml("");
      return;
    }

    let isActive = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await previewEmailTemplate({
          clientId: currentClientId,
          providerId,
          action: selectedTemplate.action,
          body: {
            content: watchContent,
          },
          query: {
            locale: selectedTemplate.locale,
          },
        }).unwrap();

        if (isActive) {
          setRenderedPreviewHtml(response.html);
        }
      } catch {
        if (isActive) {
          setRenderedPreviewHtml(watchContent);
        }
      }
    }, 250);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [
    currentClientId,
    previewEmailTemplate,
    providerId,
    selectedTemplate,
    watchContent,
    workspaceMode,
  ]);

  useEffect(() => {
    if (!selectedTemplate) {
      return;
    }

    reset(selectedTemplate);
  }, [reset, selectedTemplate]);

  const getLocaleLabel = (locale: string) =>
    localeOptions.find((item) => item.value === locale)?.label || locale;

  const handleListModeChange = (
    _: SyntheticEvent,
    value: TTemplateListMode
  ) => {
    if (!value) {
      return;
    }

    if (selectedTemplate) {
      setSelectedLocale(selectedTemplate.locale);
      setSelectedAction(selectedTemplate.action);
    }

    setListMode(value);
  };

  const handleWorkspaceModeChange = (
    _: SyntheticEvent,
    value: TWorkspaceMode
  ) => {
    if (!value) {
      return;
    }

    setWorkspaceMode(value);
  };

  const handleSave = async (data: IEmailTemplate) => {
    if (!selectedTemplate) {
      return;
    }

    try {
      await updateEmailTemplate({
        clientId: currentClientId,
        providerId,
        action: selectedTemplate.action,
        body: {
          title: data.title,
          subject: data.subject,
          content: data.content,
          locale: selectedTemplate.locale,
        },
        query: { locale: selectedTemplate.locale },
      }).unwrap();

      reset({
        ...selectedTemplate,
        ...data,
        action: selectedTemplate.action,
        locale: selectedTemplate.locale,
      });
      dispatch(setNoticeInfo(translate("info.infoUpdated")));
    } catch {
      dispatch(setNoticeError(translate("info.updateError")));
    }
  };

  const handleApplyPreset = (variant: keyof IEmailTemplatePresets) => {
    const preset = templatePresets?.[variant];

    if (!preset) {
      return;
    }

    setValue("content", preset, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  if (!currentClientId || !providerId || !selectedLocale || !selectedAction) {
    return <Typography>{translate("helperText.loading")}</Typography>;
  }

  return (
    <div className="page-container">
      <div
        className={clsx(
          "content",
          "content_max",
          baseStyles.content,
          styles.content
        )}
      >
        <div className={styles.header}>
          <Typography className="title-medium">
            {translate("pages.settings.sections.emailTemplates")}
          </Typography>
          <Typography className="text-14" color="text.secondary">
            {provider
              ? getLocalizedTextValue(provider.name, i18n.language)
              : translate("panel.mailTemplate.description")}
          </Typography>
        </div>

        <div className={styles.layout}>
          <div className={styles.listColumn}>
            <SurfaceBlock className={styles.block}>
              <Typography className="text-17">
                {translate("panel.mailTemplate.title")}
              </Typography>
              <Typography className={styles.description} color="text.secondary">
                {translate("panel.mailTemplate.description")}
              </Typography>

              <Tabs
                className={styles.modeTabs}
                variant="fullWidth"
                value={listMode}
                onChange={handleListModeChange}
              >
                <Tab
                  value="locale"
                  label={translate("panel.mailTemplate.edit.listModeLocale")}
                  data-test-id="tab-settings-email-templates-by-locale"
                />
                <Tab
                  value="action"
                  label={translate("panel.mailTemplate.edit.listModeAction")}
                  data-test-id="tab-settings-email-templates-by-type"
                />
              </Tabs>

              <FormControl
                fullWidth
                size="small"
                className={styles.selectorField}
              >
                <Typography sx={{ marginBottom: "8px" }} className="text-14">
                  {listMode === "locale"
                    ? translate("panel.mailTemplate.edit.languageLabel")
                    : translate("panel.mailTemplate.edit.typeLabel")}
                </Typography>
                <Select
                  value={
                    listMode === "locale" ? selectedLocale : selectedAction
                  }
                  inputProps={{
                    "data-test-id":
                      listMode === "locale"
                        ? "ddl-settings-email-templates-language"
                        : "ddl-settings-email-templates-type",
                  }}
                  onChange={(event) => {
                    if (listMode === "locale") {
                      setSelectedLocale(event.target.value as string);
                      return;
                    }

                    setSelectedAction(event.target.value as string);
                  }}
                >
                  {(listMode === "locale" ? localeOptions : actionOptions).map(
                    (item) => (
                      <MenuItem key={item.value} value={item.value}>
                        {item.label}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>

              <Typography className={clsx("text-14", styles.listLabel)}>
                {translate("panel.mailTemplate.edit.templatesListLabel")}
              </Typography>

              <div className={styles.list}>
                {!!visibleTemplates.length && (
                  <List disablePadding>
                    {visibleTemplates.map((template) => (
                      <ListItemButton
                        key={template.id}
                        selected={template.id === selectedTemplate?.id}
                        className={styles.listItem}
                        onClick={() => setSelectedTemplateId(template.id)}
                        data-test-id={
                          listMode === "locale"
                            ? getTemplateTestId(template)
                            : `${getTemplateTestId(template)}-${
                                template.locale
                              }`
                        }
                      >
                        <ListItemText
                          primary={template.title}
                          secondary={
                            listMode === "locale"
                              ? template.subject
                              : getLocaleLabel(template.locale)
                          }
                          primaryTypographyProps={{ className: "text-14" }}
                          secondaryTypographyProps={{
                            className: styles.listItemSecondary,
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                )}

                {!visibleTemplates.length && !isTemplatesLoading && (
                  <Typography
                    className={styles.emptyState}
                    color="text.secondary"
                  >
                    {translate("panel.mailTemplate.edit.emptyState")}
                  </Typography>
                )}
              </div>
            </SurfaceBlock>
          </div>

          <div className={styles.workspaceColumn}>
            <Tabs
              className={styles.modeTabs}
              variant="fullWidth"
              value={workspaceMode}
              onChange={handleWorkspaceModeChange}
            >
              <Tab
                value="edit"
                label={translate("panel.mailTemplate.edit.editTab")}
                data-test-id="tab-settings-email-templates-edit"
              />
              <Tab
                value="preview"
                label={translate("panel.mailTemplate.edit.previewTab")}
                data-test-id="tab-settings-email-templates-preview"
              />
            </Tabs>

            <SurfaceBlock className={styles.block}>
              <Typography className="text-17">
                {selectedTemplate?.title ||
                  translate("panel.mailTemplate.edit.editTitle")}
              </Typography>
              <Typography
                className={styles.workspaceMeta}
                color="text.secondary"
              >
                {selectedTemplate
                  ? getLocaleLabel(selectedTemplate.locale)
                  : translate("panel.mailTemplate.description")}
              </Typography>

              {workspaceMode === "edit" && (
                <FormProvider {...methods}>
                  <form
                    onSubmit={handleSubmit(handleSave)}
                    className={styles.workspaceForm}
                  >
                    <InputField
                      label={translate("panel.mailTemplate.edit.titleLabel")}
                      name="title"
                      dataTestId="txt-settings-email-templates-name"
                    />

                    <InputField
                      label={translate("panel.mailTemplate.edit.subjectLabel")}
                      name="subject"
                      dataTestId="txt-settings-email-templates-subject"
                    />

                    <Typography className={clsx("text-14", styles.fieldLabel)}>
                      {translate("panel.mailTemplate.edit.contentLabel")}
                    </Typography>
                    <div className={styles.variantButtons}>
                      <Button
                        type="button"
                        variant="outlined"
                        onClick={() => handleApplyPreset("variant_1")}
                        disabled={
                          !templatePresets?.variant_1 || isPresetsLoading
                        }
                        data-test-id="btn-settings-email-templates-variant-1"
                      >
                        {translate("panel.mailTemplate.edit.variant1Button")}
                      </Button>
                      <Button
                        type="button"
                        variant="outlined"
                        onClick={() => handleApplyPreset("variant_2")}
                        disabled={
                          !templatePresets?.variant_2 || isPresetsLoading
                        }
                        data-test-id="btn-settings-email-templates-variant-2"
                      >
                        {translate("panel.mailTemplate.edit.variant2Button")}
                      </Button>
                      <Button
                        type="button"
                        variant="outlined"
                        onClick={() => handleApplyPreset("variant_3")}
                        disabled={
                          !templatePresets?.variant_3 || isPresetsLoading
                        }
                        data-test-id="btn-settings-email-templates-variant-3"
                      >
                        {translate("panel.mailTemplate.edit.variant3Button")}
                      </Button>
                    </div>

                    <div className={styles.codeMirror}>
                      <CodeMirror
                        value={watchContent || ""}
                        height="420px"
                        extensions={[html()]}
                        onChange={(value) =>
                          setValue("content", value, {
                            shouldDirty: true,
                            shouldTouch: true,
                          })
                        }
                        data-testid="txt-settings-email-templates-body"
                      />
                    </div>

                    <div className={styles.actions}>
                      <Button
                        type="submit"
                        variant="contained"
                        data-test-id="btn-form-save"
                        disabled={
                          updateEmailTemplateResult.isLoading ||
                          !selectedTemplate ||
                          isObjectEmpty(dirtyFields)
                        }
                      >
                        {translate("actionButtons.save")}
                      </Button>
                    </div>
                  </form>
                </FormProvider>
              )}

              {workspaceMode === "preview" && (
                <div className={styles.preview}>
                  <ViewEmailTemplate content={renderedPreviewHtml} />
                </div>
              )}
            </SurfaceBlock>
          </div>
        </div>
      </div>
    </div>
  );
};
