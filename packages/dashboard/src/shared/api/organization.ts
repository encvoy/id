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
  }),
});

export const { useCreateOrganizationMutation, useDeleteOrganizationMutation } =
  organizationApi;
