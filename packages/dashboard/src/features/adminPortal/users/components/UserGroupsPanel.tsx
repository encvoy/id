import { Alert, Box, Button } from "@mui/material";
import { FC, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import {
  IGroup,
  useAddGroupUserMutation,
  useLazyGetGroupsQuery,
  useRemoveGroupUserMutation,
} from "src/shared/api/groups";
import { IQueryPropsWithId, IResponseListItems } from "src/shared/api/types";
import { IUserShort } from "src/shared/api/users";
import { setNoticeError, setNoticeInfo } from "src/shared/slices/noticesSlice";
import { ListItems } from "src/shared/ui/CardsList.tsx";
import { SidePanel } from "@encvoy-id/components";
import { Order } from "src/shared/utils/enums";
import { GroupCard, IGroupCardProps } from "./GroupCard";

interface IUserGroupsPanelProps {
  organizationId: string;
  user: IUserShort;
  isOpen: boolean;
  onClose: () => void;
}

const PAGE_SIZE = 10;

const createEmptyResponse = (
  offset: number,
  limit: number
): IResponseListItems<IGroup[]> => ({
  items: [],
  totalCount: 0,
  perPage: limit,
  currentOffset: offset,
  nextOffset: offset,
});

const getUserDisplayName = (user: IUserShort) => {
  const fullName = `${user.given_name || ""} ${user.family_name || ""}`.trim();

  return fullName || user.nickname || user.id;
};

export const UserGroupsPanel: FC<IUserGroupsPanelProps> = ({
  organizationId,
  user,
  isOpen,
  onClose,
}) => {
  const { t: translate } = useTranslation();
  const dispatch = useDispatch();
  const [getGroups] = useLazyGetGroupsQuery();
  const [addGroupUser] = useAddGroupUserMutation();
  const [removeGroupUser] = useRemoveGroupUserMutation();
  const [pendingGroupIds, setPendingGroupIds] = useState<Set<string>>(
    new Set()
  );
  const [customUpdate, setCustomUpdate] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const displayName = getUserDisplayName(user);

  const query = useCallback(
    (
      offset: number,
      search = "",
      selectedFilterKey?: string | null
    ): IQueryPropsWithId => ({
      id: organizationId,
      query: {
        limit: PAGE_SIZE,
        offset,
        search,
        sortBy: "name",
        sortDirection: Order.ASC,
        filter: JSON.stringify({
          user_id: user.id,
          user_membership:
            selectedFilterKey === "non_members" ? "non_member" : "member",
        }),
      },
    }),
    [organizationId, user.id]
  );

  const getItems = useCallback(
    (
      args: IQueryPropsWithId,
      preferCacheValue?: boolean
    ): { unwrap: () => Promise<IResponseListItems<IGroup[]>> } => ({
      unwrap: async () => {
        try {
          setLoadError(null);
          return await getGroups(args, preferCacheValue).unwrap();
        } catch (error) {
          console.error("Error load user groups:", error);
          setLoadError(
            translate("pages.usersList.userGroups.errors.loadGroups")
          );

          return createEmptyResponse(
            args.query.offset ?? 0,
            args.query.limit ?? PAGE_SIZE
          );
        }
      },
    }),
    [getGroups, translate]
  );

  const setGroupPendingState = (groupId: string, isPending: boolean) => {
    setPendingGroupIds((prev) => {
      const next = new Set(prev);

      if (isPending) {
        next.add(groupId);
      } else {
        next.delete(groupId);
      }

      return next;
    });
  };

  const handleToggleMembership = async (
    group: IGroup,
    selectedFilterKey: string | null
  ) => {
    if (!group.id || pendingGroupIds.has(group.id)) {
      return;
    }

    const isAdding = selectedFilterKey === "non_members";
    setGroupPendingState(group.id, true);

    try {
      if (isAdding) {
        await addGroupUser({
          organization_id: organizationId,
          group_id: group.id,
          user_id: user.id,
        }).unwrap();
      } else {
        await removeGroupUser({
          organization_id: organizationId,
          group_id: group.id,
          member_user_id: user.id,
        }).unwrap();
      }

      dispatch(
        setNoticeInfo(
          translate(
            `pages.usersList.userGroups.notices.${
              isAdding ? "groupAdded" : "groupRemoved"
            }`
          )
        )
      );
      setCustomUpdate(true);
    } catch (error: any) {
      console.error("Error update user groups:", error);
      dispatch(
        setNoticeError(
          error?.data?.message ||
            translate(
              `pages.usersList.userGroups.errors.${
                isAdding ? "addGroup" : "removeGroup"
              }`
            )
        )
      );
    } finally {
      setGroupPendingState(group.id, false);
    }
  };

  return (
    <SidePanel
      buttonSubmitText={translate("actionButtons.save")}
      customAdditionalText={translate("actionButtons.create")}
      cancelText={translate("actionButtons.cancel")}
      onClose={onClose}
      isOpen={isOpen}
      title={translate("pages.usersList.userGroups.title", {
        name: displayName,
      })}
      closeButtonDataTestId="btn-user-groups-panel-close"
    >
      <Box sx={{ overflowY: "auto", padding: "6px 12px" }}>
        {loadError ? (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  setLoadError(null);
                  setRetryKey((prev) => prev + 1);
                }}
              >
                {translate("actionButtons.retry")}
              </Button>
            }
          >
            {loadError}
          </Alert>
        ) : (
          <ListItems<IGroup, IQueryPropsWithId, IGroupCardProps>
            key={`user-groups-${organizationId}-${user.id}-${retryKey}`}
            query={query}
            getItems={getItems}
            RowElement={GroupCard}
            customUpdate={customUpdate}
            setCustomUpdate={setCustomUpdate}
            searchDataTestId="txt-user-groups-search"
            searchContext={`user-groups-${organizationId}-${user.id}`}
            isSearchStatic={true}
            filters={{
              defaultSelectedKey: "members",
              options: [
                {
                  key: "members",
                  label: translate("pages.directory.groups.filters.members"),
                  color: "primary",
                  dataTestId: "chip-user-groups-filter-members",
                },
                {
                  key: "non_members",
                  label: translate("pages.directory.groups.filters.nonMembers"),
                  color: "primary",
                  dataTestId: "chip-user-groups-filter-non-members",
                },
              ],
            }}
            rowElementProps={{
              onToggleMembership: handleToggleMembership,
              toggleButtonDataTestIdPrefix: "btn-user-groups-toggle",
            }}
          />
        )}
      </Box>
    </SidePanel>
  );
};
