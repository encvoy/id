import { FC, ReactNode } from "react";
import { Typography } from "@mui/material";
import { ModalInfo } from "./ModalInfo";
import { ActionButtons } from "./ActionButtons";

export interface SubmitModalProps {
  isOpen: boolean;
  onSubmit: () => void;
  onClose: () => void;
  title: string;
  children?: ReactNode;
  mainMessage?: string[];
  disabled?: boolean;
  actionButtonText?: string;
  actionButtonDataTestId?: string;
  cancelButtonDataTestId?: string;
  submitButtonDataTestId?: string;
  cancelText?: string;
  deleteText?: string;
}

export type ISubmitModalProps = SubmitModalProps;

export const SubmitModal: FC<SubmitModalProps> = ({
  isOpen,
  onSubmit,
  onClose,
  title,
  mainMessage,
  children,
  disabled,
  actionButtonText,
  cancelButtonDataTestId,
  submitButtonDataTestId,
  cancelText = "Cancel",
  deleteText = "Delete",
}) => {
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
        submitText={actionButtonText || deleteText}
        cancelText={cancelText}
        cancelButtonDataTestId={cancelButtonDataTestId}
        submitButtonDataTestId={submitButtonDataTestId}
      />
    </ModalInfo>
  );
};
