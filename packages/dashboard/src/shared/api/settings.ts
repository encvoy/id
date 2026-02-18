import { ProviderType } from "./provider";
import { emptySplitApi } from "./baseApi";
import {
  EClaimPrivacy,
  EEmailAction,
  endPoints,
  ETags,
} from "src/shared/utils/enums";
import { createFetchArgs, createFetchArgsWithBody } from "./helpers";

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
  title: string;
  error: string;
  regex: string;
}

export interface IRuleValidation extends IRuleValidationData {
  id: number;
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
  title: string;
  validations: IRuleValidation[];
}

export interface IProfileField {
  type: "general" | "custom";
  field: string;
  title: string;
  default?: string;
  required: boolean;
  unique: boolean;
  active: boolean;
  editable: boolean;
  claim: EClaimPrivacy;
  mapping_vcard?: string;
  allowed_as_login?: boolean;
}

export interface ICreateClientType {
  name: string;
}

export interface IClientType extends ICreateClientType {
  id: string;
  name: string;
}

export interface IProviderRule {
  type: ProviderType;
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

export interface ISettings {
  registration_policy: string;
  ignore_required_fields_for_clients: boolean;
  authorize_only_admins: boolean;
  auto_merge_users: boolean;
  prohibit_identifier_binding: boolean;
  default_public_profile_claims_oauth: string;
  default_public_profile_claims_gravatar: string;
  allowed_login_fields: string;
  sentry: TSentry;
  data_processing_agreement: string | null;
  two_factor_authentication: {
    controlled_methods: string[];
    available_provider_ids: number[];
  };
  i18n: {
    default_language: string;
  };
}

export interface IEmailTemplate {
  id: string;
  action: EEmailAction;
  title: string;
  content: string;
  subject: string;
  locale: string;
}

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

    getRules: builder.query<IRuleWithValidation[], void>({
      query: () => `${endPoints.settings}/rules`,
      providesTags: [ETags.Rules],
    }),

    getProfileFields: builder.query<IProfileField[], void>({
      query: () => `${endPoints.settings}/profile_fields`,
      providesTags: [ETags.ProfileFields],
    }),

    createProfileField: builder.mutation<void, IProfileField>({
      query: (body) =>
        createFetchArgsWithBody(
          `${endPoints.settings}/profile_fields`,
          "POST",
          body
        ),
      invalidatesTags: [ETags.ProfileFields],
    }),

    updateProfileField: builder.mutation<
      void,
      { field_name: string; body: Partial<IProfileField> }
    >({
      query: ({ field_name, body }) =>
        createFetchArgsWithBody(
          `${endPoints.settings}/profile_fields/${field_name}`,
          "PUT",
          body
        ),
      invalidatesTags: [ETags.ProfileFields, ETags.Settings],
    }),

    deleteProfileField: builder.mutation<void, string>({
      query: (field_name) =>
        createFetchArgs(
          `${endPoints.settings}/profile_fields/${field_name}`,
          "DELETE"
        ),
      invalidatesTags: [ETags.ProfileFields],
    }),

    getRuleValidations: builder.query<IRuleValidation[], void>({
      query: () => `${endPoints.settings}/rules_validations`,
      providesTags: [ETags.Rules],
    }),

    getRuleValidationsByFieldName: builder.query<IRuleValidation[], string>({
      query: (field_name) =>
        `${endPoints.settings}/rules_validations/${field_name}`,
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

    getEmailTemplates: builder.query<IEmailTemplate[], void>({
      query: () => `${endPoints.settings}/email_templates`,
      providesTags: [ETags.EmailTemplates],
    }),

    updateEmailTemplates: builder.mutation<
      void,
      { action: string; body: Partial<IEmailTemplate> }
    >({
      query: ({ action, body }) =>
        createFetchArgsWithBody(
          `${endPoints.settings}/email_templates/${action}`,
          "PUT",
          body
        ),
      invalidatesTags: [ETags.EmailTemplates],
    }),

    deleteClientType: builder.mutation<void, string>({
      query: (id) =>
        createFetchArgs(`${endPoints.settings}/client_types/${id}`, "DELETE"),
      invalidatesTags: [ETags.ClientTypes],
    }),

    deleteRuleValidation: builder.mutation<void, number>({
      query: (id) =>
        createFetchArgs(
          `${endPoints.settings}/rules_validations/${id}`,
          "DELETE"
        ),
      invalidatesTags: [ETags.Rules],
    }),

    createRuleValidation: builder.mutation<void, IRuleValidationData>({
      query: (body) =>
        createFetchArgsWithBody(
          `${endPoints.settings}/rules_validations`,
          "POST",
          body
        ),
      invalidatesTags: [ETags.Rules],
    }),

    updateRuleValidation: builder.mutation<
      void,
      { id: number; body: IRuleValidationData }
    >({
      query: ({ id, body }) =>
        createFetchArgsWithBody(
          `${endPoints.settings}/rules_validations/${id}`,
          "PUT",
          body
        ),
      invalidatesTags: [ETags.Rules],
    }),

    addRuleValidationToRule: builder.mutation<
      void,
      { field_name: string; id: number }
    >({
      query: ({ field_name, id }) =>
        createFetchArgs(
          `${endPoints.settings}/rules/${field_name}/rules_validations/${id}`,
          "POST"
        ),
      invalidatesTags: [ETags.Rules],
    }),

    removeRuleValidationFromRule: builder.mutation<
      void,
      { field_name: string; id: number }
    >({
      query: ({ field_name, id }) =>
        createFetchArgs(
          `${endPoints.settings}/rules/${field_name}/rules_validations/${id}`,
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
  useGetEmailTemplatesQuery,
  useUpdateEmailTemplatesMutation,
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
  useGetRuleValidationsQuery,
  useGetRuleValidationsByFieldNameQuery,
  useDeleteRuleValidationMutation,
  useCreateRuleValidationMutation,
  useUpdateRuleValidationMutation,
  useAddRuleValidationToRuleMutation,
  useRemoveRuleValidationFromRuleMutation,
} = settingsApi;
