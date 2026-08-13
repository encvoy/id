import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import {Breadcrumbs, SxProps, Theme, Typography} from "@mui/material";
import {ReactNode} from "react";
import Chip from "@mui/material/Chip";

interface INavigationBreadcrumbsProps<T> {
  items: T[];
  getItemKey?: (item: T, index: number) => string | number;
  getItemLabel: (item: T, index: number) => ReactNode;
  onItemClick?: (item: T, index: number) => void;
  sx?: SxProps<Theme>;
}

export const NavigationBreadcrumbs = <T, >({
                                             items,
                                             getItemKey,
                                             getItemLabel,
                                             onItemClick,
                                             sx,
                                           }: INavigationBreadcrumbsProps<T>) => {
  if (!items.length) {
    return null;
  }

  return (
    <Breadcrumbs
      aria-label="breadcrumbs"
      separator={<NavigateNextIcon fontSize="small"/>}
      sx={sx}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const key = getItemKey ? getItemKey(item, index) : index;
        const label = getItemLabel(item, index);

        if (!isLast && onItemClick) {
          return (
            <Chip
              label={label}
              key={key}
              onClick={() => onItemClick(item, index)}
            />
          );
        }

        return (
          <Typography
            key={key}
            color={isLast ? "text.primary" : "text.secondary"}
            className="text-14"
          >
            {label}
          </Typography>
        );
      })}
    </Breadcrumbs>
  );
};
