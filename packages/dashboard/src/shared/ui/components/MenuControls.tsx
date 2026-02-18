import { SvgIconProps } from "@mui/material";
import Box from "@mui/material/Box";
import Popover from "@mui/material/Popover";
import { ElementType, FC, MouseEvent, ReactElement } from "react";
import { CustomIcon } from "src/shared/ui/components/CustomIcon";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { componentBorderRadius } from "src/shared/theme/Theme";

interface IMenuControlsProps {
  anchorEl: HTMLButtonElement | null;
  onClose: () => void;
  controls: {
    icon: ElementType<SvgIconProps>;
    title: string;
    description?: string;
    action: () => void;
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
}) => {
  const isOpen = Boolean(anchorEl);

  return (
    <Popover
      data-id="menu-controls"
      sx={{
        "& .MuiPaper-root": {
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          padding: "8px",
          width: "290px",
          background: "background.paper",
          borderRadius: componentBorderRadius,
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
        <Box
          data-id={`button-control-${index}`}
          key={index}
          sx={{ width: "100%" }}
        >
          <Button
            color="secondary"
            onClick={(event: MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              control.action();
            }}
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
