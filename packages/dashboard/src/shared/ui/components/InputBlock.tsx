import { TextField, Typography } from "@mui/material";
import clsx from "clsx";
import { FC, FocusEvent, ReactNode } from "react";
import { Control, useFormContext, useWatch } from "react-hook-form";
import styles from "./InputBlock.module.css";
import { useTranslation } from "react-i18next";

const DescriptionField = ({
  control,
  nameFormField,
}: {
  control: Control;
  nameFormField: string;
}) => {
  const { t: translate } = useTranslation();
  const description = useWatch({ control, name: nameFormField });

  return (
    <Typography className="text-14" color="text.secondary">
      {description?.length}/255 {translate("helperText.characterCount")}
    </Typography>
  );
};

interface InputFieldProps {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  rows?: number;
  multiline?: boolean;
  disabled?: boolean;
  placeholder?: string;
  watchLength?: boolean;
  mode?: "nested" | "direct";
  errorField?: string;
  errorNestedField?: string;
  children?: ReactNode;
}

/**
 * InputField component displays a text input field with label and optional features.
 * @param name - The name of the form field.
 * @param label - The label displayed above the input field.
 * @param description - The description text displayed below the input field.
 * @param required - Whether the field is required.
 * @param rows - The number of rows for multiline input.
 * @param multiline - Whether the input is multiline.
 * @param disabled - Whether the input is disabled.
 * @param placeholder - The placeholder text for the input.
 * @param watchLength - Whether to display the character count.
 * @param mode - The mode of the input field, either 'nested' or 'direct'.
 * @param errorField - The error field name for direct mode.
 * @param errorNestedField - The error field name for nested mode.
 * @param children - Additional content to render next to the input.
 */
export const InputField: FC<InputFieldProps> = ({
  name,
  label,
  required = false,
  description,
  rows,
  multiline,
  disabled,
  placeholder,
  watchLength,
  mode = "direct",
  errorField,
  errorNestedField,
  children,
}) => {
  const {
    register,
    formState: { errors },
    control,
    setValue,
    clearErrors,
  } = useFormContext();
  const { ref, ...rest } = register(name, {
    onChange: (event: FocusEvent<HTMLInputElement>) => {
      setValue(name, event.target.value.trimStart(), { shouldDirty: true });
      clearErrors(name);
    },
  });

  return (
    <div className={styles.wrapper}>
      <Typography
        className={clsx(
          "text-14",
          required ? styles.asterisk : "",
          styles.inputLabel
        )}
      >
        {label}
      </Typography>

      <div className={styles.textFieldRow}>
        <TextField
          ref={ref}
          {...rest}
          className="custom"
          error={
            mode === "nested"
              ? errorField && errorNestedField
                ? !!(errors as any)[errorField]?.[errorNestedField]
                : false
              : !!errors[name]
          }
          helperText={
            (mode === "nested"
              ? errorField && errorNestedField
                ? (errors as any)[errorField]?.[errorNestedField]
                : undefined
              : errors[name]
            )?.message as string
          }
          fullWidth
          variant="standard"
          multiline={multiline}
          rows={rows}
          disabled={disabled}
          placeholder={placeholder}
        />
        {children}
      </div>

      {description && (
        <Typography
          className={clsx("text-14", styles.description)}
          color="text.secondary"
        >
          {description}
        </Typography>
      )}

      {watchLength && (
        <DescriptionField control={control} nameFormField={name} />
      )}
    </div>
  );
};
