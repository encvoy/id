import { FetchBaseQueryMeta } from "@reduxjs/toolkit/query/react";
import { ETags, endPoints } from "src/shared/utils/enums";
import {
  createFetchArgs,
  createFetchArgsWithBody,
  parseResponse,
} from "./helpers";
import { emptySplitApi } from "./baseApi";
import { IQuerySortParams, IResponseListItems, IQueryId } from "./types";
import { IUserAutocompleteOption } from "src/shared/utils/userAutocomplete";

export interface IRbacAutocompleteQuery extends IQuerySortParams {
  client_id: string;
}

export type IRbacUser = IUserAutocompleteOption;

export interface IRbacGroup {
  id: string;
  client_id: string;
  folder_id: string;
  name: string;
  description?: string;
}

export interface IRbacResource {
  id: string;
  client_id: string;
  name: string;
  description?: string;
  parent_id?: string | null;
}

export interface IRbacRole {
  id: string;
  client_id: string;
  name: string;
  description?: string;
  client?: {
    client_id: string;
    name?: string;
  };
  assignments?: IRbacAssignment[];
}

export interface IRbacAssignment {
  id: string;
  resource_id: string;
  role_id: string;
  user_id?: string | null;
  group_id?: string | null;
  resource?: {
    id: string;
    name: string;
  } | null;
  role?: {
    id: string;
    name: string;
  } | null;
  user?: IRbacUser | null;
  group?: {
    id: string;
    name: string;
  } | null;
}

export interface ICreateRbacAssignmentDto {
  resource_id: string;
  role_id: string;
  user_id?: string;
  group_id?: string;
}

export interface IRbacGroupDetails extends IRbacGroup {
  usersCount?: number;
  groupsCount?: number;
  client?: {
    client_id: string;
    name?: string;
  };
  members?: IRbacGroupMember[];
}

export interface IRbacGroupMember {
  id: string;
  parent_group_id: string;
  member_user_id?: string;
  member_group_id?: string;
  member_user?: IRbacUser;
  member_group?: IRbacGroup;
}

export interface IAddMemberToGroupDto {
  member_user_id?: string;
  member_group_id?: string;
}

export type TRemoveMemberFromGroupArgs =
  | {
      groupId: string;
      member_user_id: string;
    }
  | {
      groupId: string;
      member_group_id: string;
    };

export const rbacApi = emptySplitApi.injectEndpoints({
  endpoints: (builder) => ({
    createRbacGroup: builder.mutation<IRbacGroup, Partial<IRbacGroup>>({
      query: (body) =>
        createFetchArgsWithBody(`${endPoints.rbac}/groups`, "POST", body),
      invalidatesTags: [ETags.RbacGroups, ETags.Folder],
    }),
    getRbacGroupById: builder.query<IRbacGroupDetails, string>({
      query: (id) => `${endPoints.rbac}/groups/${id}`,
      providesTags: (result, error, id) => [{ type: ETags.RbacGroups, id }],
    }),
    getRbacGroupUsers: builder.query<
      IResponseListItems<IRbacUser[]>,
      IQueryId & IQuerySortParams
    >({
      query: ({ id, ...params }) =>
        createFetchArgs(`${endPoints.rbac}/groups/${id}/users`, "GET", {
          ...params,
        }),
      transformResponse: (items: IRbacUser[], meta: FetchBaseQueryMeta) =>
        parseResponse<IRbacUser[]>(items, meta),
      providesTags: (result, error, { id }) => [
        { type: ETags.RbacGroupRelations, id },
      ],
    }),
    getRbacGroupGroups: builder.query<
      IResponseListItems<IRbacGroup[]>,
      IQueryId & IQuerySortParams
    >({
      query: ({ id, ...params }) =>
        createFetchArgs(`${endPoints.rbac}/groups/${id}/groups`, "GET", {
          ...params,
        }),
      transformResponse: (items: IRbacGroup[], meta: FetchBaseQueryMeta) =>
        parseResponse<IRbacGroup[]>(items, meta),
      providesTags: (result, error, { id }) => [
        { type: ETags.RbacGroupRelations, id },
      ],
    }),
    getRbacAutocompleteGroups: builder.query<
      IResponseListItems<IRbacGroup[]>,
      IRbacAutocompleteQuery
    >({
      query: (params) =>
        createFetchArgs(`${endPoints.rbac}/groups/autocomplete`, "GET", params),
      transformResponse: (items: IRbacGroup[], meta: FetchBaseQueryMeta) =>
        parseResponse<IRbacGroup[]>(items, meta),
    }),
    createRbacResource: builder.mutation<IRbacResource, Partial<IRbacResource>>(
      {
        query: (body) =>
          createFetchArgsWithBody(`${endPoints.rbac}/resources`, "POST", body),
        invalidatesTags: [ETags.RbacResources],
      }
    ),
    getRbacResources: builder.query<
      IResponseListItems<IRbacResource[]>,
      IQuerySortParams & IQueryId
    >({
      query: ({ id, ...params }) =>
        createFetchArgs(`${endPoints.rbac}/resources`, "GET", {
          ...params,
          client_id: id,
        }),
      transformResponse: (items: IRbacResource[], meta: FetchBaseQueryMeta) =>
        parseResponse<IRbacResource[]>(items, meta),
      providesTags: [ETags.RbacResources],
    }),
    createRbacRole: builder.mutation<IRbacRole, Partial<IRbacRole>>({
      query: (body) =>
        createFetchArgsWithBody(`${endPoints.rbac}/roles`, "POST", body),
      invalidatesTags: [ETags.RbacRoles],
    }),
    getRbacRoles: builder.query<
      IResponseListItems<IRbacRole[]>,
      IQueryId & Partial<IQuerySortParams>
    >({
      query: ({ id, ...params }) =>
        createFetchArgs(`${endPoints.rbac}/roles`, "GET", {
          ...params,
          client_id: id,
        }),
      transformResponse: (items: IRbacRole[], meta: FetchBaseQueryMeta) =>
        parseResponse<IRbacRole[]>(items, meta),
      providesTags: [ETags.RbacRoles],
    }),
    getRbacAssignments: builder.query<
      IResponseListItems<IRbacAssignment[]>,
      IQuerySortParams & {
        resource_id?: string;
        role_id?: string;
        user_id?: string;
        group_id?: string;
        client_id?: string;
        filter?: string;
      }
    >({
      query: (params) =>
        createFetchArgs(`${endPoints.rbac}/assignments`, "GET", params),
      transformResponse: (items: IRbacAssignment[], meta: FetchBaseQueryMeta) =>
        parseResponse<IRbacAssignment[]>(items, meta),
      providesTags: [ETags.RbacAssignments],
    }),
    createRbacAssignment: builder.mutation<
      IRbacAssignment,
      ICreateRbacAssignmentDto
    >({
      query: (body) =>
        createFetchArgsWithBody(`${endPoints.rbac}/assignments`, "POST", body),
      invalidatesTags: [ETags.RbacAssignments],
    }),
    updateRbacAssignment: builder.mutation<
      IRbacAssignment,
      { id: string; body: { role_id: string } }
    >({
      query: ({ id, body }) =>
        createFetchArgsWithBody(
          `${endPoints.rbac}/assignments/${id}`,
          "PUT",
          body
        ),
      invalidatesTags: [ETags.RbacAssignments],
    }),
    deleteRbacAssignment: builder.mutation<{ message: string }, string>({
      query: (id) =>
        createFetchArgs(`${endPoints.rbac}/assignments/${id}`, "DELETE"),
      invalidatesTags: [ETags.RbacAssignments],
    }),
    updateRbacRole: builder.mutation<
      IRbacRole,
      { id: string; body: Partial<IRbacRole> }
    >({
      query: ({ id, body }) =>
        createFetchArgsWithBody(`${endPoints.rbac}/roles/${id}`, "PUT", body),
      invalidatesTags: [ETags.RbacRoles],
    }),
    deleteRbacRole: builder.mutation<{ message: string }, string>({
      query: (id) => createFetchArgs(`${endPoints.rbac}/roles/${id}`, "DELETE"),
      invalidatesTags: [ETags.RbacRoles],
    }),
    updateRbacResource: builder.mutation<
      IRbacResource,
      { id: string; body: Partial<IRbacResource> }
    >({
      query: ({ id, body }) =>
        createFetchArgsWithBody(
          `${endPoints.rbac}/resources/${id}`,
          "PUT",
          body
        ),
      invalidatesTags: [ETags.RbacResources],
    }),
    deleteRbacResource: builder.mutation<{ message: string }, string>({
      query: (id) =>
        createFetchArgs(`${endPoints.rbac}/resources/${id}`, "DELETE"),
      invalidatesTags: [ETags.RbacResources],
    }),
    updateRbacGroup: builder.mutation<
      IRbacGroupDetails,
      { id: string; body: Partial<IRbacGroup> }
    >({
      query: ({ id, body }) =>
        createFetchArgsWithBody(`${endPoints.rbac}/groups/${id}`, "PUT", body),
      invalidatesTags: [ETags.RbacGroups],
    }),
    deleteRbacGroup: builder.mutation<{ message: string }, string>({
      query: (id) =>
        createFetchArgs(`${endPoints.rbac}/groups/${id}`, "DELETE"),
      invalidatesTags: [ETags.RbacGroups, ETags.Folder],
    }),
    addMemberToGroup: builder.mutation<
      IRbacGroupMember,
      { groupId: string; body: IAddMemberToGroupDto }
    >({
      query: ({ groupId, body }) =>
        createFetchArgsWithBody(
          `${endPoints.rbac}/groups/${groupId}/members`,
          "POST",
          body
        ),
      invalidatesTags: (result, error, { groupId }) => [
        { type: ETags.RbacGroups, id: groupId },
        { type: ETags.RbacGroupRelations, id: groupId },
      ],
    }),
    removeMemberFromGroup: builder.mutation<
      { message: string },
      TRemoveMemberFromGroupArgs
    >({
      query: (args) => {
        if ("member_user_id" in args) {
          return createFetchArgs(
            `${endPoints.rbac}/groups/${args.groupId}/members/${args.member_user_id}`,
            "DELETE"
          );
        }

        return createFetchArgsWithBody(
          `${endPoints.rbac}/groups/${args.groupId}/members`,
          "DELETE",
          {
            member_group_id: args.member_group_id,
          }
        );
      },
      invalidatesTags: (result, error, { groupId }) => [
        { type: ETags.RbacGroups, id: groupId },
        { type: ETags.RbacGroupRelations, id: groupId },
      ],
    }),
  }),
});

export const {
  useCreateRbacGroupMutation,
  useCreateRbacResourceMutation,
  useCreateRbacRoleMutation,
  useGetRbacGroupByIdQuery,
  useGetRbacGroupUsersQuery,
  useGetRbacGroupGroupsQuery,
  useCreateRbacAssignmentMutation,
  useUpdateRbacAssignmentMutation,
  useDeleteRbacAssignmentMutation,
  useGetRbacAssignmentsQuery,
  useGetRbacRolesQuery,
  useGetRbacResourcesQuery,
  useLazyGetRbacAutocompleteGroupsQuery,
  useLazyGetRbacAssignmentsQuery,
  useLazyGetRbacGroupUsersQuery,
  useLazyGetRbacGroupGroupsQuery,
  useLazyGetRbacRolesQuery,
  useLazyGetRbacResourcesQuery,
  useUpdateRbacRoleMutation,
  useDeleteRbacRoleMutation,
  useUpdateRbacResourceMutation,
  useDeleteRbacResourceMutation,
  useUpdateRbacGroupMutation,
  useDeleteRbacGroupMutation,
  useAddMemberToGroupMutation,
  useRemoveMemberFromGroupMutation,
} = rbacApi;
