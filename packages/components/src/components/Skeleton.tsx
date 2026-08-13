import { Box, Skeleton } from "@mui/material";
import { SurfaceBlock } from "./SurfaceBlock";

export const RowPlaceholder = () => (
  <Box sx={{ padding: "6px 12px", height: "100%" }}>
    <SurfaceBlock
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 16px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          minWidth: 0,
          flex: 1,
        }}
      >
        <Skeleton variant="circular" width={24} height={24} />
        <Skeleton variant="text" width="40%" height={24} />
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Skeleton variant="rounded" width={40} height={32} />
        <Skeleton variant="rounded" width={40} height={32} />
        <Skeleton variant="rounded" width={40} height={32} />
      </Box>
    </SurfaceBlock>
  </Box>
);
