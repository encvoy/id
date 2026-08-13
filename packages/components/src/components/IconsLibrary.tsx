import AutorenewOutlinedIcon from "@mui/icons-material/AutorenewOutlined";
import CheckIcon from "@mui/icons-material/Check";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOffOutlinedIcon from "@mui/icons-material/EditOffOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import InputOutlinedIcon from "@mui/icons-material/InputOutlined";
import LooksOneOutlinedIcon from "@mui/icons-material/LooksOneOutlined";
import PrivacyTipOutlinedIcon from "@mui/icons-material/PrivacyTipOutlined";
import StarBorderOutlinedIcon from "@mui/icons-material/StarBorderOutlined";
import StarOutlinedIcon from "@mui/icons-material/StarOutlined";
import { SvgIconProps } from "@mui/material";
import { ElementType, FC, MouseEvent } from "react";
import { IconWithTooltip } from "./IconWithTooltip";

export type IconType =
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
  | "confirm"
  | "regenerate";

const icons: Record<IconType, ElementType<SvgIconProps>> = {
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
  regenerate: AutorenewOutlinedIcon,
};

export interface IconsLibraryProps {
  type: IconType;
  title: string;
  description?: string | string[];
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  hideHovered?: boolean;
  styleButton?: string;
  styleIcon?: string;
  dataTestId?: string;
}

export const IconsLibrary: FC<IconsLibraryProps> = ({
  type,
  title,
  description,
  onClick,
  disabled,
  hideHovered,
  styleButton,
  styleIcon,
  dataTestId,
}) => (
  <IconWithTooltip
    dataTestId={dataTestId}
    dataAttribute={`tooltip-type-${type}`}
    customStyleButton={styleButton}
    customStyleIcon={styleIcon}
    Icon={icons[type]}
    title={title}
    description={description}
    onClick={onClick}
    disabled={disabled}
    hideHovered={hideHovered}
  />
);
