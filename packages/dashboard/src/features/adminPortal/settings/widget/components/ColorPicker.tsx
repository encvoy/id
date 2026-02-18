import Box from "@mui/material/Box";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import TextField from "@mui/material/TextField";
import { FC, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { useFormContext, useWatch } from "react-hook-form";
import styles from "./ColorPicker.module.css";

const ColorPicker: FC<{
  colorName: string;
}> = ({ colorName }) => {
  const [open, setOpen] = useState(false);

  const { register, control, clearErrors, setValue } = useFormContext();
  const value = useWatch({ control, name: `widget_colors.${colorName}` });
  const handleClickAway = () => setOpen(false);
  const handleClick = () => setOpen((prev) => !prev);

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box className={styles.wrapper}>
        <div
          style={{ background: value }}
          onClick={handleClick}
          className={styles.colorBox}
        />
        <TextField
          {...register(`widget_colors.${colorName}`, {
            onChange: () => {
              clearErrors(`widget_colors.${colorName}`);
            },
          })}
          className={styles.textField}
          variant="standard"
        />
        {open ? (
          <div className={styles.colorPicker}>
            <HexColorPicker
              color={value}
              onChange={(color: string) => {
                setValue(`widget_colors.${colorName}`, color, {
                  shouldDirty: true,
                });
              }}
            />
            <div>
              <TextField
                {...register(`widget_colors.${colorName}`, {
                  onChange: () => {
                    clearErrors(`widget_colors.${colorName}`);
                  },
                })}
                className={styles.textField}
                variant="standard"
              />
            </div>
          </div>
        ) : null}
      </Box>
    </ClickAwayListener>
  );
};

export default ColorPicker;
