import Box from "@mui/material/Box";
import Popover from "@mui/material/Popover";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { FC, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { HexColorPicker } from "react-colorful";

interface IColorPickerProps {
  name: string;
  label: string;
  error?: string;
  dataTestId?: string;
}

const wrapperSx = {
  display: "flex",
  alignItems: "center",
};

export const ColorPicker: FC<IColorPickerProps> = ({
  name,
  label,
  error,
  dataTestId,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const { register, control, clearErrors, setValue } = useFormContext();
  const value = useWatch({ control, name }) as string | undefined;
  const previewColor = value || "#FFFFFF";
  const open = Boolean(anchorEl);

  return (
    <Box sx={{ marginBottom: "24px" }}>
      <Typography sx={{ marginBottom: "8px" }} className="text-14">
        {label}
      </Typography>
      <Box sx={wrapperSx}>
        <Box
          sx={(theme) => ({
            width: "40px",
            height: "40px",
            backgroundColor: previewColor,
            flexShrink: 0,
            border: "1px solid",
            borderColor: theme.palette.divider,
          })}
          onClick={(event) =>
            setAnchorEl((prev) => (prev ? null : event.currentTarget))
          }
        />
        <TextField
          {...register(name, {
            onChange: () => clearErrors(name),
          })}
          sx={{ marginLeft: "16px" }}
          variant="standard"
          fullWidth
          inputProps={{ "data-test-id": dataTestId }}
        />
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          slotProps={{
            paper: {
              sx: { padding: "16px" },
            },
          }}
        >
          <HexColorPicker
            color={previewColor}
            onChange={(color: string) => {
              setValue(name, color, { shouldDirty: true });
              clearErrors(name);
            }}
          />
          <TextField
            {...register(name, {
              onChange: () => clearErrors(name),
            })}
            sx={{ marginTop: "8px" }}
            variant="standard"
          />
        </Popover>
      </Box>
      {error && (
        <Typography color="custom.error" className="text-14">
          {error}
        </Typography>
      )}
    </Box>
  );
};
