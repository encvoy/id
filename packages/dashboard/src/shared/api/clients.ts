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
  IResponseListItems,
  TFileString,
  IQueryId,
} from "./types";
import { TShortProvider } from "./provider";
import { TUserWithRole } from "./users";
import { IClientType, IRuleWithValidation } from "./settings";
import { emptySplitApi } from "./baseApi";
import { imagesToFormData } from "src/shared/utils/helpers";
import { TCustomFields } from "src/shared/slices/userSlice";
import { TLocalizedText } from "src/shared/utils/locales";

export type TClientLocalizedName = string | TLocalizedText;

export interface IUserClient {
  id: string;
  org_id?: string | null;
  organization_name?: string | TLocalizedText | null;
  sub: string;
  email: string;
  email_verified: boolean;
  birthdate: string;
  family_name: string;
  given_name: string;
  locale: string;
  login: string;
  name: string;
  nickname: string;
  phone_number: string;
  phone_number_verified: boolean;
  picture: string;
  blocked: boolean;
  deleted: string;
  custom_fields: TCustomFields;
  password_updated_at?: string;
  password_change_required?: boolean;
}

export interface IShortClient {
  client_id: string;
  name: TClientLocalizedName;
  catalog_name?: TClientLocalizedName | null;
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
  owner?: IClientOwnerSummary | null;
  activity_30d?: number;
  parent?: {
    avatar?: string;
    name: TClientLocalizedName;
  };
  Provider_relations: {
    provider: TShortProvider;
  }[];
  _count: {
    Role: number;
  };
}

export interface IClientOwnerSummary {
  id: string;
  display_name: string;
  email?: string | null;
}

export interface IClientFull extends IShortClient {
  cover: TFileString;
  cover_mode: ECoverModes;
  catalog: boolean;
  mini_widget: boolean;
  authorize_only_admins: boolean;
  authorize_only_employees: boolean;
  authorize_auto_by_session: boolean;
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
    name?: TClientLocalizedName;
  };
  rules?: IRuleWithValidation[];
  //Widget
  show_avatar_in_widget: boolean;
  hide_widget_create_account: boolean;
  hide_avatars_of_big_providers: boolean;
  hide_widget_header: boolean;
  hide_widget_footer: boolean;
  widget_title: TClientLocalizedName;
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

export interface IRegenerateClientSecretResponse {
  client_id: string;
  client_secret: string;
}

export interface ICreateOrganizationResponse {
  orgId: string;
}

export const clientsApi = emptySplitApi.injectEndpoints({
  endpoints: (builder) => ({
    getClients: builder.query<IResponseListItems<IClient[]>, IQuerySortParams>({
      query: (query) =>
        createFetchArgs<IQuerySortParams>(endPoints.clients, "GET", query),
      transformResponse: (clients: IClient[], meta: FetchBaseQueryMeta) =>
        parseResponse<IClient[]>(clients, meta),
      providesTags: [ETags.Clients],
    }),
    getClientInfo: builder.query<IClientFull, IQueryId>({
      query: ({ id }) => `${endPoints.clients}/${id}`,
      providesTags: [ETags.ClientDetails, ETags.Organization],
    }),
    createClient: builder.mutation<
      IRegenerateClientSecretResponse,
      Partial<IClientFull>
    >({
      query: (body) => createFetchArgsWithBody(endPoints.clients, "POST", body),
      invalidatesTags: [ETags.Catalog],
    }),
    updateClient: builder.mutation<IClientFull, Partial<IClientFull>>({
      query: ({ client_id, ...body }) =>
        createFetchArgsWithBody(
          `${endPoints.clients}/${client_id}`,
          "PUT",
          body
        ),
      invalidatesTags: [ETags.ClientDetails, ETags.Catalog],
    }),
    regenerateClientSecret: builder.mutation<
      IRegenerateClientSecretResponse,
      { client_id: string }
    >({
      query: ({ client_id }) =>
        createFetchArgs(
          `${endPoints.clients}/${client_id}/regenerate-secret`,
          "POST"
        ),
      invalidatesTags: [ETags.ClientDetails],
    }),
    updateClientProvidersList: builder.mutation<
      void,
      { client_id: string; big: string[]; small: string[] }
    >({
      query: ({ client_id, ...body }) =>
        createFetchArgsWithBody(
          `${endPoints.clients}/${client_id}/providers/list`,
          "PUT",
          body
        ),
      invalidatesTags: [ETags.Providers],
    }),
    updateAvatarClient: builder.mutation<IClientFull, Partial<IClientFull>>({
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
    createOrganization: builder.mutation<ICreateOrganizationResponse, void>({
      query: () => createFetchArgs(endPoints.organizations, "POST"),
      invalidatesTags: [ETags.Clients, ETags.User],
    }),
    transferClientOwner: builder.mutation<
      void,
      { client_id: string; user_id: string }
    >({
      query: ({ client_id, user_id }) =>
        createFetchArgsWithBody(
          `${endPoints.clients}/${client_id}/owner`,
          "PUT",
          { user_id }
        ),
      invalidatesTags: [ETags.Clients, ETags.ClientDetails],
    }),
    transferOrganizationOwner: builder.mutation<
      void,
      { client_id: string; user_id: string }
    >({
      query: ({ client_id, user_id }) =>
        createFetchArgsWithBody(
          `${endPoints.organizations}/${client_id}/owner`,
          "PUT",
          { user_id }
        ),
      invalidatesTags: [ETags.Clients, ETags.ClientDetails],
    }),
    deleteOrganization: builder.mutation<void, string>({
      query: (id) =>
        createFetchArgs(`${endPoints.organizations}/${id}`, "DELETE"),
      invalidatesTags: [ETags.Clients, ETags.ClientDetails],
    }),
    deleteSession: builder.mutation<void, IQueryIdProps>({
      query: ({ client_id, id }) =>
        createFetchArgs(
          `${endPoints.clients}/${client_id}/users/${id}/sessions`,
          "DELETE"
        ),
    }),
    getUsersClient: builder.query<
      IResponseListItems<TUserWithRole[]>,
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
      query: ({ client_id, id }) =>
        `${endPoints.clients}/${client_id}/users/${id}`,
      providesTags: [ETags.ClientUser],
    }),
    updateUserRoleClient: builder.mutation<void, queryIdPropsWithRole>({
      query: ({ client_id, id, role }) =>
        createFetchArgsWithBody<{ role: ERoles }>(
          `${endPoints.clients}/${client_id}/users/${id}/role`,
          "PUT",
          {
            role,
          }
        ),
    }),
    deleteUserRoleClient: builder.mutation<void, IQueryIdProps>({
      query: ({ client_id, id }) =>
        createFetchArgs(
          `${endPoints.clients}/${client_id}/users/${id}/role`,
          "DELETE"
        ),
    }),
    blockUser: builder.mutation<void, IQueryIdProps>({
      query: ({ client_id, id }) =>
        createFetchArgs(
          `${endPoints.clients}/${client_id}/users/${id}/block`,
          "PUT"
        ),
      invalidatesTags: (_result, _error, { id }) => [
        ETags.ClientUser,
        ETags.User,
        { type: ETags.DirectoryUser, id: `directory-user-${id}` },
      ],
    }),
    unblockUser: builder.mutation<void, IQueryIdProps>({
      query: ({ client_id, id }) =>
        createFetchArgs(
          `${endPoints.clients}/${client_id}/users/${id}/unblock`,
          "PUT"
        ),
      invalidatesTags: (_result, _error, { id }) => [
        ETags.ClientUser,
        ETags.User,
        { type: ETags.DirectoryUser, id: `directory-user-${id}` },
      ],
    }),
    addUserToInternalList: builder.mutation<void, IQueryIdProps>({
      query: ({ client_id, id }) =>
        createFetchArgs(
          `${endPoints.clients}/${client_id}/users/${id}/internal`,
          "POST"
        ),
      invalidatesTags: [ETags.ClientUser, ETags.User],
    }),
    removeUserFromInternalList: builder.mutation<void, IQueryIdProps>({
      query: ({ client_id, id }) =>
        createFetchArgs(
          `${endPoints.clients}/${client_id}/users/${id}/internal`,
          "DELETE"
        ),
      invalidatesTags: [
        ETags.ClientUser,
        ETags.User,
        ETags.ExternalAccounts,
        ETags.PublicExternalAccounts,
      ],
    }),
    removeUserFromOrganizationList: builder.mutation<void, IQueryIdProps>({
      query: ({ client_id, id }) =>
        createFetchArgs(
          `${endPoints.clients}/${client_id}/users/${id}/organization-list`,
          "DELETE"
        ),
      invalidatesTags: [
        ETags.ClientUser,
        ETags.User,
        ETags.ExternalAccounts,
        ETags.PublicExternalAccounts,
      ],
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
  useRegenerateClientSecretMutation,
  useUpdateClientProvidersListMutation,
  useDeleteClientMutation,
  useDeleteOrganizationMutation,
  useCreateOrganizationMutation,
  useTransferOrganizationOwnerMutation,
  useTransferClientOwnerMutation,
  useDeleteSessionMutation,
  useLazyGetUsersClientQuery,
  useUpdateUserRoleClientMutation,
  useDeleteUserRoleClientMutation,
  useBlockUserMutation,
  useUnblockUserMutation,
  useAddUserToInternalListMutation,
  useRemoveUserFromInternalListMutation,
  useRemoveUserFromOrganizationListMutation,
  useGetClientInfoQuery,
  useGetUserClientQuery,
  useAddClientRuleMutation,
  useDeleteClientRuleMutation,
  useUpdateAvatarClientMutation,
} = clientsApi;
