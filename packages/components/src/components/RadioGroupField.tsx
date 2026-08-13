import Box from "@mui/material/Box";
import FormControlLabel, {
  FormControlLabelProps,
} from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import Typography from "@mui/material/Typography";
import { FC } from "react";
import { Controller, useFormContext } from "react-hook-form";

interface IControlLabelProps extends Omit<FormControlLabelProps, "label"> {
  title: string;
  description?: string;
}

export const ControlLabel: FC<IControlLabelProps> = ({
  title,
  description,
  ...props
}) => {
  return (
    <FormControlLabel
      {...props}
      control={<Radio disableRipple />}
      label={
        <Box component="span">
          <Typography
            component="span"
            className="text-14"
            sx={{ display: "block" }}
          >
            {title}
          </Typography>
          {description ? (
            <Typography
              component="span"
              className="text-12"
              color="text.secondary"
              sx={{ display: "block" }}
            >
              {description}
            </Typography>
          ) : null}
        </Box>
      }
    />
  );
};

interface IRadioGroupFieldOption {
  value: string;
  title: string;
  description?: string;
  dataTestId?: string;
}

interface IRadioGroupFieldProps {
  name: string;
  options: IRadioGroupFieldOption[];
  gap?: string | number;
}

export const RadioGroupField: FC<IRadioGroupFieldProps> = ({
  name,
  options,
  gap = "6px",
}) => {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap,
            marginBottom: "32px",
          }}
        >
          {options.map((option) => (
            <ControlLabel
              key={option.value}
              title={option.title}
              description={option.description}
              checked={value === option.value}
              onClick={() => onChange(option.value)}
              control={<Radio data-test-id={option.dataTestId} disableRipple />}
            />
          ))}
        </Box>
      )}
    />
  );
};
