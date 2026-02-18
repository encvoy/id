import Button from "@mui/material/Button";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";

interface IActionButtonsProps {
  onCancel: () => void;
  submitText?: string;
  onSubmit?: () => void;
  disabled?: boolean;
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
}: IActionButtonsProps) => {
  const { t: translate } = useTranslation();

  return (
    <Box sx={{ paddingTop: "24px", textAlign: "end" }}>
      <Button
        data-id="cancel-form-button"
        onClick={onCancel}
        variant="contained"
        color="secondary"
      >
        {translate("actionButtons.cancel")}
      </Button>
      {submitText && (
        <Button
          data-id="submit-form-button"
          disabled={disabled}
          variant="contained"
          type="submit"
          onClick={onSubmit}
          sx={{ marginLeft: "12px" }}
        >
          {submitText}
        </Button>
      )}
    </Box>
  );
};
