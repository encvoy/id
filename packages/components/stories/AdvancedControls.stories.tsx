import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import {
  CustomIcon,
  InputCode,
  InputDate,
  InputPhone,
  PasswordTextField,
  RowPlaceholder,
} from "../src";

const meta = {
  title: "Components/Advanced controls",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const AdvancedControlsExample = () => {
  const [code, setCode] = useState("12");
  const form = useForm({
    defaultValues: {
      birthday: "",
      password: "secret",
      phone: "+79990000000",
    },
  });

  return (
    <FormProvider {...form}>
      <Stack spacing={2} sx={{ maxWidth: 480 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <CustomIcon Icon={LockOutlinedIcon} color="primaryMain" />
          <Typography>Verification code</Typography>
        </Stack>
        <InputCode value={code} onChange={setCode} length={6} />
        <PasswordTextField
          nameField="password"
          showCopyButton
          showText="Show"
          hideText="Hide"
          copyText="Copy"
        />
        <InputDate name="birthday" label="Birthday" />
        <InputPhone name="phone" label="Phone" />
        <RowPlaceholder />
      </Stack>
    </FormProvider>
  );
};

export const Default: Story = {
  render: () => <AdvancedControlsExample />,
};
