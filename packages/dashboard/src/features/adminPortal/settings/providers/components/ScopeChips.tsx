import {
  FC,
  useState,
  KeyboardEvent,
  Dispatch,
  SetStateAction,
  ChangeEvent,
  ReactNode,
} from "react";
import {
  Box,
  TextField,
  IconButton,
  InputAdornment,
  Typography,
} from "@mui/material";
import ControlPointOutlinedIcon from "@mui/icons-material/ControlPointOutlined";
import clsx from "clsx";
import styles from "./ScopeChips.module.css";
import { randomString } from "src/shared/utils/helpers";
import { Chip } from "@encvoy-id/components";

export interface IChipProps {
  key: string;
  value: string;
  changing?: boolean;
  isError?: boolean;
}

interface IScopeChipsProps {
  chips: IChipProps[];
  setChips: Dispatch<SetStateAction<IChipProps[]>>;
  title?: string;
  description?: string;
  validateFieldFn?: (value: string) => string;
  errors?: {
    [key: string]: string[];
  };
  setErrors?: Dispatch<
    SetStateAction<{
      [p: string]: string[];
    }>
  >;
  children?: ReactNode;
  inputDataTestId?: string;
}

export const ScopeChips: FC<IScopeChipsProps> = ({
  chips,
  setChips,
  title,
  description,
  validateFieldFn,
  errors,
  setErrors,
  children,
  inputDataTestId,
}) => {
  const [inputValue, setInputValue] = useState("");

  const isValidateValue = (value: string) => {
    if (!validateFieldFn || !errors || !setErrors) return true;

    const errorKey = validateFieldFn(value);
    if (!errorKey) {
      return true;
    }

    setErrors((errors) => ({
      ...errors,
      [errorKey]: [...(errors[errorKey] || []), value],
    }));
    return false;
  };

  const addChips = (items: string[]) => {
    const newValidChips: { key: string; value: string }[] = [];

    for (const value of items) {
      const normalized = value.trim().toLowerCase();

      if (isValidateValue(normalized)) {
        newValidChips.push({
          key: randomString(10),
          value: normalized,
        });
      }
    }

    setChips((prev) => [...prev, ...newValidChips]);
  };

  const deleteChip = (key: string) => {
    setChips((prev) => prev.filter((c) => c.key !== key));
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const values = inputValue.split(/[,;\s]+/).filter(Boolean);
      addChips(values);
      setInputValue("");
    }
  };

  const handleAddButtonClick = () => {
    const values = inputValue.split(/[,;\s]+/).filter(Boolean);
    addChips(values);
    setInputValue("");
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (setErrors) {
      setErrors({});
    }
    setInputValue(value);
  };

  return (
    <>
      {title && (
        <Typography className={clsx("text-14", styles.label)}>
          {title}
        </Typography>
      )}
      <Box>
        {chips.map((chip) => (
          <Chip
            key={chip.key}
            customText={{
              default:
                chip.value.length > 20
                  ? `${chip.value.slice(0, 20)}...`
                  : chip.value,
              error:
                chip.value.length > 20
                  ? `${chip.value.slice(0, 20)}...`
                  : chip.value,
            }}
            status={chip.isError ? "error" : "default"}
            onClickButton={() => deleteChip(chip.key)}
          />
        ))}

        <div className={styles.textFieldRow}>
          <TextField
            value={inputValue}
            className="custom"
            fullWidth
            variant="standard"
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            slotProps={{
              htmlInput: { "data-test-id": inputDataTestId },
              input: {
                endAdornment: (
                  <InputAdornment sx={{ mr: "10px" }} position="end">
                    <IconButton
                      onClick={handleAddButtonClick}
                      edge="end"
                      data-test-id="btn-user-add"
                    >
                      <ControlPointOutlinedIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          {children}
        </div>
      </Box>

      {errors &&
        Object.entries(errors).map(([key, values]) => (
          <div key={key} className={styles.errorBlock}>
            <Typography color="error.main" className="text-14">
              {key}
            </Typography>
            <Typography color="error.main" className="text-12">
              {values.join(", ")}
            </Typography>
          </div>
        ))}

      {description && (
        <Typography
          className={clsx("text-14", styles.description)}
          color="text.secondary"
        >
          {description}
        </Typography>
      )}
    </>
  );
};
