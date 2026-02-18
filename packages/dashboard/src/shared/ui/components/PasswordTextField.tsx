import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import { FC, ReactNode, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { IconWithTooltip } from "./IconWithTooltip";
import { IconsLibrary } from "./IconLibrary";

type IPasswordTextfieldProps = TextFieldProps & {
  nameField: string;
  showCopyButton?: boolean;
  disabled?: boolean;
  onChangeField?: () => void;
  children?: ReactNode;
};

/**
 * PasswordTextField component displays a password input field with show/hide and optional copy functionality.
 * @param nameField - The name of the form field.
 * @param showCopyButton - Whether to show the copy button.
 * @param disabled - Whether the input is disabled.
 * @param onChangeField - Callback function for field change.
 * @param children - Additional content to render.
 */
export const PasswordTextField: FC<IPasswordTextfieldProps> = ({
  nameField,
  showCopyButton = false,
  disabled,
  children,
}) => {
  const { t: translate } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    formState: { errors },
    watch,
    clearErrors,
  } = useFormContext();
  const fieldValue = watch(nameField);

  const getNestedError = (obj: any, path: string) => {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  };

  const fieldError = getNestedError(errors, nameField);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        width: "100%",
      }}
    >
      <TextField
        {...register(nameField, {
          onChange: () => {
            if (fieldError) clearErrors(nameField);
          },
        })}
        error={!!fieldError}
        helperText={fieldError?.message as string}
        fullWidth
        variant="standard"
        className="custom"
        type={showPassword ? "text" : "password"}
        disabled={disabled}
        autoComplete="off"
      />
      <IconWithTooltip
        dataAttribute="show-secret-key"
        Icon={showPassword ? VisibilityOffOutlinedIcon : VisibilityOutlinedIcon}
        title={
          showPassword
            ? translate("actionButtons.hide")
            : translate("actionButtons.show")
        }
        onClick={() => {
          setShowPassword((show) => !show);
        }}
      />
      {showCopyButton && (
        <IconsLibrary
          type="copy"
          onClick={() => navigator.clipboard.writeText(String(fieldValue))}
        />
      )}
      {children}
    </div>
  );
};
