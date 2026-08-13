import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {Stack, Typography} from "@mui/material";
import type {Meta, StoryObj} from "@storybook/react-vite";
import {
  AccordionBlock,
  ActionButtons,
  Chip,
  ContactStatusIndicator,
  DetailRow,
  IconWithTooltip,
  InfoFieldRow,
  NavigationBreadcrumbs,
  SurfaceBlock,
} from "../src";

const meta = {
  title: "Components/Overview",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const DisplayAndActions: Story = {
  render: () => (
    <Stack spacing={2} sx={{maxWidth: 640}}>
      <SurfaceBlock sx={{padding: 2}}>
        <InfoFieldRow label="Service" value="Identity platform"/>
        <InfoFieldRow label="Status">
          <Chip status="active" customText={{active: "Active"}}/>
        </InfoFieldRow>
        <DetailRow Icon={EmailOutlinedIcon} label="Email" value="id@example.com"/>
      </SurfaceBlock>
      <AccordionBlock title="Accordion" configureText="Configure">
        <Typography>Accordion content</Typography>
      </AccordionBlock>
      <NavigationBreadcrumbs
        items={["Root", "Organization", "Application"]}
        getItemLabel={(item) => item}
        onItemClick={() => undefined}
      />
      <Stack direction="row" alignItems="center" spacing={1}>
        <IconWithTooltip Icon={InfoOutlinedIcon} title="Information"/>
        <ContactStatusIndicator verified={false} unverifiedText="Unverified"/>
      </Stack>
      <ActionButtons
        onCancel={() => undefined}
        cancelText="Cancel"
        submitText="Save"
      />
    </Stack>
  ),
};
