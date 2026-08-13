import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { SxProps, Theme } from "@mui/material/styles";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { CSSProperties, FC, useState } from "react";
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { InputField } from "@encvoy-id/components";
import { RadioGroupField } from "@encvoy-id/components";
import { SwitchBlock } from "@encvoy-id/components";
import styles from "./StylesPreview.module.css";
import { SurfaceBlock } from "@encvoy-id/components";
import {
  type SystemStyle,
  type ThemePalette,
} from "@encvoy-id/components/theme";

type TPreviewThemeSection = "theme_light" | "theme_dark";

interface IPreviewFormValues {
  system_style: SystemStyle;
  theme_light: ThemePalette;
  theme_dark: ThemePalette;
}

interface IPreviewFieldsFormValues {
  previewName: string;
  previewEnabled: boolean;
  previewNotifications: boolean;
  previewNotificationMode: string;
}

const parsePxValue = (value: unknown): number => {
  if (typeof value !== "string") {
    return 0;
  }

  const parsed = Number.parseInt(value.replace(/[^\d-]/g, ""), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const toPxValue = (value: number): string => `${value}px`;

const getColorValue = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const getBoxShadowValue = (value: unknown): string => {
  if (typeof value !== "string") {
    return "none";
  }

  return value.trim() || "none";
};

export const StylesPreview: FC = () => {
  const [previewTheme, setPreviewTheme] =
    useState<TPreviewThemeSection>("theme_light");
  const [previewSelectValue, setPreviewSelectValue] = useState("recent");
  const { t: translate } = useTranslation();
  const previewFieldsForm = useForm<IPreviewFieldsFormValues>({
    defaultValues: {
      previewName: "Trusted ID",
      previewEnabled: true,
      previewNotifications: true,
      previewNotificationMode: "all",
    },
  });
  const { control } = useFormContext<IPreviewFormValues>();

  const componentRadiusRaw = useWatch({
    control,
    name: "system_style.component.borderRadius",
  });
  const buttonRadiusRaw = useWatch({
    control,
    name: "system_style.button.borderRadius",
  });
  const surfaceBlockBorderWidthRaw = useWatch({
    control,
    name: "system_style.surfaceBlock.borderWidth",
  });
  const surfaceBlockHideBorder = useWatch({
    control,
    name: "system_style.surfaceBlock.hideBorder",
  });
  const surfaceBlockBoxShadowRaw = useWatch({
    control,
    name: "system_style.surfaceBlock.boxShadow",
  });
  const themeLight = useWatch({ control, name: "theme_light" });
  const themeDark = useWatch({ control, name: "theme_dark" });

  const palette = previewTheme === "theme_dark" ? themeDark : themeLight;
  const componentRadius = toPxValue(parsePxValue(componentRadiusRaw));
  const buttonRadius = toPxValue(parsePxValue(buttonRadiusRaw));
  const surfaceBlockBorderWidth = toPxValue(
    parsePxValue(surfaceBlockBorderWidthRaw)
  );
  const surfaceBlockBoxShadow = getBoxShadowValue(surfaceBlockBoxShadowRaw);
  const backgroundColor = getColorValue(palette.background?.default);
  const paperColor = getColorValue(palette.background?.paper);
  const primaryTextColor = getColorValue(palette.text?.primary);
  const secondaryTextColor = getColorValue(palette.text?.secondary);
  const dividerColor = getColorValue(palette.divider);
  const buttonColor = getColorValue(palette.primary?.main);
  const buttonTextColor = getColorValue(palette.primary?.contrastText);
  const secondaryColor = getColorValue(palette.secondary?.main);
  const secondaryContrastText = getColorValue(palette.secondary?.contrastText);
  const actionHover = getColorValue(palette.action?.hover);
  const fieldBorderColor = dividerColor || "transparent";
  const paperBackgroundColor = paperColor || "transparent";
  const primaryText = primaryTextColor || "inherit";
  const secondaryText = secondaryTextColor || "inherit";
  const primaryBorderColor = buttonColor || "transparent";
  const primaryButtonBackground = buttonColor || "transparent";
  const primaryButtonText = buttonTextColor || "inherit";
  const secondaryBadgeBackground = secondaryColor || "transparent";
  const secondaryBadgeText = secondaryContrastText || "inherit";
  const previewControlVariables = {
    "--preview-component-radius": componentRadius,
    "--preview-paper-color": paperBackgroundColor,
    "--preview-text-primary": primaryText,
    "--preview-text-secondary": secondaryText,
    "--preview-divider-color": fieldBorderColor,
    "--preview-primary-color": primaryButtonBackground,
    "--preview-primary-contrast-color": primaryButtonText,
  } as CSSProperties;
  const previewHoverVariables = {
    "--preview-hover-background": actionHover,
  } as CSSProperties;
  const surfaceBlockPreviewSx: SxProps<Theme> = surfaceBlockHideBorder
    ? {
        border: "none",
        borderWidth: 0,
        boxShadow: surfaceBlockBoxShadow,
      }
    : {
        borderStyle: "solid",
        borderWidth: surfaceBlockBorderWidth,
        borderColor: fieldBorderColor,
        boxShadow: surfaceBlockBoxShadow,
      };

  const selectSx = {
    width: "100%",
    borderRadius: componentRadius,
    "& .MuiOutlinedInput-root": {
      borderRadius: componentRadius,
      backgroundColor: paperBackgroundColor,
      color: primaryText,
      overflow: "hidden",
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: fieldBorderColor,
      borderRadius: componentRadius,
    },
    "& .MuiSelect-select": {
      borderRadius: componentRadius,
    },
    "& .MuiSvgIcon-root": {
      color: secondaryText,
    },
  };

  return (
    <div className={styles.previewSticky}>
      <Typography className="text-14" color="text.secondary">
        {translate("pages.settings.styling.preview.description")}
      </Typography>
      <Tabs
        className={styles.previewThemeTabs}
        value={previewTheme}
        onChange={(_, value: TPreviewThemeSection) => setPreviewTheme(value)}
      >
        <Tab
          data-test-id="tab-style-light"
          value="theme_light"
          label={translate("pages.settings.styling.preview.tabs.light")}
        />
        <Tab
          data-test-id="tab-style-dark"
          value="theme_dark"
          label={translate("pages.settings.styling.preview.tabs.dark")}
        />
      </Tabs>
      <FormProvider {...previewFieldsForm}>
        <SurfaceBlock
          sx={{ backgroundColor: backgroundColor }}
          className={styles.previewContainer}
        >
          <Button
            variant="contained"
            className={styles.previewButton}
            style={{
              borderRadius: buttonRadius,
              background: primaryButtonBackground,
              borderColor: primaryBorderColor,
              color: primaryButtonText,
            }}
          >
            {translate("pages.settings.styling.preview.buttons.primary")}
          </Button>
          <Button
            variant="contained"
            color="secondary"
            className={styles.previewButton}
            style={{
              borderRadius: buttonRadius,
              background: secondaryBadgeBackground || "transparent",
              borderColor: secondaryBadgeBackground,
              color: secondaryBadgeText || "inherit",
            }}
          >
            {translate("pages.settings.styling.preview.buttons.secondary")}
          </Button>
          <Button
            variant="outlined"
            className={styles.previewButton}
            style={{
              borderRadius: buttonRadius,
              background: buttonTextColor || "transparent",
              borderColor: primaryBorderColor,
              color: buttonColor || "inherit",
            }}
          >
            {translate("pages.settings.styling.preview.buttons.outlined")}
          </Button>

          <SurfaceBlock
            className={`${styles.previewSection} ${styles.previewHoverSection}`}
            sx={[
              surfaceBlockPreviewSx,
              {
                borderRadius: componentRadius,
                ...previewHoverVariables,
              },
            ]}
          >
            <Typography className="text-14" style={{ color: primaryText }}>
              {translate("pages.settings.styling.preview.textBlock.title")}
            </Typography>
            <Typography className="text-14" style={{ color: secondaryText }}>
              {translate(
                "pages.settings.styling.preview.textBlock.description"
              )}
            </Typography>
            <Link
              href="#"
              underline="none"
              onClick={(event) => event.preventDefault()}
              style={{ color: buttonColor }}
            >
              {translate("pages.settings.styling.preview.textBlock.link")}
            </Link>
          </SurfaceBlock>

          <SurfaceBlock
            className={styles.previewSection}
            sx={[
              surfaceBlockPreviewSx,
              {
                borderRadius: componentRadius,
                background: paperBackgroundColor,
              },
            ]}
          >
            <Typography className="text-14" style={{ color: primaryText }}>
              {translate("pages.settings.styling.preview.surfacesBlock.title")}
            </Typography>
            <Typography className="text-14" style={{ color: secondaryText }}>
              {translate(
                "pages.settings.styling.preview.surfacesBlock.description"
              )}
            </Typography>
          </SurfaceBlock>

          <SurfaceBlock
            className={styles.previewSection}
            sx={[
              surfaceBlockPreviewSx,
              {
                borderRadius: componentRadius,
              },
            ]}
          >
            <div>
              <SwitchBlock
                name="previewEnabled"
                label={translate(
                  "pages.settings.styling.preview.controls.switchLabel"
                )}
                description={translate(
                  "pages.settings.styling.preview.controls.switchDescription"
                )}
              />
              <Controller
                name="previewNotifications"
                control={previewFieldsForm.control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        disableRipple
                        checked={Boolean(field.value)}
                        onChange={(event) =>
                          field.onChange(event.target.checked)
                        }
                      />
                    }
                    label={translate(
                      "pages.settings.styling.preview.controls.checkboxLabel"
                    )}
                  />
                )}
              />
              <div className={styles.previewSubControl}>
                <RadioGroupField
                  name="previewNotificationMode"
                  options={[
                    {
                      value: "first",
                      title: translate(
                        "pages.settings.styling.preview.controls.radioOptions.first.title"
                      ),
                      description: translate(
                        "pages.settings.styling.preview.controls.radioOptions.first.description"
                      ),
                    },
                    {
                      value: "second",
                      title: translate(
                        "pages.settings.styling.preview.controls.radioOptions.second.title"
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          </SurfaceBlock>

          <SurfaceBlock
            className={styles.previewSection}
            sx={[
              surfaceBlockPreviewSx,
              {
                borderRadius: componentRadius,
                background: paperBackgroundColor,
              },
            ]}
          >
            <div className={styles.previewFieldsColumn}>
              <div
                className={styles.previewInteractiveSection}
                style={previewControlVariables}
              >
                <InputField
                  name="previewName"
                  label={translate(
                    "pages.settings.styling.preview.input.label"
                  )}
                  description={translate(
                    "pages.settings.styling.preview.input.description"
                  )}
                />
              </div>
              <Select
                size="small"
                value={previewSelectValue}
                onChange={(event) => setPreviewSelectValue(event.target.value)}
                sx={selectSx}
              >
                <MenuItem value="recent">
                  {translate(
                    "pages.settings.styling.preview.selectOptions.recent"
                  )}
                </MenuItem>
                <MenuItem value="active">
                  {translate(
                    "pages.settings.styling.preview.selectOptions.active"
                  )}
                </MenuItem>
                <MenuItem value="archived">
                  {translate(
                    "pages.settings.styling.preview.selectOptions.archived"
                  )}
                </MenuItem>
              </Select>
            </div>
          </SurfaceBlock>
        </SurfaceBlock>
      </FormProvider>
    </div>
  );
};
