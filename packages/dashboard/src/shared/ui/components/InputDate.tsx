import React, { FC } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useFormContext } from "react-hook-form";
import clsx from "clsx";
import styles from "./InputBlock.module.css";
import { Typography } from "@mui/material";

interface IInputDateProps {
  label: string;
  name: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * InputDate component displays a date picker input field with label.
 * @param label - The label displayed above the date picker.
 * @param name - The name of the form field.
 * @param required - Whether the field is required.
 * @param disabled - Whether the date picker is disabled.
 */
export const InputDate: FC<IInputDateProps> = ({
  label,
  name,
  required = false,
  disabled,
}) => {
  const { setValue, watch } = useFormContext();

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
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          value={watch(name) ? new Date(watch(name)) : null}
          onChange={(newValue) => {
            setValue(name, newValue ? newValue.toISOString() : "", {
              shouldDirty: true,
            });
          }}
          disabled={disabled}
        />
      </LocalizationProvider>
    </div>
  );
};
