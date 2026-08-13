import { Box, TextField } from "@mui/material";
import {
  ChangeEvent,
  ClipboardEvent,
  FC,
  KeyboardEvent,
  PointerEvent,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";

interface ICodeInputProps {
  value: string;
  onChange: (value: string) => void;
  length: number;
  disabled?: boolean;
  autoFocus?: boolean;
  dataTestId?: string;
}

const getDigitsOnlyValue = (value: string, length: number) =>
  value.replace(/\D/g, "").slice(0, length);

export const InputCode: FC<ICodeInputProps> = ({
  value,
  onChange,
  length,
  disabled = false,
  autoFocus = false,
  dataTestId,
}) => {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const pendingFocusIndexRef = useRef<number | null>(null);
  const normalizedValue = getDigitsOnlyValue(value, length);
  const maxInteractiveIndex = Math.min(normalizedValue.length, length - 1);
  const digits = Array.from(
    { length },
    (_, index) => normalizedValue[index] ?? ""
  );

  const getSafeIndex = (index: number) =>
    Math.max(0, Math.min(index, length - 1));

  const focusInput = (index: number) => {
    const nextIndex = getSafeIndex(index);
    const nextInput = inputRefs.current[nextIndex];

    if (!nextInput) return;

    nextInput.focus();
    nextInput.select();
  };

  const focusAllowedInput = (index: number) => {
    focusInput(Math.min(getSafeIndex(index), maxInteractiveIndex));
  };

  const queueFocus = (index: number) => {
    pendingFocusIndexRef.current = index;
  };

  const replaceDigits = (index: number, nextDigits: string) => {
    if (!nextDigits) return;

    const safeIndex = Math.min(index, normalizedValue.length);
    const updatedValue = normalizedValue.split("");

    nextDigits.split("").forEach((digit, offset) => {
      updatedValue[safeIndex + offset] = digit;
    });

    return updatedValue.join("").slice(0, length);
  };

  const handleChange =
    (index: number) => (event: ChangeEvent<HTMLInputElement>) => {
      const nextDigits = getDigitsOnlyValue(event.target.value, length);

      if (!nextDigits) {
        const updatedValue =
          normalizedValue[index] !== undefined
            ? `${normalizedValue.slice(0, index)}${normalizedValue.slice(
                index + 1
              )}`
            : normalizedValue;

        onChange(updatedValue);
        return;
      }

      const updatedValue =
        nextDigits.length >= length
          ? nextDigits
          : replaceDigits(index, nextDigits) ?? normalizedValue;

      onChange(updatedValue);

      const nextFocusIndex =
        nextDigits.length >= length
          ? length - 1
          : Math.min(index + nextDigits.length, length - 1);

      queueFocus(nextFocusIndex);
    };

  const handleKeyDown =
    (index: number) => (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        focusAllowedInput(index - 1);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        focusAllowedInput(index + 1);
        return;
      }

      if (event.key !== "Backspace") return;

      if (normalizedValue[index] !== undefined) {
        event.preventDefault();
        onChange(
          `${normalizedValue.slice(0, index)}${normalizedValue.slice(
            index + 1
          )}`
        );
        return;
      }

      if (index === 0) return;

      event.preventDefault();
      onChange(
        `${normalizedValue.slice(0, index - 1)}${normalizedValue.slice(index)}`
      );
      queueFocus(index - 1);
    };

  const handlePointerDown =
    (index: number) => (event: PointerEvent<HTMLDivElement>) => {
      if (disabled || index <= maxInteractiveIndex) return;

      event.preventDefault();
      focusAllowedInput(index);
    };

  const handlePaste =
    (index: number) => (event: ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault();

      const pastedDigits = getDigitsOnlyValue(
        event.clipboardData.getData("text"),
        length
      );

      if (!pastedDigits) return;

      if (pastedDigits.length >= length) {
        onChange(pastedDigits);
        queueFocus(length - 1);
        return;
      }

      const updatedValue =
        replaceDigits(index, pastedDigits) ?? normalizedValue;

      onChange(updatedValue);
      queueFocus(Math.min(index + pastedDigits.length, length - 1));
    };

  const handleFocus = (index: number) => () => {
    if (disabled) return;

    inputRefs.current[index]?.select();
  };

  useEffect(() => {
    if (!autoFocus || disabled || length < 1) return;

    focusAllowedInput(normalizedValue.length);
  }, [autoFocus, disabled, length]);

  useLayoutEffect(() => {
    if (disabled) {
      pendingFocusIndexRef.current = null;
      return;
    }

    const nextFocusIndex = pendingFocusIndexRef.current;

    if (nextFocusIndex === null) return;

    pendingFocusIndexRef.current = null;
    focusAllowedInput(nextFocusIndex);
  }, [disabled, maxInteractiveIndex, normalizedValue]);

  if (length < 1) return null;

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        marginTop: 2,
        justifyContent: "center",
        flexWrap: "wrap",
      }}
    >
      {digits.map((digit, index) => (
        <TextField
          key={index}
          value={digit}
          onChange={handleChange(index)}
          onKeyDown={handleKeyDown(index)}
          onPaste={handlePaste(index)}
          onPointerDown={handlePointerDown(index)}
          onFocus={handleFocus(index)}
          disabled={disabled}
          variant="standard"
          className="custom"
          inputRef={(element) => {
            inputRefs.current[index] = element;
          }}
          sx={{
            width: 40,
            "& .MuiInput-root": {
              padding: 0,
              minHeight: 40,
              justifyContent: "center",
              alignItems: "center",
            },
            "& .MuiInput-input": {
              width: 40,
              height: 38,
              boxSizing: "border-box",
              padding: 0,
              lineHeight: "40px",
              textAlign: "center",
              fontSize: "1.25rem",
            },
          }}
          slotProps={{
            htmlInput: {
              inputMode: "numeric",
              pattern: "[0-9]*",
              maxLength: 1,
              autoComplete: index === 0 ? "one-time-code" : "off",
              tabIndex: index <= maxInteractiveIndex ? 0 : -1,
              "data-test-id": dataTestId ? `${dataTestId}-${index}` : undefined,
            },
          }}
        />
      ))}
    </Box>
  );
};
