import { Box, Checkbox, FormControlLabel, Typography } from "@mui/material";
import {
  Control,
  Controller,
  FieldPath,
  FieldValues,
  RegisterOptions,
} from "react-hook-form";

interface ICheckboxFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  disabled?: boolean;
  isMarginBottomDisabled?: boolean;
  rules?: RegisterOptions<TFieldValues, FieldPath<TFieldValues>>;
}

export const CheckboxField = <TFieldValues extends FieldValues>({
  control,
  name,
  label,
  disabled,
  isMarginBottomDisabled,
  rules,
}: ICheckboxFieldProps<TFieldValues>) => {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <Box sx={{ mb: isMarginBottomDisabled ? 0 : "32px" }}>
          <FormControlLabel
            sx={{ mb: 0 }}
            control={
              <Checkbox
                checked={!!value}
                onChange={(_, checked) => onChange(checked)}
                disabled={disabled}
              />
            }
            label={<Typography className="text-14">{label}</Typography>}
          />
          {error?.message ? (
            <Typography
              className="text-12"
              color="error"
              sx={{ ml: "32px", mt: "4px" }}
            >
              {error.message}
            </Typography>
          ) : null}
        </Box>
      )}
    />
  );
};
