import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import RemoveCircleOutlineOutlinedIcon from "@mui/icons-material/RemoveCircleOutlineOutlined";
import SupervisorAccountOutlinedIcon from "@mui/icons-material/SupervisorAccountOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { FC, memo } from "react";
import { IGroup } from "src/shared/api/groups";
import { Card, ICardProps } from "@encvoy-id/components";
import { IconWithTooltip } from "@encvoy-id/components";
import { useTranslation } from "react-i18next";
import Button from "@mui/material/Button";

export interface IGroupCardProps extends ICardProps {
  items: IGroup[];
  index: number;
  onManageUsers?: (group: IGroup) => void;
  onDeleteGroup?: (group: IGroup) => void;
  selectedFilterKey?: string | null;
  onToggleMembership?: (
    group: IGroup,
    selectedFilterKey: string | null
  ) => void;
  toggleButtonDataTestIdPrefix?: string;
}

const GroupCardComponent: FC<IGroupCardProps> = (props) => {
  const {
    items,
    index,
    onManageUsers,
    onDeleteGroup,
    selectedFilterKey,
    onToggleMembership,
    toggleButtonDataTestIdPrefix,
  } = props;
  const { t: translate } = useTranslation();
  const group = items[index];

  if (!group) {
    return null;
  }

  const isNonMemberFilter = selectedFilterKey === "non_members";
  const toggleButtonDataTestId =
    toggleButtonDataTestIdPrefix && group.id
      ? `${toggleButtonDataTestIdPrefix}-${group.id}`
      : undefined;
  const ToggleActionIcon = isNonMemberFilter
    ? AddCircleOutlineOutlinedIcon
    : RemoveCircleOutlineOutlinedIcon;

  return (
    <Card
      {...props}
      cardId={group.id}
      isImage
      DefaultIcon={GroupsOutlinedIcon}
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
            <Typography className="text-14" noWrap title={group.name}>
              {group.name}
            </Typography>
            <Typography className="text-12" color="text.secondary">
              {`Id ${group.id}`}
            </Typography>
            {group.description ? (
              <Typography
                className="text-12"
                color="text.secondary"
                sx={{ mt: 0.5 }}
                title={group.description}
              >
                {group.description}
              </Typography>
            ) : null}
            {typeof group.usersCount === "number" ? (
              <Typography
                className="text-12"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {translate("pages.directory.groups.labels.usersCount")}{" "}
                {group.usersCount}
              </Typography>
            ) : null}
          </Box>
          {onToggleMembership || onManageUsers || onDeleteGroup ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexShrink: 0,
              }}
            >
              {onToggleMembership ? (
                <Button
                  data-test-id={toggleButtonDataTestId}
                  variant="contained"
                  color={isNonMemberFilter ? "primary" : "secondary"}
                  title={`${translate(
                    isNonMemberFilter
                      ? "actionButtons.add"
                      : "actionButtons.delete"
                  )}: ${group.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleMembership(group, selectedFilterKey ?? null);
                  }}
                  startIcon={<ToggleActionIcon />}
                />
              ) : null}
              {onManageUsers ? (
                <IconWithTooltip
                  title={translate("tabs.users")}
                  Icon={SupervisorAccountOutlinedIcon}
                  dataTestId={`btn-group-manage-users-${group.id}`}
                  onClick={() => onManageUsers(group)}
                />
              ) : null}
              {onDeleteGroup ? (
                <IconWithTooltip
                  title={translate("actionButtons.delete")}
                  Icon={DeleteOutlineOutlinedIcon}
                  dataTestId={`btn-group-delete-${group.id}`}
                  onClick={() => onDeleteGroup(group)}
                />
              ) : null}
            </Box>
          ) : null}
        </Box>
      }
    />
  );
};

export const GroupCard = memo(GroupCardComponent);
