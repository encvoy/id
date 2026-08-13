import { Box, Typography } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import clsx from "clsx";
import { FC } from "react";
import { useFormContext } from "react-hook-form";
import styles from "./InputBlock.module.css";

interface IInputDateProps {
  label: string;
  name: string;
  required?: boolean;
  disabled?: boolean;
  dataTestId?: string;
  isMarginBottomDisabled?: boolean;
}

/**
 * InputDate component displays a date picker input field with label.
 * @param label - The label displayed above the date picker.
 * @param name - The name of the form field.
 * @param required - Whether the field is required.
 * @param disabled - Whether the date picker is disabled.
 * @param dataTestId - The data-testid attribute for testing purposes.
 * @param isMarginBottomDisabled - Whether to disable the bottom margin.
 */
export const InputDate: FC<IInputDateProps> = ({
  label,
  name,
  required = false,
  disabled,
  dataTestId,
  isMarginBottomDisabled = false,
}) => {
  const { setValue, watch } = useFormContext();

  return (
    <Box
      className={styles.wrapper}
      sx={{ mb: isMarginBottomDisabled ? 0 : "32px" }}
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
      <LocalizationProvider
        dateAdapter={AdapterDateFns}
        data-test-id={dataTestId}
      >
        <DatePicker
          value={watch(name) ? new Date(watch(name)) : null}
          onChange={(newValue) => {
            setValue(name, newValue ? newValue.toISOString() : "", {
              shouldDirty: true,
            });
          }}
          disabled={disabled}
          slotProps={{
            openPickerIcon: {
              sx: {
                color: "text.secondary",
              },
            },
          }}
        />
      </LocalizationProvider>
    </Box>
  );
};
