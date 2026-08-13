import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import {
  Badge,
  Box,
  List,
  ListItem,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import clsx from "clsx";
import { ChangeEvent, FC, useMemo, useState } from "react";
import { useController, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ActionButtons } from "@encvoy-id/components";
import { IconWithTooltip } from "@encvoy-id/components";
import { ModalInfo } from "@encvoy-id/components";
import {
  createLocalizedText,
  DEFAULT_SYSTEM_LANGUAGE,
  getLocalizedTextMap,
  getLocalizedTextValue,
  getSystemLanguageOptions,
  stringifyLocalizedText,
  SYSTEM_LANGUAGE_OPTIONS,
  TLocalizedText,
  TSystemLanguage,
} from "src/shared/utils/locales";

type TStorageMode = "object" | "stringified";

interface IMultiLanguageModalInputFieldProps {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  languages?: readonly TSystemLanguage[];
  initialLanguages?: readonly TSystemLanguage[];
  storage?: TStorageMode;
  dataTestId?: string;
}

const DEFAULT_AVAILABLE_LANGUAGES = SYSTEM_LANGUAGE_OPTIONS.map(
  (language) => language.value
);

const DEFAULT_INITIAL_LANGUAGES: readonly TSystemLanguage[] = [
  DEFAULT_SYSTEM_LANGUAGE,
];

export const MultiLanguageModalInputField: FC<IMultiLanguageModalInputFieldProps> =
  ({
    name,
    label,
    description,
    required = false,
    disabled = false,
    placeholder,
    multiline = false,
    rows,
    languages = DEFAULT_AVAILABLE_LANGUAGES,
    initialLanguages = DEFAULT_INITIAL_LANGUAGES,
    storage = "object",
    dataTestId,
  }) => {
    const { t: translate, i18n } = useTranslation();
    const { control, clearErrors, setValue } = useFormContext();
    const theme = useTheme();
    const { field, fieldState } = useController({
      name,
      control,
      defaultValue:
        storage === "stringified"
          ? ""
          : (createLocalizedText(initialLanguages) as TLocalizedText),
    });
    const [isOpen, setIsOpen] = useState(false);
    const [draftValue, setDraftValue] = useState<TLocalizedText>(
      createLocalizedText(initialLanguages)
    );

    const fallbackLocale = initialLanguages[0] || DEFAULT_SYSTEM_LANGUAGE;
    const availableLanguageOptions = useMemo(
      () =>
        getSystemLanguageOptions(translate).filter((language) =>
          languages.includes(language.value)
        ),
      [languages, translate]
    );

    const currentLocale =
      availableLanguageOptions.find(
        (language) => language.value === i18n.language
      )?.value ||
      availableLanguageOptions.find((language) =>
        language.value.startsWith(`${i18n.language.split("-")[0]}-`)
      )?.value ||
      fallbackLocale;
    const languageOptions = useMemo(() => {
      const currentLanguage = availableLanguageOptions.find(
        (language) => language.value === currentLocale
      );

      if (!currentLanguage) return availableLanguageOptions;

      return [
        currentLanguage,
        ...availableLanguageOptions.filter(
          (language) => language.value !== currentLocale
        ),
      ];
    }, [availableLanguageOptions, currentLocale]);
    const currentValue = getLocalizedTextMap(field.value, fallbackLocale);
    const displayValue =
      currentValue[currentLocale] ||
      getLocalizedTextValue(field.value, currentLocale);
    const errorMessage = fieldState.error?.message as string | undefined;
    const primaryLocale = languageOptions[0]?.value || currentLocale;
    const primaryLocaleValue = draftValue[primaryLocale] ?? "";
    const filledLanguagesCount = languageOptions.filter(
      (language) =>
        language.value !== currentLocale &&
        (currentValue[language.value] ?? "").trim().length
    ).length;

    const handleOpen = () => {
      if (disabled) return;

      setDraftValue({
        ...createLocalizedText(
          languageOptions.map((language) => language.value)
        ),
        ...currentValue,
      });
      setIsOpen(true);
    };

    const handleClose = () => {
      setIsOpen(false);
    };

    const handleDraftChange =
      (locale: string) => (event: ChangeEvent<HTMLInputElement>) => {
        setDraftValue((prev) => ({
          ...prev,
          [locale]: event.target.value.trimStart(),
        }));
      };

    const handleFieldChange = (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = {
        ...createLocalizedText(
          languageOptions.map((language) => language.value)
        ),
        ...currentValue,
        [currentLocale]: event.target.value.trimStart(),
      };

      field.onChange(
        storage === "stringified"
          ? stringifyLocalizedText(nextValue)
          : nextValue
      );
      clearErrors(name);
    };

    const handleConfirm = () => {
      const nextValue =
        storage === "stringified"
          ? stringifyLocalizedText(draftValue)
          : draftValue;

      setValue(name, nextValue, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      clearErrors(name);
      field.onBlur();
      setIsOpen(false);
    };

    return (
      <Box sx={{ mb: "32px" }}>
        <Typography
          className={clsx("text-14", required ? "asterisk" : "")}
          sx={{ mb: "8px" }}
        >
          {label}
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <TextField
            className="custom"
            fullWidth
            variant="standard"
            slotProps={{
              htmlInput: {
                "data-test-id": dataTestId,
              },
            }}
            value={displayValue}
            onChange={handleFieldChange}
            onBlur={field.onBlur}
            disabled={disabled}
            error={!!errorMessage}
            helperText={errorMessage}
            placeholder={placeholder}
            multiline={multiline}
            rows={multiline ? rows : undefined}
            inputProps={{
              "data-test-id": dataTestId,
            }}
          />
          <Badge
            badgeContent={filledLanguagesCount}
            color="error"
            showZero
            sx={{
              ".MuiBadge-badge": {
                minWidth: "18px",
                width: "18px",
                height: "18px",
              },
            }}
          >
            <IconWithTooltip
              title={translate("pages.settings.locale.languages")}
              Icon={LanguageOutlinedIcon}
              disabled={disabled}
              onClick={handleOpen}
            />
          </Badge>
        </Box>

        {description && (
          <Typography
            className={"text-14"}
            color="text.secondary"
            sx={{ mt: "8px" }}
          >
            {description}
          </Typography>
        )}

        <ModalInfo isOpen={isOpen} onClose={handleClose} title={label}>
          <List
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              width: "100%",
              overflowY: "auto",
              maxHeight: "500px",
            }}
          >
            {languageOptions.map((language) => (
              <ListItem
                key={language.value}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: 0,
                }}
              >
                <span
                  className={`fi fi-${language.value
                    .split("-")[1]
                    .toLowerCase()}`}
                  style={{
                    width: "28px",
                    height: "20px",
                    display: "inline-block",
                    borderRadius: theme.encvoy.buttonBorderRadius,
                  }}
                />
                <Typography
                  className={"text-14"}
                  color="text.secondary"
                  sx={{ width: "30px" }}
                >
                  {language.shortLabel.toUpperCase()}
                </Typography>
                <TextField
                  className="custom"
                  fullWidth
                  variant="standard"
                  value={draftValue[language.value] ?? ""}
                  onChange={handleDraftChange(language.value)}
                  multiline={multiline}
                  rows={multiline ? rows : undefined}
                  placeholder={
                    language.value === currentLocale
                      ? placeholder
                      : primaryLocaleValue || placeholder
                  }
                />
              </ListItem>
            ))}
          </List>

          <ActionButtons
            cancelText={translate("actionButtons.cancel")}
            onCancel={handleClose}
            onSubmit={handleConfirm}
            submitText={translate("actionButtons.confirm")}
          />
        </ModalInfo>
      </Box>
    );
  };
