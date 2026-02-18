import { imagesToFormData } from "src/shared/utils/helpers";
import { emptySplitApi } from "./baseApi";
import { createFetchArgs, createFetchArgsWithBody } from "./helpers";
import { EClaimPrivacyNumber, endPoints, ETags } from "src/shared/utils/enums";
import { TFileString } from "src/shared/api/types";

export type TShortProvider = {
  id: number;
  type: string;
  name: string;
  avatar: string;
};

export type EditProviderParams = {
  external_client_id: string;
  external_client_secret: string;
  authorization_endpoint: string;
  token_endpoint: string;
  issuer: string;
  userinfo_endpoint: string;
  mapping: string;
  scopes: string;
  redirect_uri: string;
};

export type TOauthProvider = {
  id: string;
  name: string;
  type: ProviderType;
  description?: string;
  avatar: TFileString;
  is_active: boolean;
  is_public: boolean;
  scopes?: string;
  client_id: string;
  issuer: string;
  auto_registration: boolean;
  auth_without_email: boolean;
  password_required: boolean;
  token_endpoint: string;
  external_client_id: string;
  external_client_secret: string;
  authorization_endpoint: string;
  redirect_uri: string;
  userinfo_endpoint: string;
  mapping?: string;
  params: EditProviderParams;
  groupe: string;
  index: number;
};

export interface IProviderColors {
  button_color: string;
  font_color: string;
}

export interface IOauthParams {
  issuer: string;
  scopes: string;
  redirect_uri: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  external_client_id: string;
  authorization_endpoint: string;
  external_client_secret: string;
}

export interface IPhoneParams {
  issuer: string;
  external_client_id: string;
  external_client_secret: string;
}

export interface IKloudParams {
  issuer: string;
  external_client_id: string;
  external_client_secret: string;
}

export interface IMTLSParams {
  issuer: string;
}

export interface IEmailParams {
  mail_port: string;
  root_mail: string;
  mail_hostname: string;
  mail_password: string;
  mail_code_ttl_sec: string;
}

export interface IEmailCustomParams {
  mail_port: string;
  root_mail: string;
  mail_hostname: string;
  mail_password: string;
  mail_code_ttl_sec: string;
}

export interface ISmsParams {
  admin_login: string;
  admin_password: string;
}

export interface IOTPParams {
  secret?: string; // Base32 secret for generating OTP
  counter?: number; // Counter for HOTP (not used in TOTP)
  qr_code?: string; // Data URL QR code for setup
  digits?: number; // Number of digits in the code (6 or 8, default 6)
  period?: number; // Period for TOTP in seconds (default 30)
  algorithm?: string; // Hashing algorithm (SHA1, SHA256, SHA512)
}

export interface IProvider<
  T =
    | IOauthParams
    | IKloudParams
    | IEmailParams
    | IEmailCustomParams
    | IPhoneParams
    | ISmsParams
    | IOTPParams
    | IMTLSParams
> {
  id: string;
  client_id: string;
  type: string;
  is_public: boolean;
  is_active: boolean;
  name: string;
  description?: string;
  avatar: TFileString;
  password_required: boolean;
  params?: T;
  default_public?: EClaimPrivacyNumber;
  groupe: string;
  index: number;
}

export enum EGetProviderAction {
  auth = "auth",
  all = "all",
}

export enum ProviderType {
  GITHUB = "GITHUB",
  GOOGLE = "GOOGLE",
  CUSTOM = "CUSTOM",
  CREDENTIALS = "CREDENTIALS",
  EMAIL = "EMAIL",
  ETHEREUM = "ETHEREUM",
  KLOUD = "KLOUD",
  OAUTH = "Oauth2",
  PHONE = "PHONE",
  MTLS = "MTLS",
  WEBAUTHN = "WEBAUTHN",
  TOTP = "TOTP",
  HOTP = "HOTP",
  EMAIL_CUSTOM = "EMAIL_CUSTOM",
}

interface IQueryParamsProviders {
  action: EGetProviderAction;
  only_active?: boolean;
  is_public?: boolean;
  types?: string;
}

interface IProvidersProps {
  client_id: string;
  query: IQueryParamsProviders;
}

interface IQueryIdsProps {
  clientId: string;
  providerId: string;
}

interface IQueryActiveProps {
  clientId: string;
  providers: number[];
}

export const providerApi = emptySplitApi.injectEndpoints({
  endpoints: (builder) => ({
    getProviders: builder.query<IProvider[], IProvidersProps>({
      query: ({ client_id, query }) =>
        createFetchArgs<IQueryParamsProviders>(
          `${endPoints.clients}/${client_id}/${endPoints.providers}`,
          "GET",
          query
        ),
      providesTags: [ETags.Providers],
    }),

    createProvider: builder.mutation<
      { id: string },
      { body: IProvider; clientId: string }
    >({
      // field avatar do not put body
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      query: ({ body: { avatar, ...body }, clientId }) => {
        return {
          url: `${endPoints.clients}/${clientId}/${endPoints.providers}`,
          method: "POST",
          body,
        };
      },
      invalidatesTags: [ETags.Providers],
    }),

    updateAvatar: builder.mutation({
      query: ({
        avatar,
        providerId,
        clientId,
      }: {
        avatar: TFileString;
        providerId: string;
        clientId: string;
      }) => ({
        url: `${endPoints.clients}/${clientId}/${endPoints.providers}/${providerId}/avatar`,
        method: "PUT",
        body: imagesToFormData({ avatar }),
      }),
      invalidatesTags: [ETags.Providers],
    }),

    updateProvider: builder.mutation<void, Partial<IProvider>>({
      // field avatar, is_active do not put body
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      query: ({ id, client_id, avatar, is_active, ...body }) => {
        return {
          url: `${endPoints.clients}/${client_id}/${endPoints.providers}/${id}`,
          method: "PUT",
          body,
        };
      },
      invalidatesTags: [ETags.Providers],
    }),

    activateProviders: builder.mutation<void, IQueryActiveProps>({
      query: ({ clientId, providers }) =>
        createFetchArgsWithBody(
          `${endPoints.clients}/${clientId}/${endPoints.providers}/activate`,
          "PUT",
          { providers }
        ),
      invalidatesTags: [ETags.Providers],
    }),

    deactivateProviders: builder.mutation<void, IQueryActiveProps>({
      query: ({ clientId, providers }) =>
        createFetchArgsWithBody(
          `${endPoints.clients}/${clientId}/${endPoints.providers}/deactivate`,
          "PUT",
          { providers }
        ),
      invalidatesTags: [ETags.Providers],
    }),

    deleteProvider: builder.mutation<void, IQueryIdsProps>({
      query: ({ clientId, providerId }) =>
        createFetchArgs(
          `${endPoints.clients}/${clientId}/${endPoints.providers}/${providerId}`,
          "DELETE"
        ),
      invalidatesTags: [ETags.Providers],
    }),
  }),
});

export const {
  useGetProvidersQuery,
  useCreateProviderMutation,
  useActivateProvidersMutation,
  useDeactivateProvidersMutation,
  useDeleteProviderMutation,
  useUpdateProviderMutation,
  useUpdateAvatarMutation,
} = providerApi;
