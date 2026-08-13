import Typography from "@mui/material/Typography";
import { FC, useEffect } from "react";
import { useTranslation } from "react-i18next";
import styles from "./StylingSettings.module.css";
import { setNoticeError, setNoticeInfo } from "src/shared/slices/noticesSlice";
import { useDispatch } from "react-redux";
import {
  useForm,
  SubmitHandler,
  Controller,
  FormProvider,
} from "react-hook-form";
import {
  useGetSettingsQuery,
  useEditSettingsMutation,
  ISettings,
} from "src/shared/api/settings";
import { Select, MenuItem, Button } from "@mui/material";
import {
  DEFAULT_SYSTEM_STYLE,
  normalizeSystemStyle,
  normalizeThemePalette,
  type ThemeContentPosition,
  type SystemStyle,
  type ThemePalette,
} from "@encvoy-id/components/theme";
import { AccordionBlock } from "@encvoy-id/components";
import { ColorPicker } from "@encvoy-id/components";
import { PixelSliderField } from "@encvoy-id/components";
import { SurfaceBlock } from "@encvoy-id/components";
import { InputField } from "@encvoy-id/components";
import { SwitchBlock } from "@encvoy-id/components";
import { StylesPreview } from "../components/StylesPreview";

interface IStylingSettingsFormValues {
  system_style: SystemStyle;
  theme_light: ThemePalette;
  theme_dark: ThemePalette;
}

const THEME_FIELD_PATHS = {
  primaryMain: "primary.main",
  primaryContrastText: "primary.contrastText",
  secondaryMain: "secondary.main",
  secondaryContrastText: "secondary.contrastText",
  textPrimary: "text.primary",
  textSecondary: "text.secondary",
  backgroundDefault: "background.default",
  backgroundPaper: "background.paper",
  actionHover: "action.hover",
  actionDisabled: "action.disabled",
  actionSelected: "action.selected",
  divider: "divider",
  errorMain: "error.main",
} as const;

type TThemeFieldKey = keyof typeof THEME_FIELD_PATHS;

const THEME_FIELD_LABELS = {
  primaryMain: "pages.settings.styling.themeFields.primaryMain",
  primaryContrastText: "pages.settings.styling.themeFields.primaryContrastText",
  secondaryMain: "pages.settings.styling.themeFields.secondaryMain",
  secondaryContrastText:
    "pages.settings.styling.themeFields.secondaryContrastText",
  textPrimary: "pages.settings.styling.themeFields.textPrimary",
  textSecondary: "pages.settings.styling.themeFields.textSecondary",
  backgroundDefault: "pages.settings.styling.themeFields.backgroundDefault",
  backgroundPaper: "pages.settings.styling.themeFields.backgroundPaper",
  actionHover: "pages.settings.styling.themeFields.actionHover",
  actionDisabled: "pages.settings.styling.themeFields.actionDisabled",
  actionSelected: "pages.settings.styling.themeFields.actionSelected",
  divider: "pages.settings.styling.themeFields.divider",
  errorMain: "pages.settings.styling.themeFields.errorMain",
};

const getThemeFieldNames = (prefix: "theme_light" | "theme_dark") => ({
  primaryMain: `${prefix}.primary.main`,
  primaryContrastText: `${prefix}.primary.contrastText`,
  secondaryMain: `${prefix}.secondary.main`,
  secondaryContrastText: `${prefix}.secondary.contrastText`,
  textPrimary: `${prefix}.text.primary`,
  textSecondary: `${prefix}.text.secondary`,
  backgroundDefault: `${prefix}.background.default`,
  backgroundPaper: `${prefix}.background.paper`,
  actionHover: `${prefix}.action.hover`,
  actionDisabled: `${prefix}.action.disabled`,
  actionSelected: `${prefix}.action.selected`,
  divider: `${prefix}.divider`,
  errorMain: `${prefix}.error.main`,
});

const FIELD_NAMES = {
  systemStyle: {
    componentBorderRadius: "system_style.component.borderRadius",
    buttonBorderRadius: "system_style.button.borderRadius",
    contentPosition: "system_style.contentPosition",
    surfaceBlockBorderWidth: "system_style.surfaceBlock.borderWidth",
    surfaceBlockHideBorder: "system_style.surfaceBlock.hideBorder",
    surfaceBlockBoxShadow: "system_style.surfaceBlock.boxShadow",
  },
  themeLight: getThemeFieldNames("theme_light"),
  themeDark: getThemeFieldNames("theme_dark"),
} as const;

const CONTENT_POSITION_OPTIONS: Array<{
  value: ThemeContentPosition;
  label: string;
}> = [
  {
    value: "start",
    label: "pages.settings.styling.systemControls.contentPositionOptions.start",
  },
  {
    value: "center",
    label:
      "pages.settings.styling.systemControls.contentPositionOptions.center",
  },
  {
    value: "end",
    label: "pages.settings.styling.systemControls.contentPositionOptions.end",
  },
];

const CONTENT_POSITION_OPTION_TEST_IDS: Record<ThemeContentPosition, string> = {
  start: "btn-style-position-left",
  center: "btn-style-position-center",
  end: "btn-style-position-right",
};

const THEME_FIELD_KEYS = Object.keys(THEME_FIELD_PATHS) as TThemeFieldKey[];

const EMPTY_THEME_PALETTE: ThemePalette = {
  primary: {
    main: "",
    contrastText: "",
  },
  secondary: {
    main: "",
    contrastText: "",
  },
  text: {
    primary: "",
    secondary: "",
  },
  background: {
    default: "",
    paper: "",
  },
  action: {
    hover: "",
    disabled: "",
    selected: "",
  },
  divider: "",
  error: {
    main: "",
  },
};

const defaultValues: IStylingSettingsFormValues = {
  system_style: DEFAULT_SYSTEM_STYLE,
  theme_light: EMPTY_THEME_PALETTE,
  theme_dark: EMPTY_THEME_PALETTE,
};

export const StylingSettings: FC = () => {
  const dispatch = useDispatch();
  const { t: translate } = useTranslation();
  const { data: dataSettings } = useGetSettingsQuery();
  const [editSettings, editSettingsResult] = useEditSettingsMutation();

  const methods = useForm<IStylingSettingsFormValues>({
    defaultValues,
    mode: "onChange",
  });

  const {
    getValues,
    handleSubmit,
    reset,
    formState: { dirtyFields },
  } = methods;

  useEffect(() => {
    if (!dataSettings) {
      return;
    }

    const nextValues = getValues();
    const parseSection = (value: string) => {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        dispatch(
          setNoticeError(translate("pages.settings.styling.errors.invalidJson"))
        );
      }

      return undefined;
    };

    const parsedSystemStyle = parseSection(dataSettings.system_style);
    if (parsedSystemStyle) {
      nextValues.system_style = normalizeSystemStyle(parsedSystemStyle);
    }

    const parsedThemeLight = parseSection(dataSettings?.theme_light);
    if (parsedThemeLight) {
      nextValues.theme_light = normalizeThemePalette(parsedThemeLight);
    }

    const parsedThemeDark = parseSection(dataSettings.theme_dark);
    if (parsedThemeDark) {
      nextValues.theme_dark = normalizeThemePalette(parsedThemeDark);
    }

    reset(nextValues);
  }, [dataSettings]);

  useEffect(() => {
    if (editSettingsResult.isSuccess) {
      dispatch(setNoticeInfo(translate("info.infoUpdated")));
    }
  }, [editSettingsResult.isSuccess]);

  const onSubmit: SubmitHandler<IStylingSettingsFormValues> = async (data) => {
    const payload: Partial<ISettings> = {};
    const normalizedSystemStyle = normalizeSystemStyle(
      data.system_style
    );

    if (dirtyFields.system_style) {
      payload.system_style = JSON.stringify(normalizedSystemStyle);
    }

    if (dirtyFields.theme_light) {
      payload.theme_light = JSON.stringify(data.theme_light);
    }

    if (dirtyFields.theme_dark) {
      payload.theme_dark = JSON.stringify(data.theme_dark);
    }

    if (!Object.keys(payload).length) {
      return;
    }

    await editSettings(payload).unwrap();
    reset({ ...data, system_style: normalizedSystemStyle });
  };

  return (
    <div className="page-container">
      <div className="content">
        <Typography className="title-medium" sx={{ margin: "32px 0" }}>
          {translate("pages.settings.sections.styling")}
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormProvider {...methods}>
            <div className={styles.layout}>
              <SurfaceBlock className={styles.settingsColumn}>
                <div className={styles.section}>
                  <Typography className="text-17">
                    {translate("pages.settings.styling.sections.systemStyles")}
                  </Typography>
                  <div className={styles.systemControls}>
                    <div className={styles.limitedControl}>
                      <PixelSliderField
                        name={FIELD_NAMES.systemStyle.componentBorderRadius}
                        label={translate(
                          "pages.settings.styling.systemControls.componentBorderRadius"
                        )}
                      />
                    </div>
                    <div className={styles.limitedControl}>
                      <PixelSliderField
                        name={FIELD_NAMES.systemStyle.buttonBorderRadius}
                        label={translate(
                          "pages.settings.styling.systemControls.buttonBorderRadius"
                        )}
                      />
                    </div>
                    <div className={styles.limitedControl}>
                      <PixelSliderField
                        name={FIELD_NAMES.systemStyle.surfaceBlockBorderWidth}
                        label={translate(
                          "pages.settings.styling.systemControls.surfaceBlockBorderWidth"
                        )}
                        min={0}
                        max={16}
                      />
                    </div>
                    <div className={styles.limitedControl}>
                      <SwitchBlock
                        name={FIELD_NAMES.systemStyle.surfaceBlockHideBorder}
                        label={translate(
                          "pages.settings.styling.systemControls.surfaceBlockHideBorder"
                        )}
                        dataTestId="chk-style-surfaceblock-border-hide"
                      />
                    </div>
                    <div className={styles.limitedControl}>
                      <InputField
                        name={FIELD_NAMES.systemStyle.surfaceBlockBoxShadow}
                        label={translate(
                          "pages.settings.styling.systemControls.surfaceBlockBoxShadow"
                        )}
                        placeholder="0 4px 20px rgba(0, 0, 0, 0.1)"
                        dataTestId="txt-style-surfaceblock-shadow"
                      />
                    </div>
                    <div className={styles.limitedControl}>
                      <div className={styles.selectField}>
                        <Typography className="text-14">
                          {translate(
                            "pages.settings.styling.systemControls.contentPosition"
                          )}
                        </Typography>
                        <Controller
                          name={FIELD_NAMES.systemStyle.contentPosition}
                          render={({ field }) => (
                            <Select
                              className={styles.select}
                              data-test-id="ddl-style-content-position"
                              value={field.value || "start"}
                              onChange={(event) =>
                                field.onChange(
                                  event.target.value as ThemeContentPosition
                                )
                              }
                            >
                              {CONTENT_POSITION_OPTIONS.map((option) => (
                                <MenuItem
                                  className="custom-select"
                                  key={option.value}
                                  value={option.value}
                                  data-test-id={
                                    CONTENT_POSITION_OPTION_TEST_IDS[
                                      option.value
                                    ]
                                  }
                                >
                                  {translate(option.label)}
                                </MenuItem>
                              ))}
                            </Select>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.section}>
                  <AccordionBlock
                    title={translate(
                      "pages.settings.styling.sections.lightTheme"
                    )}
                    isOpen={false}
                    dataTestId="ddl-style-light-theme"
                  >
                    {THEME_FIELD_KEYS.map((fieldKey) => (
                      <div
                        key={`theme-light-${fieldKey}`}
                        className={styles.limitedControl}
                      >
                        <ColorPicker
                          name={FIELD_NAMES.themeLight[fieldKey]}
                          label={translate(THEME_FIELD_LABELS[fieldKey])}
                        />
                      </div>
                    ))}
                  </AccordionBlock>
                </div>

                <div className={styles.section}>
                  <AccordionBlock
                    title={translate(
                      "pages.settings.styling.sections.darkTheme"
                    )}
                    isOpen={false}
                    dataTestId="ddl-style-dark-theme"
                  >
                    {THEME_FIELD_KEYS.map((fieldKey) => (
                      <div
                        key={`theme-dark-${fieldKey}`}
                        className={styles.limitedControl}
                      >
                        <ColorPicker
                          name={FIELD_NAMES.themeDark[fieldKey]}
                          label={translate(THEME_FIELD_LABELS[fieldKey])}
                        />
                      </div>
                    ))}
                  </AccordionBlock>
                </div>

                <div className={styles.buttonWrapper}>
                  <Button
                    type="submit"
                    variant="contained"
                    data-test-id="btn-form-save"
                    disabled={
                      !dirtyFields.system_style &&
                      !dirtyFields.theme_light &&
                      !dirtyFields.theme_dark
                    }
                  >
                    {translate("actionButtons.save")}
                  </Button>
                </div>
              </SurfaceBlock>

              <div className={styles.previewColumn}>
                <StylesPreview />
              </div>
            </div>
          </FormProvider>
        </form>
      </div>
    </div>
  );
};
