import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOffOutlinedIcon from "@mui/icons-material/EditOffOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import InputOutlinedIcon from "@mui/icons-material/InputOutlined";
import PrivacyTipOutlinedIcon from "@mui/icons-material/PrivacyTipOutlined";
import StarBorderOutlinedIcon from "@mui/icons-material/StarBorderOutlined";
import StarOutlinedIcon from "@mui/icons-material/StarOutlined";
import LooksOneOutlinedIcon from "@mui/icons-material/LooksOneOutlined";
import CheckIcon from "@mui/icons-material/Check";
import { SvgIconProps } from "@mui/material";
import { IconWithTooltip } from "src/shared/ui/components/IconWithTooltip";
import { ElementType, FC } from "react";
import { useTranslation } from "react-i18next";

type IconType =
  | "edit"
  | "delete"
  | "id"
  | "doNotRequired"
  | "doRequired"
  | "required"
  | "copy"
  | "unique"
  | "pen"
  | "penFilled"
  | "download"
  | "close"
  | "rules"
  | "confirm";

const icons: { [key in IconType]: ElementType<SvgIconProps> } = {
  rules: PrivacyTipOutlinedIcon,
  edit: EditOutlinedIcon,
  delete: DeleteOutlineOutlinedIcon,
  id: InputOutlinedIcon,
  unique: LooksOneOutlinedIcon,
  doRequired: StarBorderOutlinedIcon,
  doNotRequired: StarOutlinedIcon,
  required: StarOutlinedIcon,
  copy: ContentCopyOutlinedIcon,
  pen: EditOffOutlinedIcon,
  penFilled: EditOutlinedIcon,
  download: FileDownloadOutlinedIcon,
  close: CloseOutlinedIcon,
  confirm: CheckIcon,
};

interface IIconsLibraryProps {
  type: IconType;
  title?: string;
  description?: string | string[];
  onClick?: (event: any) => void;
  disabled?: boolean;
  hideHovered?: boolean;
  styleButton?: string;
  styleIcon?: string;
}

/**
 * IconsLibrary component displays an icon with tooltip based on the specified type.
 * @param type - The type of icon to display.
 * @param title - The title for the tooltip.
 * @param description - The description for the tooltip, can be a string or array of strings.
 * @param onClick - The function to call when the icon is clicked.
 * @param disabled - Whether the icon is disabled.
 * @param hideHovered - Whether to hide the tooltip on hover.
 * @param styleButton - Custom style for the button.
 * @param styleIcon - Custom style for the icon.
 */
export const IconsLibrary: FC<IIconsLibraryProps> = ({
  type,
  title,
  description,
  onClick,
  disabled,
  hideHovered,
  styleButton,
  styleIcon,
}) => {
  const { t: translate } = useTranslation();

  return (
    <IconWithTooltip
      dataAttribute={`tooltip-type-${type}`}
      customStyleButton={styleButton}
      customStyleIcon={styleIcon}
      Icon={icons[type]}
      title={title || translate(`toolTips.${type}`)}
      description={description}
      onClick={onClick}
      disabled={disabled}
      hideHovered={hideHovered}
    />
  );
};
