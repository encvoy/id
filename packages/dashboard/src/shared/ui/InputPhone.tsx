import { useFormContext } from "react-hook-form";
import PhoneInputWithCountry from "react-phone-number-input/react-hook-form";
import "react-phone-number-input/style.css";
import { ReactNode, useState, forwardRef, useEffect } from "react";
import { InputBaseComponentProps, TextField, Typography } from "@mui/material";
import { CountryCode } from "libphonenumber-js";

interface IInputPhoneProps {
  name: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  children?: ReactNode;
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
  description,
  disabled,
  children,
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
    <div style={{ marginBottom: 24 }}>
      <>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <PhoneInputWithCountry
            name={name}
            control={control}
            international
            countrySelectProps={{ unicodeFlags: true }}
            defaultCountry={country}
            disabled={disabled}
            inputComponent={CustomInput}
          />
          {children}
        </div>
        {description && (
          <Typography
            className="text-14"
            style={{ marginTop: 8 }}
            color="text.secondary"
          >
            {description}
          </Typography>
        )}
      </>
    </div>
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
