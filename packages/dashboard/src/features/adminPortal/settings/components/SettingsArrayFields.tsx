import { Button, TextField } from "@mui/material";
import clsx from "clsx";
import { useEffect, useRef, useState, ChangeEvent } from "react";
import {
  FieldError,
  FieldErrors,
  useFormContext,
  useWatch,
} from "react-hook-form";
import styles from "./SettingsArrayFields.module.css";
import { findDuplicateIndex } from "src/shared/utils/helpers";
import { useTranslation } from "react-i18next";
import Typography from "@mui/material/Typography";

const ArrayTextFieldItem = (props: {
  value: string;
  index: number;
  nameField: string;
  disabled?: boolean;
}) => {
  const { value, index, nameField, disabled } = props;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [currentValue, setCurrentValue] = useState<string>(value);
  const { t: translate } = useTranslation();

  const {
    formState: { errors },
    setValue,
    getValues,
    setError,
    clearErrors,
  } = useFormContext();
  const typedErrors = errors as FieldErrors<Record<string, string[]>>;

  const rawFieldErrors = typedErrors[nameField] as
    | (FieldError | undefined)[]
    | FieldError
    | undefined;
  const errorAtIndex: FieldError | undefined = Array.isArray(rawFieldErrors)
    ? (rawFieldErrors as (FieldError | undefined)[])[index]
    : (rawFieldErrors as FieldError | undefined);

  useEffect(() => {
    const fieldErrors = errors[nameField] as Array<string> | undefined;
    if (fieldErrors && fieldErrors[index]) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [errors]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCurrentValue(event.target.value);
    const values = getValues(nameField);
    const updates = [...values];
    updates[index] = event.target.value;
    setValue(nameField, updates, { shouldDirty: true });

    const indexDuplicate = findDuplicateIndex(updates);
    if (indexDuplicate === index) {
      setError(`${nameField}.${index}`, {
        type: "custom",
        message: translate("errors.valuesShouldNotRepeat"),
      });
    } else {
      clearErrors();
    }
  };

  return (
    <TextField
      value={currentValue}
      onChange={handleChange}
      inputRef={inputRef}
      className={styles.textField}
      variant="standard"
      error={!!errorAtIndex}
      helperText={errorAtIndex?.message}
      disabled={disabled}
    />
  );
};

interface IArrayTextFieldsProps {
  name: string;
  title: string;
  description: string;
  disabled?: boolean;
  required?: boolean;
}

export const ArrayTextFields = ({
  name,
  title,
  description,
  disabled,
  required,
}: IArrayTextFieldsProps) => {
  const { t: translate } = useTranslation();
  const { getValues, setValue, control } = useFormContext();
  const fields: string[] = useWatch({ control, name });

  const handleAddField = () => {
    const fields = getValues(name);
    setValue(name, [...fields, ""]);
  };

  const handleRemoveField = (index: number) => {
    const fields: string[] = getValues(name);
    const updated = fields.filter((_, i) => i !== index);
    setValue(name, updated, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <>
      {fields.map((value, index) => (
        <div
          className={index === 0 ? styles.inputFields : styles.inputFieldsMin}
          key={index}
        >
          <Typography
            className={clsx(
              "text-14",
              required && index === 0 ? styles.asterisk : "",
              styles.inputTitle
            )}
          >
            {title + (index + 1)} ({name})
          </Typography>
          <div className={styles.fieldItem}>
            <ArrayTextFieldItem
              value={value}
              disabled={disabled}
              index={index}
              nameField={name}
            />
            {index === 0 ? (
              <Button
                variant="text"
                onClick={handleAddField}
                disabled={disabled}
              >
                {translate("actionButtons.add")}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="secondary"
                onClick={() => handleRemoveField(index)}
                className={clsx(styles.deleteButton)}
                disabled={disabled}
              >
                {translate("actionButtons.delete")}
              </Button>
            )}
          </div>
          {index === 0 && (
            <Typography
              className={clsx("text-14", styles.description)}
              color="text.secondary"
            >
              {description}
            </Typography>
          )}
        </div>
      ))}
    </>
  );
};
