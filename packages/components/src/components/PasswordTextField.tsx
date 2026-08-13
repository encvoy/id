import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import { FC, ReactNode, useState } from "react";
import { useFormContext } from "react-hook-form";
import { IconWithTooltip } from "./IconWithTooltip";

export type PasswordTextFieldProps = TextFieldProps & {
  nameField: string;
  showCopyButton?: boolean;
  disabled?: boolean;
  onChangeField?: () => void;
  children?: ReactNode;
  dataTestId?: string;
  showText?: string;
  hideText?: string;
  copyText?: string;
};

/**
 * PasswordTextField component displays a password input field with show/hide and optional copy functionality.
 * @param nameField - The name of the form field.
 * @param showCopyButton - Whether to show the copy button.
 * @param disabled - Whether the input is disabled.
 * @param onChangeField - Callback function for field change.
 * @param children - Additional content to render.
 */
export const PasswordTextField: FC<PasswordTextFieldProps> = ({
  nameField,
  showCopyButton = false,
  disabled,
  children,
  dataTestId,
  showText = "Show",
  hideText = "Hide",
  copyText = "Copy",
}) => {
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
        slotProps={{
          htmlInput: {
            "data-test-id": dataTestId,
          },
        }}
      />
      <IconWithTooltip
        dataTestId="btn-profile-password-show"
        dataAttribute="show-secret-key"
        Icon={showPassword ? VisibilityOffOutlinedIcon : VisibilityOutlinedIcon}
        title={showPassword ? hideText : showText}
        onClick={() => {
          setShowPassword((show) => !show);
        }}
      />
      {showCopyButton && (
        <IconWithTooltip
          Icon={ContentCopyOutlinedIcon}
          title={copyText}
          onClick={() => navigator.clipboard.writeText(String(fieldValue))}
        />
      )}
      {children}
    </div>
  );
};
