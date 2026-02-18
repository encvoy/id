import { FC, ReactNode } from "react";
import { Typography } from "@mui/material";
import { ModalInfo } from "./ModalInfo";
import { useTranslation } from "react-i18next";
import { ActionButtons } from "src/shared/ui/components/ActionButtons";

export interface ISubmitModalProps {
  isOpen: boolean;
  onSubmit: () => void;
  onClose: () => void;
  title: string;
  children?: ReactNode;
  mainMessage?: string[];
  disabled?: boolean;
  actionButtonText?: string;
}

export const SubmitModal: FC<ISubmitModalProps> = ({
  isOpen,
  onSubmit,
  onClose,
  title,
  mainMessage,
  children,
  disabled,
  actionButtonText,
}) => {
  const { t: translate } = useTranslation();

  return (
    <ModalInfo isOpen={isOpen} onClose={onClose} title={title}>
      {mainMessage && (
        <div style={{ marginBottom: 32 }}>
          {mainMessage.map((message, index) => (
            <Typography className="text-14" key={index}>
              {message}
              <br />
            </Typography>
          ))}
        </div>
      )}
      {children}
      <ActionButtons
        onCancel={onClose}
        disabled={disabled}
        onSubmit={onSubmit}
        submitText={actionButtonText || translate("actionButtons.delete")}
      />
    </ModalInfo>
  );
};
