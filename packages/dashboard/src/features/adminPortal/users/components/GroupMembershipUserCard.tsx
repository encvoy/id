import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import RemoveCircleOutlineOutlinedIcon from "@mui/icons-material/RemoveCircleOutlineOutlined";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { FC, memo } from "react";
import { useTranslation } from "react-i18next";
import { TUserWithRole } from "src/shared/api/users";
import { Card, ICardProps } from "@encvoy-id/components";
import { IconWithTooltip } from "@encvoy-id/components";
import { getImageURL } from "src/shared/utils/helpers";

export interface IGroupMembershipUserCardProps extends ICardProps {
  items: TUserWithRole[];
  index: number;
  memberUserIds: ReadonlySet<string>;
  pendingUserIds: ReadonlySet<string>;
  onToggleMembership: (item: TUserWithRole) => void;
}

const getUserDisplayName = (item?: TUserWithRole) => {
  const fullName = `${item?.user?.given_name || ""} ${
    item?.user?.family_name || ""
  }`.trim();

  return fullName || item?.user?.nickname || item?.user?.id || "";
};

const getUserSecondaryLabel = (item?: TUserWithRole) => {
  const values = [
    item?.user?.nickname,
    typeof item?.user?.organization_name === "string"
      ? item.user.organization_name
      : "",
    item?.user?.id ? `Id ${item.user.id}` : "",
  ].filter((value): value is string => Boolean(value?.trim()));

  return Array.from(new Set(values)).join(" • ");
};

const GroupMembershipUserCardComponent: FC<IGroupMembershipUserCardProps> = (
  props
) => {
  const { items, index, memberUserIds, pendingUserIds, onToggleMembership } =
    props;
  const { t: translate } = useTranslation();
  const item = items[index];

  if (!item?.user?.id) {
    return null;
  }

  const isMember = memberUserIds.has(item.user.id);
  const isPending = pendingUserIds.has(item.user.id);
  const displayName = getUserDisplayName(item);
  const secondaryLabel = getUserSecondaryLabel(item);

  return (
    <Card
      {...props}
      cardId={item.user.id}
      isImage
      avatarUrl={getImageURL(item.user.picture)}
      DefaultIcon={PersonOutlineOutlinedIcon}
      figure="circle"
      content={
        <Box
          sx={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            minWidth: 0,
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography className="text-14" noWrap title={displayName}>
              {displayName}
            </Typography>
            {secondaryLabel ? (
              <Typography
                className="text-12"
                color="text.secondary"
                noWrap
                title={secondaryLabel}
              >
                {secondaryLabel}
              </Typography>
            ) : null}
          </Box>
          <IconWithTooltip
            title={
              isMember
                ? translate("pages.directory.users.actions.removeFromGroup")
                : translate("pages.directory.shared.actions.addUser")
            }
            Icon={
              isMember
                ? RemoveCircleOutlineOutlinedIcon
                : AddCircleOutlineOutlinedIcon
            }
            dataTestId={`btn-group-user-toggle-${item.user.id}`}
            disabled={isPending}
            onClick={() => onToggleMembership(item)}
          />
        </Box>
      }
    />
  );
};

export const GroupMembershipUserCard = memo(GroupMembershipUserCardComponent);
