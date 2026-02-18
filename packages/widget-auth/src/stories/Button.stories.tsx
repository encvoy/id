import {Button} from "@/components/button/Button";

export default {
  title: 'MUI/Button',
  component: Button,
  parameters: {layout: 'centered'},
};

export const Primary = {
  args: {label: 'Click me', variant: 'contained', color: 'primary'},
};