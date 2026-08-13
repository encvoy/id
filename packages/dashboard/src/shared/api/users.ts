import { FetchBaseQueryMeta } from "@reduxjs/toolkit/query/react";
import {
  EClaimPrivacy,
  EClaimPrivacyNumber,
  ETags,
  ERoles,
  endPoints,
} from "src/shared/utils/enums";
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
import { TCustomFields } from "src/shared/slices/userSlice";
import { emptySplitApi } from "./baseApi";
import { IShortClient } from "./clients";
import { EProviderType } from "./provider";
import { imagesToFormData } from "src/shared/utils/helpers.ts";
import { IUserAutocompleteOption } from "src/shared/utils/userAutocomplete";
import { TLocalizedText } from "src/shared/utils/locales";

export type { IUserAutocompleteOption } from "src/shared/utils/userAutocomplete";

export type AccountTypes = EProviderType;

export interface ICertificateSourceInfo {
  kind?: string;
  id?: string;
  entry_id?: string;
  dn?: string;
  [key: string]: unknown;
}

export interface ICertificateRestInfo {
  cn?: string;
  dn?: string;
  cert?: string;
  issuer?: string;
  serial?: string;
  verify?: string | boolean;
  createdAt?: string;
  created_at?: string;
  fingerprint?: string;
  valid_from?: string;
  valid_to?: string;
  verified_at?: string;
  is_valid?: boolean;
  is_revoked?: boolean;
  is_expired?: boolean;
  verification_passed?: boolean;
  is_cert_chain_valid?: boolean;
  is_accredited_ca?: boolean;
  authentication_enabled?: boolean;
  imported?: boolean;
  signature_algorithm?: string;
  signature_digest_algorithm?: string;
  public_key_algorithm?: string;
  key_algorithm?: string;
  issuer_friendly_name?: string;
  certificate_content_hash?: string;
  schema_version?: number;
  source?: ICertificateSourceInfo;
  [key: string]: unknown;
}

export interface IExternalAccount {
  id: string;
  sub: string;
  label?: string;
  rest_info?: string | ICertificateRestInfo | null;
  type: AccountTypes;
  issuer: string;
  avatar?: string;
  profile_link?: string;
  public: number;
}

export interface IRoleClients {
  role: ERoles;
  client: {
    name: string;
    client_id: string;
    parent_id: string | null;
  };
}

export interface IRole {
  role: ERoles;
  client_id: string;
  parent_id: string | null;
}

export interface IPrivateClaims {
  public_profile_claims_oauth?: string;
  public_profile_claims_gravatar?: string;
}

export interface IUserShort {
  family_name: string;
  given_name: string;
  nickname: string;
  picture: string;
  id: string;
  groupsCount: number;
  blocked: boolean;
  deleted?: string;
  org_id?: string | null;
  organization_name?: string | TLocalizedText | null;
}

export interface IUserProfile extends IPrivateClaims {
  id?: string;
  login?: string;
  locale?: string | null;
  nickname?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  birthdate?: string;
  phone_number?: string | null;
  password_updated_at?: string;
  picture?: TFileString;
  password_change_required?: boolean;
  custom_fields?: TCustomFields;
  Role?: IRole[];
  deleted?: string | null;
  email_verified?: boolean;
  phone_number_verified?: boolean | null;
  profile_privacy?: boolean;
  org_id?: string;
}

export interface IDeleteUserResult {
  mode: "deleted" | "scheduled" | "archived";
  retention_days: number;
  restore_allowed: boolean;
  deleted_at: string | null;
  tokens_revoked: boolean;
  sessions_revoked: boolean;
}

export type TUserContactField = "email" | "phone_number";

export interface IClientUsersAutocompleteQuery {
  client_id: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortDirection?: string;
  sortBy?: string;
  user_ids?: string[];
}

export interface ICheckUniqueFieldAvailabilityQuery {
  field_name: string;
  value: string;
  user_id?: string;
  client_id?: string;
  organization_id?: string;
}

export interface IUserProfileWithPassword extends IUserProfile {
  password?: string;
  send_account_create_email?: boolean;
}

export interface IScope {
  id: string;
  client_id: string;
  scopes: string[];
  created_at: string;
  client: IShortClient;
}

export interface TUserWithRole {
  user: IUserShort;
  role: ERoles;
}

export const usersApi = emptySplitApi.injectEndpoints({
  endpoints: (builder) => ({
    getMeInfo: builder.query<IUserProfile, void>({
      query: () => `${endPoints.users}/me`,
      providesTags: [ETags.User],
    }),

    updateUser: builder.mutation<
      IUserProfile,
      { userId: string; body: Partial<IUserProfile> }
    >({
      // field avatar do not put body
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      query: ({ userId, body: { picture, ...body } }) =>
        createFetchArgsWithBody(`${endPoints.users}/${userId}`, "PUT", body),
      invalidatesTags: [
        ETags.User,
        ETags.ClientUser,
        ETags.ExternalAccounts,
        ETags.PublicExternalAccounts,
      ],
    }),

    confirmUserContact: builder.mutation<
      IUserProfile,
      { userId: string; contactType: TUserContactField }
    >({
      query: ({ userId, contactType }) =>
        createFetchArgs(
          `${endPoints.users}/${userId}/contacts/${contactType}/confirm`,
          "POST"
        ),
      invalidatesTags: (_result, _error, { userId }) => [
        ETags.User,
        ETags.ClientUser,
        ETags.ExternalAccounts,
        ETags.PublicExternalAccounts,
        { type: ETags.DirectoryUser, id: `directory-user-${userId}` },
      ],
    }),

    updatePicture: builder.mutation({
      query: ({ picture, userId }: { picture: TFileString; userId: string }) =>
        createFetchArgsWithBody(
          `${endPoints.users}/${userId}/avatar`,
          "PUT",
          imagesToFormData({ picture })
        ),
      invalidatesTags: [ETags.User],
    }),

    getUserScopes: builder.query<
      IResponseListItems<IScope[]>,
      IQueryPropsWithId
    >({
      query: ({ id, query }) =>
        createFetchArgs<IQuerySortParams>(
          `${endPoints.users}/${id}/scopes`,
          "GET",
          query
        ),
      transformResponse: (scopes: IScope[], meta: FetchBaseQueryMeta) =>
        parseResponse<IScope[]>(scopes, meta),
      providesTags: [ETags.Scopes],
    }),

    revokeScopes: builder.mutation<boolean, IQueryIdProps>({
      query: ({ id, client_id }) =>
        createFetchArgs<{ client_id: string }>(
          `${endPoints.users}/${id}/scopes`,
          "DELETE",
          {
            client_id: client_id,
          }
        ),
      invalidatesTags: [ETags.Scopes],
    }),

    getUserRoles: builder.query<IRoleClients[], IQueryId>({
      query: ({ id }) => `${endPoints.users}/${id}/roles`,
    }),

    deleteUser: builder.mutation<
      IDeleteUserResult,
      { id: string; password?: string }
    >({
      query: ({ id, ...body }) =>
        createFetchArgsWithBody(`${endPoints.users}/${id}`, "DELETE", body),
    }),

    createUser: builder.mutation<
      { id: string },
      Partial<IUserProfileWithPassword>
    >({
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      query: ({ picture, ...body }) =>
        createFetchArgsWithBody(`${endPoints.users}`, "POST", body),
    }),

    createClientUser: builder.mutation<
      { id: string },
      Partial<IUserProfileWithPassword> & { client_id: string }
    >({
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      query: ({ picture, client_id, ...body }) =>
        createFetchArgsWithBody(
          `${endPoints.clients}/${client_id}/${endPoints.users}`,
          "POST",
          body
        ),
    }),

    checkUniqueFieldAvailability: builder.query<
      boolean,
      ICheckUniqueFieldAvailabilityQuery
    >({
      query: (params) =>
        createFetchArgs(
          `${endPoints.users}/check-unique-field-availability`,
          "GET",
          params
        ),
    }),

    getClientAutocompleteUsers: builder.query<
      IResponseListItems<IUserAutocompleteOption[]>,
      IClientUsersAutocompleteQuery
    >({
      query: ({ client_id, user_ids, ...query }) =>
        createFetchArgs(
          `${endPoints.clients}/${client_id}/${endPoints.users}/autocomplete`,
          "GET",
          {
            ...query,
            ...(user_ids?.length ? { user_ids: JSON.stringify(user_ids) } : {}),
          }
        ),
      transformResponse: (
        items: IUserAutocompleteOption[],
        meta: FetchBaseQueryMeta
      ) => parseResponse<IUserAutocompleteOption[]>(items, meta),
    }),

    deleteUsers: builder.mutation<{ errors: string[] }, { id: string }>({
      query: ({ id }) => createFetchArgs(`${endPoints.users}/${id}`, "DELETE"),
    }),

    changePassword: builder.mutation<
      void,
      {
        password: string;
        userId: string;
        old_password?: string;
      }
    >({
      query: ({ userId, ...body }) =>
        createFetchArgsWithBody(
          `${endPoints.users}/${userId}/password`,
          "PUT",
          body
        ),
    }),

    addFavoriteClient: builder.mutation<void, IQueryIdProps>({
      query: ({ id, client_id }) =>
        createFetchArgs<{ client_id: string }>(
          `${endPoints.users}/${id}/favorite_clients`,
          "POST",
          {
            client_id: client_id,
          }
        ),
      invalidatesTags: [ETags.Catalog],
    }),

    deleteFavoriteClient: builder.mutation({
      query: (params: IQueryIdProps) =>
        createFetchArgs<{ client_id: string }>(
          `${endPoints.users}/${params.id}/favorite_clients`,
          "DELETE",
          {
            client_id: params.client_id,
          }
        ),
      invalidatesTags: [ETags.Catalog],
    }),

    restoreProfile: builder.mutation<void, IQueryId>({
      query: ({ id }) =>
        createFetchArgs(`${endPoints.users}/${id}/restore`, "PUT"),
      invalidatesTags: (_result, _error, { id }) => [
        ETags.User,
        ETags.ClientUser,
        { type: ETags.DirectoryUser, id: `directory-user-${id}` },
      ],
    }),

    markUserForDeletion: builder.mutation<{ deleted: string | null }, IQueryId>(
      {
        query: ({ id }) =>
          createFetchArgs(`${endPoints.users}/${id}/mark-delete`, "PUT"),
        invalidatesTags: (_result, _error, { id }) => [
          ETags.User,
          ETags.ClientUser,
          { type: ETags.DirectoryUser, id: `directory-user-${id}` },
        ],
      }
    ),

    deleteExternalAccount: builder.mutation<
      void,
      { userId: string; accountId: string }
    >({
      query: ({ userId, accountId }) =>
        createFetchArgs(
          `${endPoints.users}/${userId}/external_accounts/${accountId}`,
          "DELETE"
        ),
      invalidatesTags: [
        ETags.User,
        ETags.ClientUser,
        ETags.ExternalAccounts,
        ETags.PublicExternalAccounts,
      ],
    }),
    getPublicExternalAccounts: builder.query<
      IExternalAccount[],
      IQueryId & { client_id?: string }
    >({
      query: ({ id, client_id }) => ({
        url: `${endPoints.users}/public_external_accounts`,
        params: { user_id: id, client_id },
      }),
      providesTags: [ETags.PublicExternalAccounts],
    }),
    getPrivateClaims: builder.query<IPrivateClaims, IQueryId>({
      query: ({ id }) => `${endPoints.users}/${id}/private_scopes`,
      providesTags: [ETags.Claims],
    }),
    changeClaimPrivacy: builder.mutation<
      void,
      {
        userId: string;
        claim_privacy: EClaimPrivacy;
        field: string;
      }
    >({
      query: ({ userId, ...body }) =>
        createFetchArgsWithBody(
          `${endPoints.users}/${userId}/private_scopes`,
          "PUT",
          body
        ),
      invalidatesTags: [ETags.Claims],
    }),
    changeExternalAccount: builder.mutation<
      void,
      {
        id: string;
        userId: string;
        claim_privacy: EClaimPrivacyNumber;
      }
    >({
      query: ({ userId, id, ...body }) =>
        createFetchArgsWithBody(
          `${endPoints.users}/${userId}/external_accounts/${id}`,
          "PUT",
          body
        ),
      invalidatesTags: [ETags.ExternalAccounts],
    }),
    deleteAllSession: builder.query({
      query: (userId) =>
        createFetchArgs(`${endPoints.users}/${userId}/sessions`, "DELETE"),
    }),
  }),
});

export const {
  useGetMeInfoQuery,
  useLazyGetMeInfoQuery,
  useGetPublicExternalAccountsQuery,
  useUpdateUserMutation,
  useConfirmUserContactMutation,
  useLazyGetUserScopesQuery,
  useRevokeScopesMutation,
  useGetUserRolesQuery,
  useDeleteUserMutation,
  useCreateUserMutation,
  useCreateClientUserMutation,
  useLazyCheckUniqueFieldAvailabilityQuery,
  useGetClientAutocompleteUsersQuery,
  useLazyGetClientAutocompleteUsersQuery,
  useDeleteUsersMutation,
  useChangePasswordMutation,
  useAddFavoriteClientMutation,
  useDeleteFavoriteClientMutation,
  useDeleteExternalAccountMutation,
  useRestoreProfileMutation,
  useMarkUserForDeletionMutation,
  useGetPrivateClaimsQuery,
  useChangeClaimPrivacyMutation,
  useChangeExternalAccountMutation,
  useUpdatePictureMutation,
  useLazyDeleteAllSessionQuery,
} = usersApi;
