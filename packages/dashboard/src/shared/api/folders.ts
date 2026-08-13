import { FetchBaseQueryMeta } from "@reduxjs/toolkit/query/react";
import { ETags, endPoints } from "src/shared/utils/enums";
import { emptySplitApi } from "./baseApi";
import {
  createFetchArgs,
  createFetchArgsWithBody,
  parseResponse,
} from "./helpers";
import { IQueryIdProps, IQuerySortParams, IResponseListItems } from "./types";
import { IUserProfileWithPassword } from "./users";
import { IRbacGroup, IRbacUser } from "./rbac";

export interface IFolder {
  id: string;
  client_id?: string;
  name: string;
  description?: string;
  parent_id?: string | null;
  parent?: {
    id: string;
    name: string;
  };
  childrenCount?: number;
  usersCount?: number;
  groupsCount?: number;
}

export interface IGetFoldersParams extends IQuerySortParams {
  client_id: string;
  folder_id?: string | null;
}

export interface ICreateFolderMutationArgs {
  client_id: string;
  body: Omit<IFolder, "id">;
}

export interface IUpdateFolderMutationArgs extends IQueryIdProps {
  body: Omit<IFolder, "id">;
}

export interface IMoveFolderMutationArgs extends IQueryIdProps {
  body: {
    parent_id?: string;
    group_id?: string;
    user_id?: string;
  };
}

export interface ICreateUserToFolderMutationArgs extends IQueryIdProps {
  body: IUserProfileWithPassword;
}

const getFoldersBasePath = (client_id: string) =>
  `${endPoints.clients}/${client_id}/${endPoints.folders}`;

export const foldersApi = emptySplitApi.injectEndpoints({
  endpoints: (builder) => ({
    createFolder: builder.mutation<IFolder, ICreateFolderMutationArgs>({
      query: ({ client_id, body }) =>
        createFetchArgsWithBody(getFoldersBasePath(client_id), "POST", body),
      invalidatesTags: [ETags.Folder],
    }),
    getFolders: builder.query<IResponseListItems<IFolder[]>, IGetFoldersParams>(
      {
        query: ({ client_id, ...query }) =>
          createFetchArgs(getFoldersBasePath(client_id), "GET", query),
        transformResponse: (items: IFolder[], meta: FetchBaseQueryMeta) =>
          parseResponse<IFolder[]>(items, meta),
        providesTags: [ETags.Folders],
      }
    ),
    getFolderById: builder.query<IFolder, IQueryIdProps>({
      query: ({ client_id, id }) => `${getFoldersBasePath(client_id)}/${id}`,
      providesTags: [ETags.Folder],
    }),
    getFolderUsers: builder.query<
      IResponseListItems<IRbacUser[]>,
      IQuerySortParams & IQueryIdProps
    >({
      query: ({ client_id, id, ...params }) =>
        createFetchArgs(`${getFoldersBasePath(client_id)}/${id}/users`, "GET", {
          ...params,
        }),
      transformResponse: (items: IRbacUser[], meta: FetchBaseQueryMeta) =>
        parseResponse<IRbacUser[]>(items, meta),
    }),
    getFolderGroups: builder.query<
      IResponseListItems<IRbacGroup[]>,
      IQuerySortParams & IQueryIdProps
    >({
      query: ({ client_id, id, ...params }) =>
        createFetchArgs(
          `${getFoldersBasePath(client_id)}/${id}/groups`,
          "GET",
          {
            ...params,
          }
        ),
      transformResponse: (items: IRbacGroup[], meta: FetchBaseQueryMeta) =>
        parseResponse<IRbacGroup[]>(items, meta),
    }),
    updateFolder: builder.mutation<IFolder, IUpdateFolderMutationArgs>({
      query: ({ client_id, id, body }) =>
        createFetchArgsWithBody(
          `${getFoldersBasePath(client_id)}/${id}`,
          "PUT",
          body
        ),
      invalidatesTags: [ETags.Folder],
    }),
    moveWithinFolder: builder.mutation<IFolder, IMoveFolderMutationArgs>({
      query: ({ client_id, id, body }) =>
        createFetchArgsWithBody(
          `${getFoldersBasePath(client_id)}/${id}/move`,
          "PUT",
          body
        ),
      invalidatesTags: [ETags.Folder],
    }),
    deleteFolder: builder.mutation<{ message: string }, IQueryIdProps>({
      query: ({ client_id, id }) =>
        createFetchArgs(`${getFoldersBasePath(client_id)}/${id}`, "DELETE"),
      invalidatesTags: [ETags.Folder],
    }),
    createUserToFolder: builder.mutation<
      IRbacUser,
      ICreateUserToFolderMutationArgs
    >({
      query: ({ client_id, body, id }) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { picture, ...bodyWithoutPicture } = body;
        return createFetchArgsWithBody(
          `${getFoldersBasePath(client_id)}/${id}/users`,
          "POST",
          bodyWithoutPicture
        );
      },
    }),
  }),
});

export const {
  useCreateFolderMutation,
  useGetFoldersQuery,
  useGetFolderByIdQuery,
  useLazyGetFoldersQuery,
  useLazyGetFolderByIdQuery,
  useLazyGetFolderUsersQuery,
  useLazyGetFolderGroupsQuery,
  useUpdateFolderMutation,
  useMoveWithinFolderMutation,
  useDeleteFolderMutation,
  useCreateUserToFolderMutation,
} = foldersApi;
