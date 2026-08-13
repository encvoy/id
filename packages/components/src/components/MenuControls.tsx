import Box from "@mui/material/Box";
import Popover from "@mui/material/Popover";
import { ElementType, FC, MouseEvent, ReactElement } from "react";
import { CustomIcon } from "./CustomIcon";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

interface IMenuControlsProps {
  dataTestId?: string[];
  anchorEl: HTMLButtonElement | null;
  onClose: () => void;
  controls: {
    icon: ElementType;
    title: string;
    description?: string;
    action: () => void;
    disabled?: boolean;
    addDivider?: boolean;
  }[];
}

/**
 * The MenuControls component displays a menu with control elements (buttons).
 * @param anchorEl - The element to which the menu is anchored.
 * @param onClose - Function to close the menu.
 * @param controls - Array of control elements (contains: icon, title, action, divider (optional)).
 */
export const MenuControls: FC<IMenuControlsProps> = ({
  anchorEl,
  onClose,
  controls,
  dataTestId,
}) => {
  const isOpen = Boolean(anchorEl);

  return (
    <Popover
      data-id="menu-controls"
      sx={{
        "& .MuiPaper-root": {
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          width: "290px",
        },
      }}
      onClose={(event: MouseEvent<ReactElement>) => {
        event.stopPropagation();
        onClose();
      }}
      anchorEl={anchorEl}
      open={isOpen}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
    >
      {controls.map((control, index) => (
        <Box key={index} sx={{ width: "100%" }}>
          <Button
            data-test-id={dataTestId?.[index]}
            color="secondary"
            onClick={(event: MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              control.action();
            }}
            disabled={control.disabled}
            startIcon={
              <CustomIcon
                Icon={control.icon}
                sx={{ marginRight: "16px" }}
                color="textSecondary"
              />
            }
          >
            <Box sx={{ textAlign: "left" }}>
              <Typography className="text-14">{control.title}</Typography>
              {control?.description && (
                <Typography className="text-12" color="text.secondary">
                  {control?.description}
                </Typography>
              )}
            </Box>
          </Button>
          {control?.addDivider && (
            <Box
              sx={{
                backgroundColor: "divider",
                height: "1px",
                margin: "8px 0",
                width: "100%",
              }}
            />
          )}
        </Box>
      ))}
    </Popover>
  );
};
