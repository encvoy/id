import { EProviderType } from "./provider";
import { emptySplitApi } from "./baseApi";
import { EClaimPrivacy, endPoints, ETags } from "src/shared/utils/enums";
import { createFetchArgs, createFetchArgsWithBody } from "./helpers";
import type { TLocalizedText } from "src/shared/utils/locales";

export type TSentry = {
  dsn: string;
  enabled: boolean;
  user_id: string;
};

export enum TargetType {
  user = "USER",
  client = "CLIENT",
  provider = "PROVIDER",
}

export interface IRuleValidationData {
  active: boolean;
  title: TLocalizedTextCompatible;
  error: TLocalizedTextCompatible;
  regex: string;
}

export interface IRuleValidation extends IRuleValidationData {
  id: string;
}

export interface IRuleValidationScope {
  client_id: string;
}

export interface IRuleValidationByFieldNameQuery extends IRuleValidationScope {
  field_name: string;
}

export interface IRuleWithValidation {
  default?: string;
  editable?: boolean;
  required?: boolean;
  unique?: boolean;
  active?: boolean;
  target?: TargetType;
  field_name: string;
  id: string;
  title: TLocalizedTextCompatible;
  validations: IRuleValidation[];
}

export interface IProfileField {
  type: "general" | "custom";
  field: string;
  id?: string;
  organization_id?: string | null;
  title: TLocalizedTextCompatible;
  default?: string;
  required: boolean;
  unique: boolean;
  active: boolean;
  editable: boolean;
  claim: EClaimPrivacy;
  mapping_vcard?: string;
  allowed_as_login?: boolean;
  validate_on_authorization?: boolean;
}

export type IProfileFieldScopeQuery = void | {
  client_id?: string;
  organization_id?: string;
};

export type IProfileFieldMutationScope = {
  client_id?: string;
  organization_id?: string | null;
};

export type ICreateProfileFieldPayload = Omit<
  IProfileField,
  "type" | "allowed_as_login"
> &
  IProfileFieldMutationScope;

export type TLocalizedTextCompatible = TLocalizedText | string;

export interface ICreateClientType {
  name: TLocalizedTextCompatible;
}

export interface IClientType extends ICreateClientType {
  id: string;
}

export interface IProviderRule {
  type: EProviderType;
  allowedScopes: ProviderScope[];
  unique: boolean;
  editable: boolean;
  requireable: boolean;
  deletable: boolean;
  title: string;
}

export enum ProviderScope {
  login = "login",
  trusted = "trusted",
  otp = "otp",
  internal = "internal",
}

export type TOidcScopeText = string | Record<string, string>;

export interface IOidcScopeField {
  profile_field_id: string;
  field: string;
  title: TLocalizedTextCompatible;
  active: boolean;
  claim_name: string;
  order: number;
}

export interface IOidcScopeGroup {
  id: string;
  organization_id: string;
  name: string;
  icon?: string | null;
  title: TOidcScopeText;
  description?: TOidcScopeText | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  fields: IOidcScopeField[];
}

export interface IOidcScopePayload {
  client_id: string;
  name: string;
  icon?: string | null;
  title: TLocalizedTextCompatible;
  description?: TLocalizedTextCompatible | null;
  active?: boolean;
  fields?: string[];
}

export interface IOidcScopeFieldPayload {
  client_id: string;
  scope_id: string;
  profile_field_id: string;
  claim_name?: string | null;
}

export interface ISettings {
  registration_policy: string;
  ignore_required_fields_for_clients: boolean;
  authorize_only_admins: boolean;
  auto_merge_users: boolean;
  prohibit_identifier_binding: boolean;
  allowed_login_fields: string;
  copyright?: Record<string, string>;
  manual_url?: string;
  prohibit_restore_deleted_users: boolean;
  delete_profile_after_days: number;
  log_retention_days: number;
  sentry: TSentry;
  data_processing_agreement: string | null;
  two_factor_authentication: {
    controlled_methods: string[];
    available_provider_ids: string[];
  };
  i18n: {
    default_language: string;
  };
  system_style: string;
  theme_light: string;
  theme_dark: string;
}

const getClientSettingsPath = (clientId: string) =>
  `${endPoints.clients}/${clientId}/${endPoints.settings}`;

export const settingsApi = emptySplitApi.injectEndpoints({
  endpoints: (builder) => ({
    getSettings: builder.query<ISettings, void>({
      query: () => endPoints.settings,
      providesTags: [ETags.Settings],
    }),

    editSettings: builder.mutation<ISettings, Partial<ISettings>>({
      query: (body) => createFetchArgsWithBody(endPoints.settings, "PUT", body),
      invalidatesTags: [ETags.Settings, ETags.ClientDetails],
    }),

    getRules: builder.query<IRuleWithValidation[], IProfileFieldScopeQuery>({
      query: (params) =>
        createFetchArgs(
          `${endPoints.settings}/rules`,
          "GET",
          params || undefined
        ),
      providesTags: [ETags.Rules],
    }),

    getProfileFields: builder.query<IProfileField[], IProfileFieldScopeQuery>({
      query: (params) =>
        createFetchArgs(
          `${endPoints.settings}/profile_fields`,
          "GET",
          params || undefined
        ),
      providesTags: [ETags.ProfileFields],
    }),

    createProfileField: builder.mutation<void, ICreateProfileFieldPayload>({
      query: (body) =>
        createFetchArgsWithBody(
          `${endPoints.settings}/profile_fields`,
          "POST",
          body
        ),
      invalidatesTags: [ETags.ProfileFields, ETags.OidcScopes],
    }),

    updateProfileField: builder.mutation<
      void,
      {
        field_name: string;
        body: Partial<IProfileField> & IProfileFieldMutationScope;
      }
    >({
      query: ({ field_name, body }) =>
        createFetchArgsWithBody(
          `${endPoints.settings}/profile_fields/${field_name}`,
          "PUT",
          body
        ),
      invalidatesTags: [ETags.ProfileFields, ETags.Settings, ETags.OidcScopes],
    }),

    deleteProfileField: builder.mutation<
      void,
      string | ({ field_name: string } & IProfileFieldMutationScope)
    >({
      query: (payload) => {
        const { field_name, ...params } =
          typeof payload === "string" ? { field_name: payload } : payload;

        return createFetchArgs(
          `${endPoints.settings}/profile_fields/${field_name}`,
          "DELETE",
          Object.keys(params).length ? params : undefined
        );
      },
      invalidatesTags: [ETags.ProfileFields, ETags.OidcScopes],
    }),

    getOidcScopes: builder.query<IOidcScopeGroup[], string>({
      query: (clientId) => `${endPoints.clients}/${clientId}/oidc/scopes`,
      providesTags: [ETags.OidcScopes],
    }),

    createOidcScope: builder.mutation<IOidcScopeGroup, IOidcScopePayload>({
      query: ({ client_id, ...body }) =>
        createFetchArgsWithBody(
          `${endPoints.clients}/${client_id}/oidc/scopes`,
          "POST",
          body
        ),
      invalidatesTags: [ETags.OidcScopes],
    }),

    updateOidcScope: builder.mutation<
      IOidcScopeGroup,
      IOidcScopePayload & { id: string }
    >({
      query: ({ client_id, id, ...body }) =>
        createFetchArgsWithBody(
          `${endPoints.clients}/${client_id}/oidc/scopes/${id}`,
          "PUT",
          body
        ),
      invalidatesTags: [ETags.OidcScopes],
    }),

    deleteOidcScope: builder.mutation<void, { client_id: string; id: string }>({
      query: ({ client_id, id }) =>
        createFetchArgs(
          `${endPoints.clients}/${client_id}/oidc/scopes/${id}`,
          "DELETE"
        ),
      invalidatesTags: [ETags.OidcScopes],
    }),

    bindOidcScopeField: builder.mutation<
      IOidcScopeGroup,
      IOidcScopeFieldPayload
    >({
      query: ({ client_id, scope_id, ...body }) =>
        createFetchArgsWithBody(
          `${endPoints.clients}/${client_id}/oidc/scopes/${scope_id}/fields`,
          "POST",
          body
        ),
      invalidatesTags: [ETags.OidcScopes],
    }),

    deleteOidcScopeField: builder.mutation<
      void,
      { client_id: string; scope_id: string; profile_field_id: string }
    >({
      query: ({ client_id, scope_id, profile_field_id }) =>
        createFetchArgs(
          `${endPoints.clients}/${client_id}/oidc/scopes/${scope_id}/fields/${profile_field_id}`,
          "DELETE"
        ),
      invalidatesTags: [ETags.OidcScopes],
    }),

    getRuleValidations: builder.query<IRuleValidation[], IRuleValidationScope>({
      query: ({ client_id }) =>
        `${getClientSettingsPath(client_id)}/rules_validations`,
      providesTags: [ETags.Rules],
    }),

    getRuleValidationsByFieldName: builder.query<
      IRuleValidation[],
      IRuleValidationByFieldNameQuery
    >({
      query: ({ client_id, field_name }) =>
        `${getClientSettingsPath(
          client_id
        )}/rules/${field_name}/rules_validations`,
      providesTags: [ETags.Rules],
    }),

    getClientTypes: builder.query<IClientType[], void>({
      query: () => `${endPoints.settings}/client_types`,
      providesTags: [ETags.ClientTypes],
    }),

    createClientType: builder.mutation<void, ICreateClientType>({
      query: (body) =>
        createFetchArgsWithBody(
          `${endPoints.settings}/client_types`,
          "POST",
          body
        ),
      invalidatesTags: [ETags.ClientTypes],
    }),

    updateClientType: builder.mutation<
      void,
      { id: string; body: ICreateClientType }
    >({
      query: ({ id, body }) =>
        createFetchArgsWithBody(
          `${endPoints.settings}/client_types/${id}`,
          "PUT",
          body
        ),
      invalidatesTags: [ETags.ClientTypes],
    }),

    deleteClientType: builder.mutation<void, string>({
      query: (id) =>
        createFetchArgs(`${endPoints.settings}/client_types/${id}`, "DELETE"),
      invalidatesTags: [ETags.ClientTypes],
    }),

    deleteRuleValidation: builder.mutation<
      void,
      IRuleValidationScope & { id: string }
    >({
      query: ({ client_id, id }) =>
        createFetchArgs(
          `${getClientSettingsPath(client_id)}/rules_validations/${id}`,
          "DELETE"
        ),
      invalidatesTags: [ETags.Rules],
    }),

    createRuleValidation: builder.mutation<
      void,
      IRuleValidationData & IRuleValidationScope
    >({
      query: ({ client_id, ...body }) =>
        createFetchArgsWithBody(
          `${getClientSettingsPath(client_id)}/rules_validations`,
          "POST",
          body
        ),
      invalidatesTags: [ETags.Rules],
    }),

    updateRuleValidation: builder.mutation<
      void,
      IRuleValidationScope & { id: string; body: Partial<IRuleValidationData> }
    >({
      query: ({ client_id, id, body }) =>
        createFetchArgsWithBody(
          `${getClientSettingsPath(client_id)}/rules_validations/${id}`,
          "PUT",
          body
        ),
      invalidatesTags: [ETags.Rules],
    }),

    addRuleValidationToRule: builder.mutation<
      void,
      IRuleValidationScope & { field_name: string; id: string }
    >({
      query: ({ client_id, field_name, id }) =>
        createFetchArgs(
          `${getClientSettingsPath(
            client_id
          )}/rules/${field_name}/rules_validations/${id}`,
          "POST"
        ),
      invalidatesTags: [ETags.Rules],
    }),

    removeRuleValidationFromRule: builder.mutation<
      void,
      IRuleValidationScope & { field_name: string; id: string }
    >({
      query: ({ client_id, field_name, id }) =>
        createFetchArgs(
          `${getClientSettingsPath(
            client_id
          )}/rules/${field_name}/rules_validations/${id}`,
          "DELETE"
        ),
      invalidatesTags: [ETags.Rules],
    }),

    getTypes: builder.query<IClientType[], void>({
      query: () => `${endPoints.settings}/client_types`,
    }),

    getCatalogEnabled: builder.query<boolean, void>({
      query: () => `${endPoints.settings}/catalog`,
      providesTags: [ETags.Catalog],
    }),
    updateCatalogEnabled: builder.mutation<void, boolean>({
      query: (enabled) =>
        createFetchArgs(
          `${endPoints.settings}/catalog?enabled=${enabled}`,
          "PUT"
        ),
      invalidatesTags: [ETags.Catalog],
    }),
  }),
});

export const {
  useGetCatalogEnabledQuery,
  useUpdateCatalogEnabledMutation,
  useGetClientTypesQuery,
  useCreateClientTypeMutation,
  useDeleteClientTypeMutation,
  useUpdateClientTypeMutation,
  useGetSettingsQuery,
  useEditSettingsMutation,
  useGetRulesQuery,
  useGetProfileFieldsQuery,
  useCreateProfileFieldMutation,
  useUpdateProfileFieldMutation,
  useDeleteProfileFieldMutation,
  useGetOidcScopesQuery,
  useCreateOidcScopeMutation,
  useUpdateOidcScopeMutation,
  useDeleteOidcScopeMutation,
  useBindOidcScopeFieldMutation,
  useDeleteOidcScopeFieldMutation,
  useGetRuleValidationsQuery,
  useGetRuleValidationsByFieldNameQuery,
  useDeleteRuleValidationMutation,
  useCreateRuleValidationMutation,
  useUpdateRuleValidationMutation,
  useAddRuleValidationToRuleMutation,
  useRemoveRuleValidationFromRuleMutation,
} = settingsApi;
