import { emptySplitApi } from "./baseApi";
import { createFetchArgs, createFetchArgsWithBody } from "./helpers";
import { ETags, endPoints } from "src/shared/utils/enums";
import { TLocalizedText } from "src/shared/utils/locales";

export type TNotificationLocalizedText = TLocalizedText | string;

export enum NotificationTargetType {
  ALL = "ALL",
  NEW_USERS = "NEW_USERS",
  EXISTING_USERS = "EXISTING_USERS",
  USER_LIST = "USER_LIST",
}

export interface INotification {
  id: string;
  created_at: string;
  updated_at: string;
  title: TNotificationLocalizedText;
  content: TNotificationLocalizedText;
  is_active: boolean;
  target: NotificationTargetType;
  user_ids: string[];
  client_id?: string | null;
}

export interface INotificationListItem extends INotification {
  read_count: number;
  total_target: number;
}

export interface INotificationStats {
  notification_id: string;
  read_count: number;
  total_target: number;
}

export interface ICreateNotificationPayload {
  title: TNotificationLocalizedText;
  content: TNotificationLocalizedText;
  target: NotificationTargetType;
  user_ids?: string[];
  is_active?: boolean;
}

type TNotificationScope = {
  clientId: string;
};

type TNotificationMutationScope = TNotificationScope & {
  id: string;
};

const getNotificationsEndpoint = (clientId: string) =>
  `${endPoints.clients}/${clientId}/${endPoints.notifications}`;

export const notificationsApi = emptySplitApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<INotificationListItem[], TNotificationScope>({
      query: (scope) =>
        createFetchArgs(getNotificationsEndpoint(scope.clientId), "GET"),
      providesTags: [ETags.Notifications],
    }),

    createNotification: builder.mutation<
      INotification,
      { body: ICreateNotificationPayload } & TNotificationScope
    >({
      query: ({ body, clientId }) =>
        createFetchArgsWithBody(
          getNotificationsEndpoint(clientId),
          "POST",
          body
        ),
      invalidatesTags: [ETags.Notifications],
    }),

    updateNotification: builder.mutation<
      INotification,
      { body: Partial<ICreateNotificationPayload> } & TNotificationMutationScope
    >({
      query: ({ id, body, clientId }) =>
        createFetchArgsWithBody(
          `${getNotificationsEndpoint(clientId)}/${id}`,
          "PUT",
          body
        ),
      invalidatesTags: [ETags.Notifications],
    }),

    deleteNotification: builder.mutation<void, TNotificationMutationScope>({
      query: ({ id, clientId }) =>
        createFetchArgs(
          `${getNotificationsEndpoint(clientId)}/${id}`,
          "DELETE"
        ),
      invalidatesTags: [ETags.Notifications],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useCreateNotificationMutation,
  useUpdateNotificationMutation,
  useDeleteNotificationMutation,
} = notificationsApi;
