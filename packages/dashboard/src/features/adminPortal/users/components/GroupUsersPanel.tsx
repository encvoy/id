import { Alert, Box, Button, Typography } from "@mui/material";
import { FC, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useLazyGetUsersClientQuery } from "src/shared/api/clients";
import {
  IGroup,
  useAddGroupUserMutation,
  useLazyGetGroupUsersQuery,
  useRemoveGroupUserMutation,
} from "src/shared/api/groups";
import { IQueryPropsWithId } from "src/shared/api/types";
import { TUserWithRole } from "src/shared/api/users";
import { setNoticeError, setNoticeInfo } from "src/shared/slices/noticesSlice";
import { ListItems } from "src/shared/ui/CardsList.tsx";
import { SidePanel } from "@encvoy-id/components";
import { Order } from "src/shared/utils/enums";
import {
  GroupMembershipUserCard,
  IGroupMembershipUserCardProps,
} from "./GroupMembershipUserCard";

interface IGroupUsersPanelProps {
  appId: string;
  group: IGroup;
  isOpen: boolean;
  onClose: () => void;
}

const GROUP_MEMBERS_PAGE_SIZE = 500;

const getUserDisplayName = (item?: TUserWithRole) => {
  const fullName = `${item?.user?.given_name || ""} ${
    item?.user?.family_name || ""
  }`.trim();

  return fullName || item?.user?.nickname || item?.user?.id || "";
};

export const GroupUsersPanel: FC<IGroupUsersPanelProps> = ({
  appId,
  group,
  isOpen,
  onClose,
}) => {
  const { t: translate } = useTranslation();
  const dispatch = useDispatch();
  const [getUsers] = useLazyGetUsersClientQuery();
  const [getGroupUsers] = useLazyGetGroupUsersQuery();
  const [addGroupUser] = useAddGroupUserMutation();
  const [removeGroupUser] = useRemoveGroupUserMutation();
  const [memberUserIds, setMemberUserIds] = useState<Set<string>>(new Set());
  const [pendingUserIds, setPendingUserIds] = useState<Set<string>>(new Set());
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [membersLoadError, setMembersLoadError] = useState<string | null>(null);
  const [customUpdate, setCustomUpdate] = useState(false);
  const membersRequestIdRef = useRef(0);

  const usersQuery = (
    offset: number,
    search = "",
    selectedFilterKey?: string | null
  ): IQueryPropsWithId => {
    const filter =
      selectedFilterKey === "members"
        ? JSON.stringify({
            group_id: group.id,
            group_membership: "member",
          })
        : selectedFilterKey === "non_members"
        ? JSON.stringify({
            group_id: group.id,
            group_membership: "non_member",
          })
        : undefined;

    return {
      query: {
        limit: 10,
        offset,
        search,
        sortDirection: Order.DESC,
        sortBy: "id",
        filter,
      },
      id: appId,
    };
  };

  const loadAllGroupUsers = useCallback(async () => {
    const requestId = membersRequestIdRef.current + 1;
    membersRequestIdRef.current = requestId;
    setIsLoadingMembers(true);
    setMembersLoadError(null);

    try {
      const nextMemberUserIds = new Set<string>();
      let offset = 0;
      let totalCount = 0;

      do {
        const data = await getGroupUsers(
          {
            organization_id: appId,
            group_id: group.id,
            limit: GROUP_MEMBERS_PAGE_SIZE,
            offset,
            search: "",
            sortBy: "id",
            sortDirection: Order.ASC,
          },
          false
        ).unwrap();

        if (membersRequestIdRef.current !== requestId) {
          return;
        }

        data.items.forEach((user) => {
          if (user.id) {
            nextMemberUserIds.add(user.id);
          }
        });

        offset += data.items.length;
        totalCount = data.totalCount;
      } while (offset < totalCount);

      if (membersRequestIdRef.current !== requestId) {
        return;
      }

      setMemberUserIds(nextMemberUserIds);
    } catch (error) {
      if (membersRequestIdRef.current !== requestId) {
        return;
      }

      console.error("Error load group users for side panel:", error);
      setMembersLoadError(translate("pages.directory.groups.errors.loadUsers"));
    } finally {
      if (membersRequestIdRef.current === requestId) {
        setIsLoadingMembers(false);
      }
    }
  }, [appId, getGroupUsers, group.id, translate]);

  useEffect(() => {
    if (!isOpen) {
      membersRequestIdRef.current += 1;
      setPendingUserIds(new Set());
      setMembersLoadError(null);
      setIsLoadingMembers(false);
      return;
    }

    setMemberUserIds(new Set());
    setPendingUserIds(new Set());
    void loadAllGroupUsers();
  }, [group.id, isOpen, loadAllGroupUsers]);

  const handleToggleMembership = async (item: TUserWithRole) => {
    const userId = item.user.id;

    if (!userId || pendingUserIds.has(userId)) {
      return;
    }

    const isMember = memberUserIds.has(userId);
    const displayName = getUserDisplayName(item);

    setPendingUserIds((prev) => {
      const next = new Set(prev);
      next.add(userId);
      return next;
    });

    try {
      if (isMember) {
        await removeGroupUser({
          organization_id: appId,
          group_id: group.id,
          member_user_id: userId,
        }).unwrap();
      } else {
        await addGroupUser({
          organization_id: appId,
          group_id: group.id,
          user_id: userId,
        }).unwrap();
      }

      setMemberUserIds((prev) => {
        const next = new Set(prev);

        if (isMember) {
          next.delete(userId);
        } else {
          next.add(userId);
        }

        return next;
      });

      dispatch(
        setNoticeInfo(
          translate(
            isMember
              ? "pages.directory.users.notices.removedFromGroup"
              : "pages.directory.groups.notices.userAdded",
            { name: displayName }
          )
        )
      );
      setCustomUpdate(true);
    } catch (error) {
      console.error("Error update group membership from side panel:", error);
      dispatch(
        setNoticeError(
          translate(
            isMember
              ? "pages.directory.users.errors.removeFromGroup"
              : "pages.directory.groups.errors.addMember",
            { name: displayName }
          )
        )
      );
    } finally {
      setPendingUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  return (
    <SidePanel
      buttonSubmitText={translate("actionButtons.save")}
      customAdditionalText={translate("actionButtons.create")}
      cancelText={translate("actionButtons.cancel")}
      onClose={onClose}
      isOpen={isOpen}
      title={group.name}
      closeButtonDataTestId="btn-group-users-panel-close"
    >
      <Box sx={{ overflowY: "auto", padding: "6px 12px" }}>
        {isLoadingMembers ? (
          <Box sx={{ px: 1, py: 2 }}>
            <Typography className="text-14" color="text.secondary">
              {translate("helperText.loading")}
            </Typography>
          </Box>
        ) : membersLoadError ? (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => void loadAllGroupUsers()}
              >
                {translate("actionButtons.retry")}
              </Button>
            }
          >
            {membersLoadError}
          </Alert>
        ) : (
          <ListItems<
            TUserWithRole,
            IQueryPropsWithId,
            IGroupMembershipUserCardProps
          >
            key={`group-users-${group.id}`}
            query={usersQuery}
            getItems={getUsers}
            RowElement={GroupMembershipUserCard}
            customUpdate={customUpdate}
            setCustomUpdate={setCustomUpdate}
            searchDataTestId="txt-group-users-search"
            searchContext={`group-users-${group.id}`}
            isSearchStatic={true}
            filters={{
              defaultSelectedKey: "all",
              options: [
                {
                  key: "all",
                  label: translate("pages.directory.groups.filters.all"),
                  color: "primary",
                  dataTestId: "chip-group-users-filter-all",
                },
                {
                  key: "members",
                  label: translate("pages.directory.groups.filters.members"),
                  color: "primary",
                  dataTestId: "chip-group-users-filter-members",
                },
                {
                  key: "non_members",
                  label: translate("pages.directory.groups.filters.nonMembers"),
                  color: "primary",
                  dataTestId: "chip-group-users-filter-non-members",
                },
              ],
            }}
            rowElementProps={{
              memberUserIds,
              pendingUserIds,
              onToggleMembership: handleToggleMembership,
            }}
          />
        )}
      </Box>
    </SidePanel>
  );
};
