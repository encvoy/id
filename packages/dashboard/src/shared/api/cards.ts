import { endPoints, ETags } from "src/shared/utils/enums";
import { createFetchArgs, createFetchArgsWithBody } from "./helpers";
import { emptySplitApi } from "./baseApi";

export interface ICards {
  card_active: boolean;
  card_url: string;
}

export const cardsApi = emptySplitApi.injectEndpoints({
  endpoints: (builder) => ({
    getCard: builder.query<ICards, string>({
      query: (userId) => `${endPoints.users}/${userId}/cards`,
      providesTags: [ETags.UserCards],
    }),
    updateCard: builder.mutation<
      void,
      { userId: string; data: Partial<ICards> }
    >({
      query: ({ userId, data }) =>
        createFetchArgsWithBody(
          `${endPoints.users}/${userId}/cards`,
          "PUT",
          data
        ),
      invalidatesTags: [ETags.UserCards],
    }),
    getCardsEnabled: builder.query<boolean, void>({
      query: () => `${endPoints.settings}/cards`,
      providesTags: [ETags.Cards],
    }),
    updateCardsEnabled: builder.mutation<void, boolean>({
      query: (enabled) =>
        createFetchArgs(
          `${endPoints.settings}/cards?enabled=${enabled}`,
          "PUT"
        ),
      invalidatesTags: [ETags.Cards],
    }),
  }),
});

export const {
  useGetCardQuery,
  useUpdateCardsEnabledMutation,
  useGetCardsEnabledQuery,
  useUpdateCardMutation,
} = cardsApi;
