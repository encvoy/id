import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import { Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card } from "../src";

const meta = {
  title: "Components/Card",
  component: Card,
  args: {
    cardId: "storybook",
    isImage: true,
    content: (
      <Stack>
        <Typography className="text-14">Example organization</Typography>
        <Typography className="text-12" color="text.secondary">
          Reusable card content
        </Typography>
      </Stack>
    ),
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FallbackIcon: Story = {
  args: {
    DefaultIcon: BusinessOutlinedIcon,
    figure: "circle",
  },
};

export const Interactive: Story = {
  args: {
    onClick: () => undefined,
  },
};
