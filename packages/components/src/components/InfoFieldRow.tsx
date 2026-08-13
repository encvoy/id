import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { FC, ReactNode } from "react";

interface IInfoFieldRowProps {
  label: string;
  value?: string | number | undefined;
  children?: ReactNode;
}

export const InfoFieldRow: FC<IInfoFieldRowProps> = ({
  label,
  value,
  children,
}) => {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "4px",
        py: "16px",
        "& + &": {
          borderTop: "1px solid",
          borderColor: "divider",
        },
      }}
    >
      <Typography
        className="text-14"
        color="textSecondary"
        sx={{ wordBreak: "break-word" }}
      >
        {label}
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "4px",
        }}
      >
        {value !== undefined ? (
          <Typography
            sx={{ wordBreak: "break-word" }}
            className="text-14"
            color="text.secondary"
          >
            {value}
          </Typography>
        ) : null}
        {children}
      </Box>
    </Box>
  );
};
