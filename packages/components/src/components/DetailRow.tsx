import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { ElementType, MouseEvent } from "react";
import { SvgIconProps } from "@mui/material/SvgIcon";
import { CustomIcon } from "./CustomIcon";

interface IDetailRowProps {
  Icon: ElementType<SvgIconProps>;
  label?: string;
  value?: string | number;
  link?: {
    href: string;
    target?: string;
  };
  dataTestId?: string;
}

const fallbackValue = "-";

const rowSx = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  minWidth: 0,
} as const;

const iconSx = {
  width: 28,
  height: 28,
  mr: "10px",
  borderRadius: "6px",
  flexShrink: 0,
  bgcolor: "divider",
  p: "4px",
} as const;

const textSx = {
  overflow: "hidden",
  minWidth: 0,
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;

const linkSx = {
  ...textSx,
  display: "inline",
  textDecoration: "none",
  transition: "color 0.1s ease-in-out",
  "&:hover": {
    cursor: "pointer",
    textDecoration: "underline",
  },
} as const;

export const DetailRow = ({
  Icon,
  label,
  value,
  link,
  dataTestId,
}: IDetailRowProps) => {
  const displayValue =
    value === undefined || value === null || value === "" ? fallbackValue : value;
  const handleLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
  };

  return (
    <Box sx={rowSx}>
      <CustomIcon Icon={Icon} color="textSecondary" sx={iconSx} />
      {link ? (
        <Link
          className="text-12"
          href={link.href}
          target={link.target}
          onClick={handleLinkClick}
          sx={linkSx}
          data-test-id={dataTestId}
        >
          {displayValue}
        </Link>
      ) : (
        <Typography
          className="text-12"
          color="text.secondary"
          sx={textSx}
          data-test-id={dataTestId}
        >
          {label ? (
            <>
              <Typography
                component="span"
                className="text-12"
                color="text.secondary"
              >
                {label}:
              </Typography>{" "}
            </>
          ) : null}
          {displayValue}
        </Typography>
      )}
    </Box>
  );
};
