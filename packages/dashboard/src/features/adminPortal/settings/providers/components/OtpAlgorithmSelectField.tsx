import { Box, MenuItem, Select, Typography } from "@mui/material";
import {
  Controller,
  FieldValues,
  Path,
  PathValue,
  useFormContext,
} from "react-hook-form";
import {
  OTP_ALGORITHM_DEFAULT,
  OTP_ALGORITHM_OPTIONS,
} from "src/features/adminPortal/settings/providers/utils";

interface IOtpAlgorithmSelectFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  description?: string;
}

export const OtpAlgorithmSelectField = <T extends FieldValues>({
  name,
  label,
  description,
}: IOtpAlgorithmSelectFieldProps<T>) => {
  const { control } = useFormContext<T>();

  return (
    <Box sx={{ mb: "32px" }}>
      <Typography className="text-14" sx={{ mb: 1 }}>
        {label}
      </Typography>

      <Controller
        control={control}
        name={name}
        defaultValue={OTP_ALGORITHM_DEFAULT as PathValue<T, Path<T>>}
        render={({ field }) => (
          <Select
            name={field.name}
            inputRef={field.ref}
            className="custom"
            fullWidth
            value={field.value ?? OTP_ALGORITHM_DEFAULT}
            onBlur={field.onBlur}
            onChange={(event) => field.onChange(event.target.value)}
          >
            {OTP_ALGORITHM_OPTIONS.map((variant) => (
              <MenuItem key={variant} value={variant} className="custom-select">
                {variant}
              </MenuItem>
            ))}
          </Select>
        )}
      />

      {description && (
        <Typography className="text-14" color="text.secondary" sx={{ mt: 1 }}>
          {description}
        </Typography>
      )}
    </Box>
  );
};
