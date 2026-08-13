import { useFormContext } from "react-hook-form";
import PhoneInputWithCountry from "react-phone-number-input/react-hook-form";
import "react-phone-number-input/style.css";
import { ReactNode, useState, forwardRef, useEffect } from "react";
import {
  Box,
  InputBaseComponentProps,
  TextField,
  Typography,
} from "@mui/material";
import { CountryCode } from "libphonenumber-js";
import clsx from "clsx";
import styles from "./InputBlock.module.css";

interface IInputPhoneProps {
  name: string;
  label?: string;
  required?: boolean;
  description?: string;
  disabled?: boolean;
  children?: ReactNode;
  dataTestId?: string;
}

const getUserCountryByIP = async (): Promise<CountryCode | undefined> => {
  try {
    const response = await fetch("https://www.cloudflare.com/cdn-cgi/trace");

    if (response.ok) {
      const data = await response.text();
      const lines = data.split("\n");
      const locLine = lines.find((line) => line.startsWith("loc="));

      if (locLine) {
        const countryCode = locLine.split("=")[1].toUpperCase().trim();
        return countryCode as CountryCode;
      }
    } else {
      console.warn("CloudFlare trace response not ok:", response.status);
    }
  } catch (e) {
    console.warn("Failed to detect user country by IP:", e);
  }
};

export const InputPhone = ({
  name,
  label,
  required,
  description,
  disabled,
  children,
  dataTestId,
}: IInputPhoneProps) => {
  const [country, setCountry] = useState<CountryCode | undefined>();

  const { control, getValues } = useFormContext();

  useEffect(() => {
    const value = getValues(name);
    if (value) return;

    getUserCountryByIP().then((detectedCountry) => {
      setCountry(detectedCountry);
    });
  }, []);

  return (
    <Box sx={{ marginBottom: "24px" }}>
      <Typography
        className={clsx(
          "text-14",
          required ? "asterisk" : "",
          styles.inputLabel
        )}
      >
        {label}
      </Typography>
      <Box className={styles.textFieldRow}>
        <PhoneInputWithCountry
          name={name}
          control={control}
          international
          countrySelectProps={{ unicodeFlags: true }}
          defaultCountry={country}
          disabled={disabled}
          inputComponent={CustomInput}
          slotProps={{
            htmlInput: {
              "data-test-id": dataTestId,
            },
          }}
        />
        {children}
      </Box>
      {description && (
        <Typography
          className={clsx("text-14", styles.description)}
          color="text.secondary"
        >
          {description}
        </Typography>
      )}
    </Box>
  );
};

const CustomInput = forwardRef<HTMLInputElement, InputBaseComponentProps>(
  (props, ref) => {
    const { onChange, onBlur, onFocus, value, name, ...rest } = props;
    const {
      formState: { errors },
    } = useFormContext();

    return (
      <TextField
        {...rest}
        inputRef={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onFocus={onFocus}
        variant="standard"
        error={!!errors[name]}
        helperText={errors[name]?.message as string}
        fullWidth
      />
    );
  }
);
CustomInput.displayName = "CustomInput";
