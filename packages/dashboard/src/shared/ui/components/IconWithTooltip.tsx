import { Button, SvgIconProps, Typography, useTheme } from "@mui/material";
import Tooltip, { TooltipProps } from "@mui/material/Tooltip";
import { ElementType, FC, ReactNode } from "react";
import { CustomIcon } from "./CustomIcon";

interface IIconWithTooltipProps {
  dataAttribute?: string;
  onClick?: (event: any) => void;
  title?: string;
  Icon?: ElementType<SvgIconProps>;
  customStyleButton?: string;
  customStyleIcon?: string;
  placement?: TooltipProps["placement"];
  description?: string | string[];
  disabled?: boolean;
  hideHovered?: boolean;
  staticHover?: boolean;
  children?: ReactNode;
}

/**
 * IconWithTooltip component displays an icon inside a button with a tooltip.
 * It supports both predefined and custom icons, including Material UI icons or custom ones.
 *
 * @component
 * @param dataAttribute - The data attribute for the button element.
 * @param onClick - The function called when the button is clicked.
 * @param title - The title displayed in the tooltip.
 * @param Icon - The icon component to display (Material UI icon).
 * @param customStyleButton - Custom CSS classes for the Button component.
 * @param customStyleIcon - Custom CSS classes for the icon.
 * @param placement - The placement of the tooltip relative to the button ('top' | 'bottom' | 'left' | 'right').
 * @param description - The description displayed under the title in the tooltip.
 * @param disabled - Flag indicating whether the button should be disabled.
 * @param hideHovered - Flag indicating whether to hide the hover effect.
 * @param staticHover - Flag indicating whether to apply static hover styling.
 * @param children - Custom content to display instead of the icon (for picture icons).
 *
 * @returns {JSX.Element} The button component with icon and tooltip.
 */
export const IconWithTooltip: FC<IIconWithTooltipProps> = ({
  dataAttribute,
  onClick,
  title,
  Icon,
  customStyleButton,
  customStyleIcon,
  placement,
  description,
  disabled,
  hideHovered,
  staticHover,
  children,
}): ReactNode => {
  const theme = useTheme();

  const stylesHideHover = {
    "&:hover": {
      backgroundColor: staticHover ? theme.palette.action.hover : "transparent",
      cursor: "default",
    },
    backgroundColor: staticHover ? theme.palette.action.hover : "transparent",
    padding: staticHover ? "8px" : undefined,
  };

  return (
    <Tooltip
      placement={placement}
      arrow
      title={
        <>
          <Typography
            className={description ? "text-17" : "text-12"}
            color="background.default"
          >
            {title}
          </Typography>
          {description &&
            (Array.isArray(description) ? (
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "20px",
                  listStyleType: "none",
                }}
              >
                {description.map((desc, index) => (
                  <li key={index}>{desc}</li>
                ))}
              </ul>
            ) : (
              <Typography className="text-12" color="background.default">
                {description}
              </Typography>
            ))}
        </>
      }
    >
      <span>
        <Button
          data-id={dataAttribute}
          disabled={disabled}
          className={customStyleButton}
          sx={hideHovered || staticHover ? stylesHideHover : undefined}
          onClick={(event) => {
            event.stopPropagation();
            if (onClick) {
              onClick(event);
            }
          }}
          variant={hideHovered || staticHover ? "text" : "contained"}
          color="secondary"
          startIcon={
            <>
              {Icon && (
                <CustomIcon
                  Icon={Icon}
                  className={customStyleIcon}
                  style={{ width: 24, height: 24 }}
                  color={
                    hideHovered || staticHover
                      ? "textSecondary"
                      : "secondaryContrast"
                  }
                />
              )}

              {/* For picture icons */}
              {children}
            </>
          }
        />
      </span>
    </Tooltip>
  );
};
