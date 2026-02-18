import { FC, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { InputField } from "src/shared/ui/components/InputBlock";
import { isObjectEmpty } from "src/shared/utils/helpers";
import {
  IEmailTemplate,
  useUpdateEmailTemplatesMutation,
} from "src/shared/api/settings";
import { ViewEmailTemplate } from "./ViewEmailTemplate";
import { SidePanel } from "src/shared/ui/sidePanel/SidePanel";
import Box from "@mui/material/Box";

interface IEditEmailTemplatePanelProps {
  isOpen: boolean;
  onClose: () => void;
  template?: IEmailTemplate;
}

export const EditEmailTemplatePanel: FC<IEditEmailTemplatePanelProps> = ({
  isOpen,
  onClose,
  template,
}) => {
  const { t: translate } = useTranslation();
  const [editEmailTemplate] = useUpdateEmailTemplatesMutation();

  const methods = useForm<IEmailTemplate>({
    mode: "all",
  });
  const {
    control,
    handleSubmit,
    formState: { dirtyFields },
    reset,
  } = methods;

  const watchContent = useWatch({
    control,
    name: "content",
    defaultValue: "",
  });

  useEffect(() => {
    reset(template);
  }, [isOpen]);

  const handleSave = async (data: IEmailTemplate) => {
    // field id do not put body
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, action, ...body } = data;

    try {
      await editEmailTemplate({
        action,
        body,
      }).unwrap();
      onClose();
    } catch (error) {
      console.error("Failed to save the template:", error);
    }
  };

  return (
    <>
      <SidePanel
        onClose={onClose}
        isOpen={isOpen}
        title={`${translate("panel.mailTemplate.edit.editTitle")} ${
          template ? `'${template.title}'` : ""
        }`}
        description={translate("panel.mailTemplate.edit.editDescription", {
          action: template ? template.action : "",
        })}
        isNoBackdrop
        onSubmit={handleSubmit(handleSave)}
        disabledButtonSubmit={isObjectEmpty(dirtyFields)}
      >
        <FormProvider {...methods}>
          <form>
            <Box sx={{ overflow: "scroll", paddingRight: "6px" }}>
              <InputField
                label={translate("panel.mailTemplate.edit.titleLabel")}
                name="title"
              />
              <InputField
                label={translate("panel.mailTemplate.edit.subjectLabel")}
                name="subject"
              />
              <Box sx={{ marginBottom: "20px" }}>
                <ViewEmailTemplate content={watchContent} />
              </Box>
              <InputField
                label={translate("panel.mailTemplate.edit.contentLabel")}
                name="content"
                multiline
                rows={10}
              />
            </Box>
          </form>
        </FormProvider>
      </SidePanel>
    </>
  );
};
