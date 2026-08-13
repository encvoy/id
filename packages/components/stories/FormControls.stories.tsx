import { Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FormProvider, useForm } from "react-hook-form";
import {
  CheckboxField,
  ColorPicker,
  InputField,
  PixelSliderField,
  RadioGroupField,
  SwitchBlock,
} from "../src";

const meta = {
  title: "Components/Form controls",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const FormControlsExample = () => {
  const form = useForm({
    defaultValues: {
      name: "Identity application",
      enabled: true,
      accepted: false,
      mode: "first",
      radius: "8px",
      color: "#4C6AD4",
    },
  });

  return (
    <FormProvider {...form}>
      <Stack sx={{ maxWidth: 420 }}>
        <InputField name="name" label="Name" description="Text input" />
        <CheckboxField
          control={form.control}
          name="accepted"
          label="Checkbox"
        />
        <SwitchBlock name="enabled" label="Switch" />
        <RadioGroupField
          name="mode"
          options={[
            { value: "first", title: "First option" },
            { value: "second", title: "Second option" },
          ]}
        />
        <PixelSliderField name="radius" label="Border radius" />
        <ColorPicker name="color" label="Primary color" />
      </Stack>
    </FormProvider>
  );
};

export const Default: Story = {
  render: () => <FormControlsExample />,
};
