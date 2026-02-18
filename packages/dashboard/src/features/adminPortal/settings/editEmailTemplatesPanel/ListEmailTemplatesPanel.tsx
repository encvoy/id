import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  IEmailTemplate,
  useGetEmailTemplatesQuery,
} from "src/shared/api/settings";
import { SidePanel } from "src/shared/ui/sidePanel/SidePanel";
import { EditEmailTemplatePanel } from "./EditEmailTemplatePanel";
import { EmailTemplate } from "./EmailTemplate";
import Box from "@mui/material/Box";

interface IListEmailTemplatesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ListEmailTemplatesPanel: FC<IListEmailTemplatesPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const { t: translate } = useTranslation();
  const [selectedTemplate, setSelectedTemplate] = useState<
    IEmailTemplate | undefined
  >(undefined);
  const [isEditTemplateOpen, setIsEditTemplateOpen] = useState(false);
  const { data: templates = [] } = useGetEmailTemplatesQuery();

  return (
    <>
      <SidePanel
        onClose={onClose}
        isOpen={isOpen}
        title={translate("panel.mailTemplate.title")}
        description={translate("panel.mailTemplate.description")}
      >
        <Box sx={{ overflow: "scroll", paddingRight: "6px" }}>
          {templates.map((template) => (
            <EmailTemplate
              key={template.id}
              template={template}
              onClick={() => {
                setSelectedTemplate(template);
                setIsEditTemplateOpen(true);
              }}
            />
          ))}
        </Box>
      </SidePanel>

      <EditEmailTemplatePanel
        isOpen={isEditTemplateOpen}
        onClose={() => {
          setIsEditTemplateOpen(false);
          setSelectedTemplate(undefined);
        }}
        template={selectedTemplate}
      />
    </>
  );
};
