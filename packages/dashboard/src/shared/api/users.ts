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
  responseListItems,
  TFileString,
  TQueryId,
} from "./types";
import { TCustomFields } from "../lib/userSlice";
import { emptySplitApi } from "./baseApi";
import { IShortClient } from "./clients";
import { ProviderType } from "./provider";
import { imagesToFormData } from "src/shared/utils/helpers.ts";

export type AccountTypes = ProviderType;

export interface IMTLSProps {
  dn: string;
  cert: string;
  issuer: string;
  serial: string;
  verify: string;
  createdAt: string;
  fingerprint: string;
}

export interface IExternalAccount {
  id: string;
  sub: string;
  label?: string;
  rest_info?: string | IMTLSProps;
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
  id: number;
  blocked: boolean;
  deleted?: string;
}

export interface IUserProfile extends IPrivateClaims {
  id?: string;
  login?: string;
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
  ExternalAccount?: IExternalAccount[];
  Role?: IRole[];
  deleted?: string | null;
  email_public?: string | null;
  email_verified?: boolean;
  phone_number_verified?: boolean | null;
  profile_privacy?: boolean;
}

export interface IUserProfileWithPassword extends IUserProfile {
  password?: string;
}

export interface IScope {
  id: number;
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
      providesTags: [ETags.User, ETags.Organization],
    }),

    updateUser: builder.mutation<
      void,
      { userId: string; body: Partial<IUserProfile> }
    >({
      // field avatar do not put body
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      query: ({ userId, body: { picture, ...body } }) =>
        createFetchArgsWithBody(`${endPoints.users}/${userId}`, "PUT", body),
      invalidatesTags: [ETags.User, ETags.ClientUser],
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
      responseListItems<IScope[]>,
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
      query: ({ userId, clientId }) =>
        createFetchArgs<{ client_id: string }>(
          `${endPoints.users}/${userId}/scopes`,
          "DELETE",
          {
            client_id: clientId,
          }
        ),
      invalidatesTags: [ETags.Scopes],
    }),

    getUserRoles: builder.query<IRoleClients[], TQueryId>({
      query: ({ id }) => `${endPoints.users}/${id}/roles`,
      providesTags: [ETags.Organization],
    }),

    deleteUser: builder.mutation<void, { id: string; password?: string }>({
      query: ({ id, ...body }) =>
        createFetchArgsWithBody(`${endPoints.users}/${id}`, "DELETE", body),
    }),

    blockUser: builder.mutation<void, TQueryId>({
      query: ({ id }) =>
        createFetchArgs(`${endPoints.users}/${id}/block`, "PUT"),
    }),

    unblockUser: builder.mutation<void, TQueryId>({
      query: ({ id }) =>
        createFetchArgs(`${endPoints.users}/${id}/unblock`, "PUT"),
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

    deleteUsers: builder.mutation<{ errors: string[] }, { checked_id: number }>(
      {
        query: ({ checked_id }) =>
          createFetchArgs(`${endPoints.users}/${checked_id}`, "DELETE"),
      }
    ),

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
      query: ({ userId, clientId }) =>
        createFetchArgs<{ client_id: string }>(
          `${endPoints.users}/${userId}/favorite_clients`,
          "POST",
          {
            client_id: clientId,
          }
        ),
      invalidatesTags: [ETags.Catalog],
    }),

    deleteFavoriteClient: builder.mutation({
      query: (params: IQueryIdProps) =>
        createFetchArgs<{ client_id: string }>(
          `${endPoints.users}/${params.userId}/favorite_clients`,
          "DELETE",
          {
            client_id: params.clientId,
          }
        ),
      invalidatesTags: [ETags.Catalog],
    }),

    restoreProfile: builder.mutation<void, TQueryId>({
      query: ({ id }) =>
        createFetchArgs(`${endPoints.users}/${id}/restore`, "PUT"),
    }),

    deleteExternalAccount: builder.mutation<
      void,
      { userId: number; accountId: string }
    >({
      query: ({ userId, accountId }) =>
        createFetchArgs(
          `${endPoints.users}/${userId}/external_accounts/${accountId}`,
          "DELETE"
        ),
      invalidatesTags: [ETags.ExternalAccounts, ETags.PublicExternalAccounts],
    }),
    getPublicExternalAccounts: builder.query<
      IExternalAccount[],
      { client_id: string; user_id: string }
    >({
      query: ({ user_id }) => ({
        url: `${endPoints.users}/public_external_accounts`,
        params: { user_id },
      }),
      providesTags: [ETags.PublicExternalAccounts],
    }),
    getPrivateClaims: builder.query<IPrivateClaims, string>({
      query: (user_id) => `${endPoints.users}/${user_id}/private_scopes`,
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
        id: number;
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
  useLazyGetUserScopesQuery,
  useRevokeScopesMutation,
  useGetUserRolesQuery,
  useDeleteUserMutation,
  useBlockUserMutation,
  useUnblockUserMutation,
  useCreateUserMutation,
  useCreateClientUserMutation,
  useDeleteUsersMutation,
  useChangePasswordMutation,
  useAddFavoriteClientMutation,
  useDeleteFavoriteClientMutation,
  useDeleteExternalAccountMutation,
  useRestoreProfileMutation,
  useGetPrivateClaimsQuery,
  useChangeClaimPrivacyMutation,
  useChangeExternalAccountMutation,
  useUpdatePictureMutation,
  useLazyDeleteAllSessionQuery,
} = usersApi;
