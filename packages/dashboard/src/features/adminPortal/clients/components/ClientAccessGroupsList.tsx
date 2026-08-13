import { Alert, Box, Button, Typography } from "@mui/material";
import { FC, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import {
  IAddApplicationAccessGroupMutationArgs,
  IApplicationAccessGroupsQueryArgs,
  IGroup,
  IRemoveApplicationAccessGroupMutationArgs,
  useAddApplicationAccessGroupMutation,
  useLazyGetApplicationAccessGroupsQuery,
  useRemoveApplicationAccessGroupMutation,
} from "src/shared/api/groups";
import { IResponseListItems } from "src/shared/api/types";
import { setNoticeError, setNoticeInfo } from "src/shared/slices/noticesSlice";
import { ListItems } from "src/shared/ui/CardsList.tsx";
import { Order } from "src/shared/utils/enums";
import {
  GroupCard,
  IGroupCardProps,
} from "src/features/adminPortal/users/components/GroupCard";

interface IClientAccessGroupsListProps {
  applicationId: string;
  organizationId: string;
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

export const ClientAccessGroupsList: FC<IClientAccessGroupsListProps> = ({
  applicationId,
  organizationId,
}) => {
  const { t: translate } = useTranslation();
  const dispatch = useDispatch();
  const [getApplicationAccessGroups] = useLazyGetApplicationAccessGroupsQuery();
  const [addApplicationAccessGroup] = useAddApplicationAccessGroupMutation();
  const [removeApplicationAccessGroup] =
    useRemoveApplicationAccessGroupMutation();
  const [customUpdate, setCustomUpdate] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const query = useCallback(
    (
      offset: number,
      search = "",
      selectedFilterKey?: string | null
    ): IApplicationAccessGroupsQueryArgs => ({
      organization_id: organizationId,
      application_id: applicationId,
      limit: PAGE_SIZE,
      offset,
      search,
      sortBy: "name",
      sortDirection: Order.ASC,
      filter: JSON.stringify({
        application_access_membership:
          selectedFilterKey === "non_members" ? "non_member" : "member",
      }),
    }),
    [applicationId, organizationId]
  );

  const getItems = useCallback(
    (
      args: IApplicationAccessGroupsQueryArgs,
      preferCacheValue?: boolean
    ): { unwrap: () => Promise<IResponseListItems<IGroup[]>> } => ({
      unwrap: async () => {
        try {
          setLoadError(null);
          return await getApplicationAccessGroups(
            args,
            preferCacheValue
          ).unwrap();
        } catch (error) {
          console.error("Error load application access groups:", error);
          setLoadError(
            translate("pages.clientDetails.groups.errors.loadGroups")
          );

          return createEmptyResponse(args.offset ?? 0, args.limit ?? PAGE_SIZE);
        }
      },
    }),
    [getApplicationAccessGroups, translate]
  );

  const handleToggleMembership = async (
    group: IGroup,
    selectedFilterKey: string | null
  ) => {
    const isAdding = selectedFilterKey === "non_members";

    try {
      if (isAdding) {
        const params: IAddApplicationAccessGroupMutationArgs = {
          organization_id: organizationId,
          application_id: applicationId,
          group_id: group.id,
        };

        await addApplicationAccessGroup(params).unwrap();
      } else {
        const params: IRemoveApplicationAccessGroupMutationArgs = {
          organization_id: organizationId,
          application_id: applicationId,
          group_id: group.id,
        };

        await removeApplicationAccessGroup(params).unwrap();
      }

      dispatch(
        setNoticeInfo(
          translate(
            isAdding
              ? "pages.clientDetails.groups.notices.groupAdded"
              : "pages.clientDetails.groups.notices.groupRemoved"
          )
        )
      );
      setCustomUpdate(true);
    } catch (error: any) {
      console.error("Error update application access groups:", error);
      dispatch(
        setNoticeError(
          error?.data?.message ||
            translate(
              isAdding
                ? "pages.clientDetails.groups.errors.addGroup"
                : "pages.clientDetails.groups.errors.removeGroup"
            )
        )
      );
    }
  };

  return (
    <Box sx={{ minWidth: 0 }}>
      <Box sx={{ mb: 2 }}>
        <Typography className="text-17">
          {translate("pages.clientDetails.groups.title")}
        </Typography>
        <Typography className="text-12" color="text.secondary">
          {translate("pages.clientDetails.groups.description")}
        </Typography>
      </Box>

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
        <ListItems<IGroup, IApplicationAccessGroupsQueryArgs, IGroupCardProps>
          key={`client-access-groups-${applicationId}-${retryKey}`}
          query={query}
          getItems={getItems}
          RowElement={GroupCard}
          customUpdate={customUpdate}
          setCustomUpdate={setCustomUpdate}
          searchDataTestId="txt-client-access-groups-search"
          searchContext={`client-access-groups-${applicationId}`}
          isSearchStatic={true}
          filters={{
            defaultSelectedKey: "members",
            options: [
              {
                key: "members",
                label: translate("pages.directory.groups.filters.added"),
                color: "primary",
                dataTestId: "chip-client-access-groups-filter-members",
              },
              {
                key: "non_members",
                label: translate("pages.directory.groups.filters.others"),
                color: "primary",
                dataTestId: "chip-client-access-groups-filter-non-members",
              },
            ],
          }}
          rowElementProps={{
            onToggleMembership: handleToggleMembership,
            toggleButtonDataTestIdPrefix: "btn-client-access-groups-toggle",
          }}
        />
      )}
    </Box>
  );
};
