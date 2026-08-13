import { Button, Stack, TextField, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Foundations/Theme",
  parameters: {
    docs: {
      description: {
        component:
          "Shared palette, typography and MUI component overrides.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => (
    <Stack spacing={2} sx={{ maxWidth: 480 }}>
      <Typography className="title-medium">Application theme</Typography>
      <Typography color="text.secondary">
        Switch the Storybook toolbar between light and dark schemes.
      </Typography>
      <Stack direction="row" spacing={1}>
        <Button variant="contained">Primary</Button>
        <Button variant="contained" color="secondary">
          Secondary
        </Button>
        <Button variant="outlined">Outlined</Button>
      </Stack>
      <TextField variant="standard" label="Standard input" />
    </Stack>
  ),
};
