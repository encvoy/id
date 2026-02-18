import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import SwapHorizontalCircleOutlined from "@mui/icons-material/SwapHorizontalCircleOutlined";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { Avatar, Box, Button, Switch, Typography } from "@mui/material";
import clsx from "clsx";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { CustomIcon } from "src/shared/ui/components/CustomIcon";
import { IconsLibrary } from "src/shared/ui/components/IconLibrary";
import { IconWithTooltip } from "src/shared/ui/components/IconWithTooltip";
import { CLIENT_ID } from "src/shared/utils/constants";
import { getImageURL, getProviderTitleByType } from "src/shared/utils/helpers";
import { IProvider, ProviderType } from "src/shared/api/provider";
import styles from "./ProviderItem.module.css";
import { componentBorderRadius } from "src/shared/theme/Theme";

interface SortableProviderItemProps {
  provider: IProvider;
  currentClientID: string;
  isSystemApp: boolean;
  isRequired: boolean;
  onlyRemove: boolean;
  canClick: boolean;
  onEdit: (provider: IProvider) => void;
  onActivate: (provider: IProvider) => void;
  onChangeRequired: (provider: IProvider, isRequired: boolean) => void;
  onCopy: (provider: IProvider) => void;
  onDelete: (provider: IProvider) => void;
  editProviderTypes: string[];
}

export const SortableProviderItem: FC<SortableProviderItemProps> = ({
  provider,
  currentClientID,
  isSystemApp,
  isRequired,
  onlyRemove,
  canClick,
  onEdit,
  onActivate,
  onChangeRequired,
  onCopy,
  onDelete,
  editProviderTypes,
}) => {
  const { t: translate } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({ id: provider.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      className={clsx(
        styles.provider,
        canClick && editProviderTypes.includes(provider.type)
          ? styles.providerHover
          : ""
      )}
      sx={{ borderRadius: componentBorderRadius }}
      onClick={() => {
        if (canClick && editProviderTypes.includes(provider.type)) {
          onEdit(provider);
        }
      }}
    >
      <DragIndicatorIcon
        sx={{ color: "grey.500", cursor: "grab" }}
        className={styles.dragHandle}
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      />
      <div className={styles.providerHeader}>
        <div className={styles.switch} onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={provider.is_active}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation();
              onActivate(provider);
            }}
          />
        </div>
        <Avatar
          src={getImageURL(provider.avatar)}
          className={styles.providerIcon}
        >
          {!provider.avatar && (
            <CustomIcon
              Icon={SwapHorizontalCircleOutlined}
              sx={{ width: "35px", height: "35px" }}
              color="textSecondary"
            />
          )}
        </Avatar>
        {(isSystemApp
          ? provider.is_public
          : provider.client_id === CLIENT_ID) && (
          <IconWithTooltip
            Icon={PublicOutlinedIcon}
            hideHovered
            title={translate("pages.widget.tooltip")}
          />
        )}
        <div className={styles.nameWrapper}>
          <Typography className={clsx("text-14", styles.name)}>
            {provider.name}
          </Typography>
          <Typography className="text-12" color="text.secondary">
            {getProviderTitleByType(provider.type)}
          </Typography>
        </div>
      </div>
      <div className={styles.buttons}>
        {editProviderTypes.includes(provider.type) && (
          <>
            {canClick && (
              <Button
                className={styles.buttonIcon}
                variant="text"
                onClick={() => onEdit(provider)}
              >
                {translate("actionButtons.configure")}
              </Button>
            )}
            {!onlyRemove &&
              getProviderTitleByType(provider.type) === ProviderType.OAUTH && (
                <IconsLibrary
                  styleButton={styles.buttonIcon}
                  type={isRequired ? "doNotRequired" : "doRequired"}
                  onClick={() => onChangeRequired(provider, isRequired)}
                  description={translate(
                    `pages.widget.${isRequired ? "notRequired" : "required"}`
                  )}
                />
              )}
            {canClick && (
              <IconsLibrary
                styleButton={styles.buttonIcon}
                type="copy"
                onClick={() => onCopy(provider)}
              />
            )}
            {provider.client_id === currentClientID && (
              <IconsLibrary
                styleButton={styles.buttonIcon}
                type="delete"
                onClick={() => onDelete(provider)}
              />
            )}
          </>
        )}
      </div>
    </Box>
  );
};
