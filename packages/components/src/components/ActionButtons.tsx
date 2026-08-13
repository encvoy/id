import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

export interface ActionButtonsProps {
  onCancel?: () => void;
  submitText?: string;
  onSubmit?: () => void;
  disabled?: boolean;
  cancelButtonDataTestId?: string;
  submitButtonDataTestId?: string;
  cancelText?: string;
}

/**
 * ActionButtons component displays two buttons: "Cancel" and "Submit".
 *
 * @component
 * @param onCancel - Function called when the cancel button is clicked.
 * @param submitText - Text displayed on the submit button.
 * @param onSubmit - Function called when the submit button is clicked.
 * @param disabled - Flag indicating whether the submit button should be disabled.
 */
export const ActionButtons = ({
  onCancel,
  submitText,
  onSubmit,
  disabled,
  cancelButtonDataTestId,
  submitButtonDataTestId,
  cancelText = "Cancel",
}: ActionButtonsProps) => {
  return (
    <Box
      sx={{ paddingTop: "24px", textAlign: "end" }}
      onClick={(event) => {
        event.stopPropagation();
      }}
      onMouseDown={(event) => {
        event.stopPropagation();
      }}
    >
      {onCancel && (
        <Button
          onMouseDown={(event) => {
            event.stopPropagation();
          }}
          data-test-id={cancelButtonDataTestId || "btn-form-cancel"}
          onClick={(event) => {
            event.stopPropagation();
            onCancel();
          }}
          variant="contained"
          color="secondary"
        >
          {cancelText}
        </Button>
      )}
      {submitText && (
        <Button
          onMouseDown={(event) => {
            event.stopPropagation();
          }}
          data-test-id={submitButtonDataTestId || "btn-form-save"}
          disabled={disabled}
          variant="contained"
          type="submit"
          onClick={(event) => {
            event.stopPropagation();
            onSubmit?.();
          }}
          sx={{ marginLeft: "12px" }}
        >
          {submitText}
        </Button>
      )}
    </Box>
  );
};
