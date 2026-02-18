import { useFormContext } from 'react-hook-form';
import PhoneInputWithCountry from 'react-phone-number-input/react-hook-form';
import 'react-phone-number-input/style.css';
import { ReactNode, useState, forwardRef, useEffect } from 'react';
import { InputBaseComponentProps, TextField } from '@mui/material';
import { CountryCode } from 'libphonenumber-js';
import Typography from '@mui/material/Typography';

interface IInputPhoneProps {
  fieldName: string;
  label?: string;
  disabled?: boolean;
  children?: ReactNode;
}

const getUserCountryByIP = async (): Promise<CountryCode | undefined> => {
  try {
    const response = await fetch('https://www.cloudflare.com/cdn-cgi/trace');

    if (response.ok) {
      const data = await response.text();
      const lines = data.split('\n');
      const locLine = lines.find((line) => line.startsWith('loc='));

      if (locLine) {
        const countryCode = locLine.split('=')[1].toUpperCase().trim();
        return countryCode as CountryCode;
      }
    } else {
      console.warn('CloudFlare trace response not ok:', response.status);
    }
  } catch (e) {
    console.warn('Failed to detect user country by IP:', e);
  }
};

export const InputPhone = ({ fieldName, disabled, children }: IInputPhoneProps) => {
  const [country, setCountry] = useState<CountryCode | undefined>();
  const {
    control,
    getValues,
    formState: { errors },
  } = useFormContext();

  useEffect(() => {
    const value = getValues(fieldName);
    if (value) return;

    getUserCountryByIP().then((detectedCountry) => {
      setCountry(detectedCountry);
    });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <PhoneInputWithCountry
        name={fieldName}
        control={control}
        international
        countrySelectProps={{ unicodeFlags: true }}
        defaultCountry={country}
        disabled={disabled}
        inputComponent={CustomInput}
      />
      {children}
      {!!errors[fieldName] && (
        <Typography color="error.main">{errors[fieldName]?.message as string}</Typography>
      )}
    </div>
  );
};

const CustomInput = forwardRef<HTMLInputElement, InputBaseComponentProps>((props, ref) => {
  const { onChange, onBlur, onFocus, value, ...rest } = props;

  return (
    <TextField
      {...rest}
      inputRef={ref}
      value={value}
      autoFocus
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onFocus={onFocus}
      fullWidth
    />
  );
});
CustomInput.displayName = 'CustomInput';
