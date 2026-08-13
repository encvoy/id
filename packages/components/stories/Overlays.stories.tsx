import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import { Button, IconButton, Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import {
  MenuControls,
  ModalInfo,
  SidePanel,
  SubmitModal,
} from "../src";

const meta = {
  title: "Components/Overlays",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const OverlayExamples = () => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLButtonElement | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <IconButton onClick={(event) => setMenuAnchor(event.currentTarget)}>
        <MoreVertOutlinedIcon />
      </IconButton>
      <MenuControls
        anchorEl={menuAnchor}
        onClose={() => setMenuAnchor(null)}
        controls={[
          {
            icon: DeleteOutlineOutlinedIcon,
            title: "Delete",
            description: "Example action supplied by the application",
            action: () => setMenuAnchor(null),
          },
        ]}
      />
      <Button variant="outlined" onClick={() => setModalOpen(true)}>
        Info modal
      </Button>
      <Button variant="outlined" onClick={() => setSubmitOpen(true)}>
        Submit modal
      </Button>
      <Button variant="contained" onClick={() => setPanelOpen(true)}>
        Side panel
      </Button>

      <ModalInfo
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Information"
      >
        <Typography>Modal content is owned by the application.</Typography>
      </ModalInfo>
      <SubmitModal
        isOpen={submitOpen}
        onClose={() => setSubmitOpen(false)}
        onSubmit={() => setSubmitOpen(false)}
        title="Confirm action"
        mainMessage={["The action text is supplied through props."]}
        actionButtonText="Confirm"
      />
      <SidePanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        onSubmit={() => setPanelOpen(false)}
        title="Reusable side panel"
        description="Header, body and actions are reusable primitives."
        buttonSubmitText="Save"
      >
        <Stack sx={{ padding: 3 }}>
          <Typography>Panel content</Typography>
        </Stack>
      </SidePanel>
    </Stack>
  );
};

export const Interactive: Story = {
  render: () => <OverlayExamples />,
};
