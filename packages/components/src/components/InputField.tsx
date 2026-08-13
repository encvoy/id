import { Box, TextField, Typography } from "@mui/material";
import clsx from "clsx";
import { FC, FocusEvent, ReactNode } from "react";
import {
  Control,
  FieldValues,
  RegisterOptions,
  useFormContext,
  useWatch,
} from "react-hook-form";
import styles from "./InputBlock.module.css";

const DescriptionField = ({
  control,
  nameFormField,
  characterCountLabel,
  maxCharacterCount,
}: {
  control: Control;
  nameFormField: string;
  characterCountLabel: string;
  maxCharacterCount: number;
}) => {
  const description = useWatch({ control, name: nameFormField });

  return (
    <Typography className="text-14" color="text.secondary">
      {description?.length}/{maxCharacterCount} {characterCountLabel}
    </Typography>
  );
};

export interface InputFieldProps {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  type?: string;
  rows?: number;
  multiline?: boolean;
  disabled?: boolean;
  placeholder?: string;
  watchLength?: boolean;
  mode?: "nested" | "direct";
  errorField?: string;
  errorNestedField?: string;
  SxProps?: Record<string, any>;
  isMarginBottomDisabled?: boolean;
  children?: ReactNode;
  dataTestId?: string;
  inputProps?: Record<string, any>;
  select?: boolean;
  rules?: RegisterOptions<FieldValues, string>;
  characterCountLabel?: string;
  maxCharacterCount?: number;
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
  type = "text",
  description,
  rows,
  multiline,
  disabled,
  placeholder,
  watchLength,
  mode = "direct",
  errorField,
  errorNestedField,
  SxProps,
  isMarginBottomDisabled = false,
  children,
  dataTestId,
  inputProps,
  select = false,
  rules,
  characterCountLabel = "characters",
  maxCharacterCount,
}) => {
  const {
    register,
    formState: { errors },
    control,
    setValue,
    clearErrors,
  } = useFormContext();
  const { ref, ...rest } = register(name, {
    ...rules,
    onChange: (event: FocusEvent<HTMLInputElement>) => {
      setValue(name, event.target.value.trimStart(), { shouldDirty: true });
      clearErrors(name);
    },
  });
  const fieldValue = useWatch({ control, name });

  const getNestedError = (obj: any, path: string) => {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  };
  const fieldError = getNestedError(errors, name);

  return (
    <Box
      sx={{ ...SxProps, mb: isMarginBottomDisabled ? 0 : "32px" }}
      className={styles.wrapper}
    >
      <Typography
        className={clsx(
          "text-14",
          required ? "asterisk" : "",
          styles.inputLabel
        )}
      >
        {label}
      </Typography>

      <div className={styles.textFieldRow}>
        <TextField
          type={type}
          ref={ref}
          {...rest}
          select={select}
          value={select ? (fieldValue ?? "") : undefined}
          slotProps={{
            htmlInput: {
              "data-test-id": dataTestId,
            },
          }}
          className="custom"
          error={
            mode === "nested"
              ? errorField && errorNestedField
                ? !!(errors as any)[errorField]?.[errorNestedField]
                : false
              : !!fieldError
          }
          helperText={
            (mode === "nested"
              ? errorField && errorNestedField
                ? (errors as any)[errorField]?.[errorNestedField]
                : undefined
              : fieldError
            )?.message as string
          }
          fullWidth
          variant="standard"
          multiline={multiline}
          rows={rows}
          disabled={disabled}
          placeholder={placeholder}
          inputProps={{
            ...inputProps,
            ...(maxCharacterCount !== undefined
              ? { maxLength: maxCharacterCount }
              : {}),
            "data-test-id": dataTestId,
          }}
        >
          {select ? children : null}
        </TextField>
        {!select && children}
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
        <DescriptionField
          control={control}
          nameFormField={name}
          characterCountLabel={characterCountLabel}
          maxCharacterCount={maxCharacterCount ?? 255}
        />
      )}
    </Box>
  );
};
