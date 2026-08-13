import { Box, Slider, TextField, Typography } from "@mui/material";
import { FC } from "react";
import { Controller, useFormContext } from "react-hook-form";

interface IPixelSliderFieldProps {
  name: string;
  label: string;
  min?: number;
  max?: number;
}

const parsePxValue = (value: unknown): number => {
  if (typeof value !== "string") {
    return 0;
  }

  const parsed = Number.parseInt(value.replace(/[^\d-]/g, ""), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const toPxValue = (value: number): string => `${value}px`;

export const PixelSliderField: FC<IPixelSliderFieldProps> = ({
  name,
  label,
  min = 0,
  max = 64,
}) => {
  const { control } = useFormContext();

  return (
    <Box
      sx={{
        marginBottom: "24px",
      }}
    >
      <Typography className="text-14">{label}</Typography>
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const sliderValue = Math.max(
            min,
            Math.min(max, parsePxValue(field.value))
          );

          return (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "24px",
              }}
            >
              <Slider
                min={min}
                max={max}
                step={1}
                value={sliderValue}
                valueLabelDisplay="auto"
                onChange={(_, value) => {
                  const nextValue = Array.isArray(value) ? value[0] : value;
                  field.onChange(toPxValue(nextValue));
                }}
              />
              <TextField
                variant="standard"
                value={field.value || ""}
                onChange={(event) => {
                  const nextValue = Number.parseInt(
                    event.target.value.replace(/[^\d-]/g, ""),
                    10
                  );

                  if (Number.isNaN(nextValue)) {
                    field.onChange("");
                    return;
                  }

                  const normalized = Math.max(min, Math.min(max, nextValue));
                  field.onChange(toPxValue(normalized));
                }}
              />
            </Box>
          );
        }}
      />
    </Box>
  );
};
