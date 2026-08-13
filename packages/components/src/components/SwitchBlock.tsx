import Switch from "@mui/material/Switch";
import { FC } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { SxProps, Theme, Typography } from "@mui/material";
import Box from "@mui/material/Box";

interface ISwitchBlockProps {
  name: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  defaultValue?: boolean;
  onChange?: (value: boolean) => void;
  dataTestId?: string;
  sx?: SxProps<Theme>;
}

/**
 * SwitchBlock component displays a switch with label and optional description.
 * @param name - The name of the form field.
 * @param label - The label displayed next to the switch.
 * @param description - The description text displayed below the label.
 * @param disabled - Whether the switch is disabled.
 * @param defaultValue - The default value for the switch.
 * @param onChange - Callback function when the switch value changes.
 */
export const SwitchBlock: FC<ISwitchBlockProps> = ({
  name,
  label,
  description,
  disabled,
  defaultValue,
  onChange,
  dataTestId,
  sx,
}) => {
  const { control } = useFormContext();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: label ? "16px" : 0,
        marginBottom: "32px",
        ...sx,
      }}
    >
      <div>
        {label && <Typography className="text-14">{label}</Typography>}
        {description && (
          <Typography
            sx={{ mt: "8px" }}
            className="text-12"
            color="text.secondary"
          >
            {description}
          </Typography>
        )}
      </div>
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue}
        disabled={disabled}
        render={({ field }) => (
          <Switch
            data-test-id={dataTestId}
            disableRipple
            checked={field.value}
            disabled={disabled}
            onChange={(e) => {
              field.onChange(e.target.checked);
              if (onChange) {
                onChange(e.target.checked);
              }
            }}
          />
        )}
      />
    </Box>
  );
};
