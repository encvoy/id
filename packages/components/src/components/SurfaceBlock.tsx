import Box, { BoxProps } from "@mui/material/Box";
import { Theme } from "@mui/material/styles";
import { FC, Ref } from "react";

const baseSurfaceSx = (theme: Theme) => ({
  width: "100%",
  borderStyle: "solid",
  borderWidth: theme.encvoy.surfaceBlock.hideBorder
    ? 0
    : theme.encvoy.surfaceBlock.borderWidth,
  borderColor: "divider",
  borderRadius: theme.encvoy.componentBorderRadius,
  boxShadow: theme.encvoy.surfaceBlock.boxShadow,
  transition: "background-color 0.4s ease",
  ...(theme.encvoy.surfaceBlock.hideBorder ? { border: "none" } : {}),
}) satisfies BoxProps["sx"];

interface SurfaceBlockProps extends BoxProps {
  boxRef?: Ref<HTMLDivElement>;
}

export const SurfaceBlock: FC<SurfaceBlockProps> = ({
  boxRef,
  sx,
  ...props
}) => {
  return (
    <Box
      ref={boxRef}
      sx={[baseSurfaceSx, ...(Array.isArray(sx) ? sx : [sx])]}
      {...props}
    />
  );
};
