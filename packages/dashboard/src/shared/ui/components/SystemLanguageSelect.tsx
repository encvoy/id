import { MenuItem } from "@mui/material";
import Select from "@mui/material/Select";
import { useTranslation } from "react-i18next";
import {
  getSystemLanguageOptions,
  TSystemLanguage,
} from "src/shared/utils/locales";

interface ISystemLanguageSelectProps {
  value: TSystemLanguage;
  onChange: (value: TSystemLanguage) => void;
  dataTestId: string;
  optionTestIdPrefix: string;
  disabled?: boolean;
  className?: string;
  sx?: Record<string, any>;
  dataId?: string;
}

export const SystemLanguageSelect = ({
  value,
  onChange,
  dataTestId,
  optionTestIdPrefix,
  disabled = false,
  className,
  sx,
  dataId,
}: ISystemLanguageSelectProps) => {
  const { t: translate } = useTranslation();
  const languageOptions = getSystemLanguageOptions(translate);

  return (
    <Select
      ref={null}
      className={className}
      data-id={dataId}
      data-test-id={dataTestId}
      disabled={disabled}
      value={value}
      sx={sx}
      onChange={(event) => onChange(event.target.value as TSystemLanguage)}
    >
      {languageOptions.map((language) => (
        <MenuItem
          key={language.value}
          value={language.value}
          className="custom-select"
          data-test-id={`${optionTestIdPrefix}-${language.shortLabel}`}
        >
          {language.label}
        </MenuItem>
      ))}
    </Select>
  );
};
