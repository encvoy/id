import { Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconsLibrary, type IconType } from "../src";

const iconTypes: IconType[] = [
  "edit",
  "delete",
  "id",
  "doNotRequired",
  "doRequired",
  "required",
  "copy",
  "unique",
  "pen",
  "penFilled",
  "download",
  "close",
  "rules",
  "confirm",
  "regenerate",
];

const meta = {
  title: "Components/IconsLibrary",
  component: IconsLibrary,
  args: {
    type: "edit",
    title: "Edit",
  },
} satisfies Meta<typeof IconsLibrary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const AllIcons: Story = {
  render: () => (
    <Stack direction="row" flexWrap="wrap" gap={1}>
      {iconTypes.map((type) => (
        <IconsLibrary key={type} type={type} title={type} />
      ))}
    </Stack>
  ),
};
