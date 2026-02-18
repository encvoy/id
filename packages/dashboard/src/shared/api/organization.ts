import { endPoints, ETags } from "../utils/enums";
import { emptySplitApi } from "./baseApi";
import { createFetchArgs } from "./helpers";

export const organizationApi = emptySplitApi.injectEndpoints({
  endpoints: (builder) => ({
    createOrganization: builder.mutation({
      query: () => createFetchArgs(`${endPoints.orgs}`, "POST"),
      invalidatesTags: [ETags.Organization],
    }),
    deleteOrganization: builder.mutation({
      query: () => createFetchArgs(`${endPoints.orgs}`, "DELETE"),
      invalidatesTags: [ETags.Organization],
    }),
    getOrgLkSelfConnectEnabled: builder.query<boolean, void>({
      query: () => `${endPoints.settings}/org-lk-self-connect`,
      providesTags: [ETags.OrgLkSelfConnect],
    }),
    updateOrgLkSelfConnectEnabled: builder.mutation<void, boolean>({
      query: (enabled) =>
        createFetchArgs(
          `${endPoints.settings}/org-lk-self-connect?enabled=${enabled}`,
          "PUT"
        ),
      invalidatesTags: [ETags.OrgLkSelfConnect],
    }),
  }),
});

export const {
  useCreateOrganizationMutation,
  useDeleteOrganizationMutation,
  useGetOrgLkSelfConnectEnabledQuery,
  useUpdateOrgLkSelfConnectEnabledMutation,
} = organizationApi;
