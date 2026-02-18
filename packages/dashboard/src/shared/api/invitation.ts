import { endPoints, ETags } from "src/shared/utils/enums";
import { emptySplitApi } from "./baseApi";
import {
  createFetchArgs,
  createFetchArgsWithBody,
  parseResponse,
} from "./helpers";
import {
  IQueryPropsWithId,
  IQuerySortParams,
  responseListItems,
} from "src/shared/api/types";
import { FetchBaseQueryMeta } from "@reduxjs/toolkit/query/react";

export interface IInvitation {
  client?: {
    name: string;
    domain: string;
    avatar: string;
  };
  client_id: string;
  id: string;
  email: string;
  created_at: string;
}

export const verificationApi = emptySplitApi.injectEndpoints({
  endpoints: (builder) => ({
    getInvitations: builder.query<
      responseListItems<IInvitation[]>,
      IQueryPropsWithId
    >({
      query: ({ id, query }) =>
        createFetchArgs<IQuerySortParams>(
          `${endPoints.clients}/${id}/${endPoints.invitations}`,
          "GET",
          query
        ),
      keepUnusedDataFor: 5,
      transformResponse: (
        invitation: IInvitation[],
        meta: FetchBaseQueryMeta
      ) => parseResponse<IInvitation[]>(invitation, meta),
      providesTags: [ETags.Invites],
    }),
    createInvitation: builder.mutation<
      string[],
      { clientId: string; emails: string[] }
    >({
      query: ({ clientId, emails }) => {
        return createFetchArgsWithBody(
          `${endPoints.clients}/${clientId}/${endPoints.invitations}`,
          "POST",
          {
            email: emails,
          }
        );
      },
      invalidatesTags: [ETags.Invites],
    }),
    deleteInvitation: builder.mutation<
      void,
      { clientId: string; invitationId: string }
    >({
      query: ({ clientId, invitationId }) => {
        return createFetchArgs(
          `${endPoints.clients}/${clientId}/${endPoints.invitations}/${invitationId}`,
          "DELETE"
        );
      },
      invalidatesTags: [ETags.Invites],
    }),
    getUsersInvitations: builder.query<
      responseListItems<IInvitation[]>,
      IQueryPropsWithId
    >({
      query: ({ id, query }) =>
        createFetchArgs<IQuerySortParams>(
          `${endPoints.users}/${id}/${endPoints.invitations}`,
          "GET",
          query
        ),
      transformResponse: (
        invitation: IInvitation[],
        meta: FetchBaseQueryMeta
      ) => parseResponse<IInvitation[]>(invitation, meta),
      providesTags: [ETags.Invites],
    }),
    deleteUserInvitation: builder.mutation<
      void,
      { userId: string; invitationId: string }
    >({
      query: ({ userId, invitationId }) => {
        return createFetchArgs(
          `${endPoints.users}/${userId}/${endPoints.invitations}/${invitationId}`,
          "DELETE"
        );
      },
      invalidatesTags: [ETags.Invites],
    }),
    confirmUserInvitation: builder.mutation<
      void,
      { userId: string; invitationId: string }
    >({
      query: ({ userId, invitationId }) => {
        return createFetchArgs(
          `${endPoints.users}/${userId}/${endPoints.invitations}/${invitationId}`,
          "PUT"
        );
      },
      invalidatesTags: [ETags.Invites],
    }),
  }),
});

export const {
  useLazyGetInvitationsQuery,
  useCreateInvitationMutation,
  useDeleteInvitationMutation,
  useLazyGetUsersInvitationsQuery,
  useDeleteUserInvitationMutation,
  useConfirmUserInvitationMutation,
} = verificationApi;
