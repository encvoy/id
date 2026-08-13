import { FetchBaseQueryMeta } from "@reduxjs/toolkit/query/react";
import { ETags, endPoints } from "src/shared/utils/enums";
import { emptySplitApi } from "./baseApi";
import {
  createFetchArgs,
  createFetchArgsWithBody,
  parseResponse,
} from "./helpers";
import {
  IQueryPropsWithId,
  IQuerySortParams,
  IResponseListItems,
} from "./types";

export interface IGroup {
  id: string;
  client_id: string;
  name: string;
  description?: string;
  usersCount?: number;
  client?: {
    client_id: string;
    name?: string;
  };
}

export interface IGroupUser {
  id: string;
  display_name: string;
  login?: string;
  email?: string;
  nickname?: string;
  family_name?: string;
  given_name?: string;
  org_id?: string | null;
  [key: string]: unknown;
}

export interface ICreateGroupDto {
  name: string;
  description?: string;
}

export interface ICreateGroupMutationArgs {
  organization_id: string;
  body: ICreateGroupDto;
}

export interface IUpdateGroupMutationArgs {
  organization_id: string;
  group_id: string;
  body: Partial<ICreateGroupDto>;
}

export interface IDeleteGroupMutationArgs {
  organization_id: string;
  group_id: string;
}

export interface IGroupUsersQueryArgs extends IQuerySortParams {
  organization_id: string;
  group_id: string;
}

export interface IApplicationAccessGroupsQueryArgs extends IQuerySortParams {
  organization_id: string;
  application_id: string;
}

export interface IAddGroupUserMutationArgs {
  organization_id: string;
  group_id: string;
  user_id: string;
}

export interface IRemoveGroupUserMutationArgs {
  organization_id: string;
  group_id: string;
  member_user_id: string;
}

export interface IAddApplicationAccessGroupMutationArgs {
  organization_id: string;
  application_id: string;
  group_id: string;
}

export interface IRemoveApplicationAccessGroupMutationArgs {
  organization_id: string;
  application_id: string;
  group_id: string;
}

const getGroupsBasePath = (organization_id: string) =>
  `${endPoints.organizations}/${organization_id}/${endPoints.groups}`;

const getApplicationAccessGroupsBasePath = (
  organization_id: string,
  client_id: string
) =>
  `${endPoints.organizations}/${organization_id}/${endPoints.clients}/${client_id}/access-groups`;

export const groupsApi = emptySplitApi.injectEndpoints({
  endpoints: (builder) => ({
    getGroups: builder.query<IResponseListItems<IGroup[]>, IQueryPropsWithId>({
      query: ({ id, query }) =>
        createFetchArgs<IQuerySortParams>(getGroupsBasePath(id), "GET", query),
      transformResponse: (groups: IGroup[], meta: FetchBaseQueryMeta) =>
        parseResponse<IGroup[]>(groups, meta),
      providesTags: [ETags.Groups],
    }),
    createGroup: builder.mutation<IGroup, ICreateGroupMutationArgs>({
      query: ({ organization_id, body }) =>
        createFetchArgsWithBody(
          getGroupsBasePath(organization_id),
          "POST",
          body
        ),
      invalidatesTags: [
        ETags.Groups,
        ETags.ApplicationAccessGroups,
        ETags.RbacGroups,
        ETags.Folder,
        ETags.Folders,
      ],
    }),
    updateGroup: builder.mutation<IGroup, IUpdateGroupMutationArgs>({
      query: ({ organization_id, group_id, body }) =>
        createFetchArgsWithBody(
          `${getGroupsBasePath(organization_id)}/${group_id}`,
          "PUT",
          body
        ),
      invalidatesTags: (_result, _error, { group_id }) => [
        ETags.Groups,
        ETags.ApplicationAccessGroups,
        ETags.RbacGroups,
        ETags.Folder,
        { type: ETags.GroupUsers, id: group_id },
        { type: ETags.RbacGroupRelations, id: group_id },
      ],
    }),
    deleteGroup: builder.mutation<
      { message: string },
      IDeleteGroupMutationArgs
    >({
      query: ({ organization_id, group_id }) =>
        createFetchArgs(
          `${getGroupsBasePath(organization_id)}/${group_id}`,
          "DELETE"
        ),
      invalidatesTags: (_result, _error, { group_id }) => [
        ETags.Groups,
        ETags.ApplicationAccessGroups,
        ETags.RbacGroups,
        ETags.Folder,
        ETags.Folders,
        { type: ETags.GroupUsers, id: group_id },
        { type: ETags.RbacGroupRelations, id: group_id },
      ],
    }),
    getGroupUsers: builder.query<
      IResponseListItems<IGroupUser[]>,
      IGroupUsersQueryArgs
    >({
      query: ({ organization_id, group_id, ...query }) =>
        createFetchArgs(
          `${getGroupsBasePath(organization_id)}/${group_id}/users`,
          "GET",
          query
        ),
      transformResponse: (users: IGroupUser[], meta: FetchBaseQueryMeta) =>
        parseResponse<IGroupUser[]>(users, meta),
      providesTags: (_result, _error, { group_id }) => [
        { type: ETags.GroupUsers, id: group_id },
        { type: ETags.RbacGroupRelations, id: group_id },
      ],
    }),
    getApplicationAccessGroups: builder.query<
      IResponseListItems<IGroup[]>,
      IApplicationAccessGroupsQueryArgs
    >({
      query: ({ organization_id, application_id, ...query }) =>
        createFetchArgs(
          getApplicationAccessGroupsBasePath(organization_id, application_id),
          "GET",
          query
        ),
      transformResponse: (groups: IGroup[], meta: FetchBaseQueryMeta) =>
        parseResponse<IGroup[]>(groups, meta),
      providesTags: [ETags.ApplicationAccessGroups],
    }),
    addGroupUser: builder.mutation<IGroupUser, IAddGroupUserMutationArgs>({
      query: ({ organization_id, group_id, user_id }) =>
        createFetchArgsWithBody(
          `${getGroupsBasePath(organization_id)}/${group_id}/users`,
          "POST",
          { user_id }
        ),
      invalidatesTags: (_result, _error, { group_id }) => [
        ETags.Groups,
        ETags.RbacGroups,
        { type: ETags.GroupUsers, id: group_id },
        { type: ETags.RbacGroupRelations, id: group_id },
      ],
    }),
    addApplicationAccessGroup: builder.mutation<
      IGroup,
      IAddApplicationAccessGroupMutationArgs
    >({
      query: ({ organization_id, application_id, group_id }) =>
        createFetchArgs(
          `${getApplicationAccessGroupsBasePath(
            organization_id,
            application_id
          )}/${group_id}`,
          "POST"
        ),
      invalidatesTags: [ETags.ApplicationAccessGroups],
    }),
    removeGroupUser: builder.mutation<
      { message: string },
      IRemoveGroupUserMutationArgs
    >({
      query: ({ organization_id, group_id, member_user_id }) =>
        createFetchArgs(
          `${getGroupsBasePath(
            organization_id
          )}/${group_id}/users/${member_user_id}`,
          "DELETE"
        ),
      invalidatesTags: (_result, _error, { group_id }) => [
        ETags.Groups,
        ETags.RbacGroups,
        { type: ETags.GroupUsers, id: group_id },
        { type: ETags.RbacGroupRelations, id: group_id },
      ],
    }),
    removeApplicationAccessGroup: builder.mutation<
      { message: string },
      IRemoveApplicationAccessGroupMutationArgs
    >({
      query: ({ organization_id, application_id, group_id }) =>
        createFetchArgs(
          `${getApplicationAccessGroupsBasePath(
            organization_id,
            application_id
          )}/${group_id}`,
          "DELETE"
        ),
      invalidatesTags: [ETags.ApplicationAccessGroups],
    }),
  }),
});

export const {
  useAddApplicationAccessGroupMutation,
  useCreateGroupMutation,
  useDeleteGroupMutation,
  useLazyGetApplicationAccessGroupsQuery,
  useLazyGetGroupUsersQuery,
  useLazyGetGroupsQuery,
  useRemoveGroupUserMutation,
  useAddGroupUserMutation,
  useRemoveApplicationAccessGroupMutation,
  useUpdateGroupMutation,
} = groupsApi;
