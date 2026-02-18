import { ETags, endPoints } from "src/shared/utils/enums";
import { createFetchArgs, createFetchArgsWithBody } from "./helpers";
import { emptySplitApi } from "./baseApi";
import { IExternalAccount, IUserProfile } from "./users";
import { TCustomFields } from "../lib/userSlice";
import { ERoles } from "src/shared/utils/enums";
import { TFileString } from "src/shared/api/types";

export interface IUpdateContact {
  identifier: string;
  code: string;
}

export interface ISettingsUser {
  profile_privacy: boolean;
  [key: string]: boolean | string | number | undefined;
}

export interface IPublicProfile extends IUserProfile {
  [key: string]:
    | string
    | undefined
    | boolean
    | number
    | number[]
    | null
    | TCustomFields
    | { client_id: string; role: ERoles }[]
    | IExternalAccount[]
    | TFileString;
}

export const profileApi = emptySplitApi.injectEndpoints({
  endpoints: (builder) => ({
    getExternalAccounts: builder.query<IExternalAccount[], string>({
      query: () => `${endPoints.profile}/external_accounts`,
      providesTags: [ETags.ExternalAccounts],
    }),
    changeEmail: builder.mutation<void, IUpdateContact>({
      query: ({ identifier, code }) =>
        createFetchArgsWithBody(`${endPoints.profile}/email`, "PUT", {
          code,
          email: identifier,
        }),
      invalidatesTags: [ETags.User],
    }),
    addPhone: builder.mutation<void, IUpdateContact>({
      query: ({ identifier, code }) =>
        createFetchArgsWithBody(`${endPoints.profile}/phone_number`, "PUT", {
          code,
          phone_number: identifier,
        }),
      invalidatesTags: [ETags.User],
    }),
    bindEthereumAccount: builder.mutation<
      { success: boolean; nickname?: string; binded_to_this_user: boolean },
      {
        userId: string;
        address: string;
        signature: string;
        rebind?: boolean;
        client_id: string;
      }
    >({
      query: (body) =>
        createFetchArgsWithBody(
          `${endPoints.profile}/external_accounts?type=ETHEREUM`,
          "POST",
          body
        ),
      invalidatesTags: [ETags.ExternalAccounts, ETags.Claims],
    }),
    bindKloudAccount: builder.mutation<
      void,
      { userId: string; issuer: string; code: string; rebind?: boolean }
    >({
      query: (body) =>
        createFetchArgsWithBody(
          `${endPoints.profile}/external_accounts?type=KLOUD`,
          "POST",
          body
        ),
      invalidatesTags: [ETags.ExternalAccounts, ETags.Claims],
    }),
    getPublicProfile: builder.query<IPublicProfile, string>({
      query: (email) => createFetchArgs(endPoints.profile, "GET", { email }),
    }),
    getVCard: builder.query<Blob, string>({
      query: (email) => ({
        ...createFetchArgs(`${endPoints.profile}/vcard`, "GET", { email }),
        // ensure fetchBaseQuery returns raw blob for vCard download
        // TS: cast to any because FetchArgs.responseHandler typing may differ
        responseHandler: "blob" as unknown as any,
      }),
    }),
    getSettingsUser: builder.query<ISettingsUser, void>({
      query: () => `${endPoints.profile}/settings`,
      providesTags: [ETags.User],
    }),
    setSettingsUser: builder.mutation<void, Partial<ISettingsUser>>({
      query: (settings) =>
        createFetchArgsWithBody(`${endPoints.profile}/settings`, "PUT", {
          profile_privacy: settings.profile_privacy,
        }),
      invalidatesTags: [ETags.User],
    }),
  }),
});

export const {
  useGetExternalAccountsQuery,
  useChangeEmailMutation,
  useAddPhoneMutation,
  useBindEthereumAccountMutation,
  useLazyGetPublicProfileQuery,
  useLazyGetVCardQuery,
  useGetSettingsUserQuery,
  useSetSettingsUserMutation,
} = profileApi;
