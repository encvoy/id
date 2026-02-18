import { FetchBaseQueryMeta } from "@reduxjs/toolkit/query/react";
import { endPoints, ETags, ERoles, ECoverModes } from "src/shared/utils/enums";
import {
  createFetchArgs,
  createFetchArgsWithBody,
  parseResponse,
} from "./helpers";
import {
  IQueryIdProps,
  IQueryPropsWithId,
  IQuerySortParams,
  responseListItems,
  TFileString,
  TQueryId,
} from "./types";
import { TShortProvider } from "./provider";
import { TUserWithRole } from "./users";
import { IClientType, IRuleWithValidation } from "./settings";
import { emptySplitApi } from "./baseApi";
import { imagesToFormData } from "src/shared/utils/helpers";
import { TCustomFields } from "../lib/userSlice";

export interface IUserClient {
  id: number;
  sub: string;
  email: string;
  email_verified: string;
  birthdate: string;
  family_name: string;
  given_name: string;
  locale: string;
  login: string;
  middle_name: string;
  name: string;
  nickname: string;
  phone_number: string;
  phone_number_verified: string;
  picture: string;
  blocked: boolean;
  deleted: string;
  custom_fields: TCustomFields;
  password_updated_at?: string;
}

export interface IShortClient {
  client_id: string;
  name: string;
  description?: string;
  domain: string;
  avatar: TFileString;
  created_at: string;
  group: string;
  type: IClientType;
}

export interface ICatalogClient extends IShortClient {
  favorite: boolean;
}

export interface IClient extends IShortClient {
  catalog: boolean;
  parent?: {
    avatar?: string;
    name: string;
  };
  Provider_relations: {
    provider: TShortProvider;
  }[];
  _count: {
    Role: number;
  };
}

export interface IClientFull extends IShortClient {
  cover: TFileString;
  cover_mode: ECoverModes;
  catalog: boolean;
  mini_widget: boolean;
  authorize_only_admins: boolean;
  authorize_only_employees: boolean;
  required_providers_ids: string[];
  client_secret: string;
  redirect_uris: string[];
  post_logout_redirect_uris: string[];
  application_type: string;
  grant_types: string[];
  id_token_signed_response_alg: string;
  request_uris: string[];
  require_auth_time: boolean;
  response_types: string[];
  subject_type: string;
  token_endpoint_auth_method: string;
  introspection_endpoint_auth_method: string;
  revocation_endpoint_auth_method: string;
  require_signed_request_object: boolean;
  access_token_ttl: number;
  refresh_token_ttl: number;
  type_id: string;
  parent_id?: string;
  parent?: {
    avater?: string;
    name?: string;
  };
  rules?: IRuleWithValidation[];
  //Widget
  show_avatar_in_widget: boolean;
  hide_widget_create_account: boolean;
  hide_avatars_of_big_providers: boolean;
  hide_widget_header: boolean;
  hide_widget_footer: boolean;
  widget_title: string;
  widget_info: string;
  widget_info_out: string;
  widget_colors: TWidgetColors;
}

export type TWidgetColors = {
  font_color: string;
  link_color: string;
  button_color: string;
};

export interface IClientWithRole {
  client: IClientFull;
  role: ERoles;
}

export interface IUserWithRole {
  user: IUserClient;
  role: ERoles;
}

export interface queryIdPropsWithRole extends IQueryIdProps {
  role: ERoles;
}

export const clientsApi = emptySplitApi.injectEndpoints({
  endpoints: (builder) => ({
    getClients: builder.query<responseListItems<IClient[]>, IQuerySortParams>({
      query: (query) =>
        createFetchArgs<IQuerySortParams>(endPoints.clients, "GET", query),
      transformResponse: (clients: IClient[], meta: FetchBaseQueryMeta) =>
        parseResponse<IClient[]>(clients, meta),
      providesTags: [ETags.Clients],
    }),
    getClientInfo: builder.query<IClientFull, TQueryId>({
      query: ({ id }) => `${endPoints.clients}/${id}`,
      providesTags: [ETags.ClientDetails, ETags.Organization],
    }),
    createClient: builder.mutation<{ client_id: string }, Partial<IClientFull>>(
      {
        query: (body) =>
          createFetchArgsWithBody(endPoints.clients, "POST", body),
        invalidatesTags: [ETags.Catalog],
      }
    ),
    updateClient: builder.mutation<IClientFull, Partial<IClientFull>>({
      query: ({ client_id, ...body }) =>
        createFetchArgsWithBody(
          `${endPoints.clients}/${client_id}`,
          "PUT",
          body
        ),
      invalidatesTags: [ETags.ClientDetails, ETags.Catalog],
    }),
    updateClientProvidersList: builder.mutation<
      void,
      { client_id: string; big: number[]; small: number[] }
    >({
      query: ({ client_id, ...body }) =>
        createFetchArgsWithBody(
          `${endPoints.clients}/${client_id}/providers/list`,
          "PUT",
          body
        ),
      invalidatesTags: [ETags.Providers],
    }),
    updateAvatarClient: builder.mutation<void, Partial<IClientFull>>({
      query: ({ client_id, cover, avatar }) => ({
        url: `${endPoints.clients}/${client_id}/images`,
        method: "PUT",
        body: imagesToFormData({ cover, avatar }),
      }),
      invalidatesTags: [ETags.Clients, ETags.ClientDetails],
    }),
    deleteClient: builder.mutation<void, string>({
      query: (id) => createFetchArgs(`${endPoints.clients}/${id}`, "DELETE"),
      invalidatesTags: [ETags.Clients],
    }),
    deleteSession: builder.mutation<void, IQueryIdProps>({
      query: ({ clientId, userId }) =>
        createFetchArgs(
          `${endPoints.clients}/${clientId}/users/${userId}/sessions`,
          "DELETE"
        ),
    }),
    getUsersClient: builder.query<
      responseListItems<TUserWithRole[]>,
      IQueryPropsWithId
    >({
      query: ({ id, query }) =>
        createFetchArgs<IQuerySortParams>(
          `${endPoints.clients}/${id}/users`,
          "GET",
          query
        ),
      transformResponse: (users: TUserWithRole[], meta: FetchBaseQueryMeta) =>
        parseResponse<TUserWithRole[]>(users, meta),
    }),
    getUserClient: builder.query<IUserWithRole, IQueryIdProps>({
      query: ({ clientId, userId }) =>
        `${endPoints.clients}/${clientId}/users/${userId}`,
      providesTags: [ETags.ClientUser],
    }),
    updateUserRoleClient: builder.mutation<void, queryIdPropsWithRole>({
      query: ({ clientId, userId, role }) =>
        createFetchArgsWithBody<{ role: ERoles }>(
          `${endPoints.clients}/${clientId}/users/${userId}/role`,
          "PUT",
          {
            role,
          }
        ),
    }),
    deleteUserRoleClient: builder.mutation<void, IQueryIdProps>({
      query: ({ clientId, userId }) =>
        createFetchArgs(
          `${endPoints.clients}/${clientId}/users/${userId}/role`,
          "DELETE"
        ),
    }),
    addClientRule: builder.mutation<void, { clientId: string; ruleId: string }>(
      {
        query: ({ clientId, ruleId }) =>
          createFetchArgs(
            `${endPoints.clients}/${clientId}/rules/${ruleId}`,
            "POST"
          ),
        invalidatesTags: [ETags.ClientDetails],
      }
    ),
    deleteClientRule: builder.mutation<
      void,
      { clientId: string; ruleId: string }
    >({
      query: ({ clientId, ruleId }) =>
        createFetchArgs(
          `${endPoints.clients}/${clientId}/rules/${ruleId}`,
          "DELETE"
        ),
      invalidatesTags: [ETags.ClientDetails],
    }),
  }),
});

export const {
  useLazyGetClientsQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useUpdateClientProvidersListMutation,
  useDeleteClientMutation,
  useDeleteSessionMutation,
  useLazyGetUsersClientQuery,
  useUpdateUserRoleClientMutation,
  useDeleteUserRoleClientMutation,
  useGetClientInfoQuery,
  useGetUserClientQuery,
  useAddClientRuleMutation,
  useDeleteClientRuleMutation,
  useUpdateAvatarClientMutation,
} = clientsApi;
