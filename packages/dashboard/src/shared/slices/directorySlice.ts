import {
  Draft,
  createEntityAdapter,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";
import { IFolder } from "../api/folders";
import { IRbacGroup, IRbacUser } from "../api/rbac";

type SelectedEntityType = "folder" | "group" | "user";

export interface ISelectedEntity {
  type: SelectedEntityType;
  id: string;
}

export interface DirectoryDetailsNavigationItem {
  type: SelectedEntityType;
  id: string;
  label: string;
}

// This metadata describes only the current server-side list window, not the complete folder tree.
export interface FoldersWindowState {
  folderId: string | null;
  offset: number;
  totalCount: number;
  loadedCount: number;
}

const foldersAdapter = createEntityAdapter<IFolder>();
const groupsAdapter = createEntityAdapter<IRbacGroup>();
const usersAdapter = createEntityAdapter<IRbacUser>();

const createInitialFoldersWindow = (): FoldersWindowState => ({
  folderId: null,
  offset: 0,
  totalCount: 0,
  loadedCount: 0,
});

export type TDirectorySlice = {
  clientId: string | null;
  folders: ReturnType<typeof foldersAdapter.getInitialState>;
  groups: ReturnType<typeof groupsAdapter.getInitialState>;
  users: ReturnType<typeof usersAdapter.getInitialState>;
  foldersWindow: FoldersWindowState;
  folderNavigation: IFolder[];
  detailsNavigation: DirectoryDetailsNavigationItem[];
  activeFolderId: string | null;
  currentUserId: string | null;
  viewedUserId: string | null;
  passwordUserId: string | null;
  selectedEntity: ISelectedEntity | null;
  selectedFolderSnapshot: IFolder | null;
};

const initialState: TDirectorySlice = {
  clientId: null,
  folders: foldersAdapter.getInitialState(),
  groups: groupsAdapter.getInitialState(),
  users: usersAdapter.getInitialState(),
  foldersWindow: createInitialFoldersWindow(),
  folderNavigation: [],
  detailsNavigation: [],
  activeFolderId: null,
  currentUserId: null,
  viewedUserId: null,
  passwordUserId: null,
  selectedEntity: null,
  selectedFolderSnapshot: null,
};

const syncSelectedEntityWithDetailsNavigation = (
  state: Draft<TDirectorySlice>
) => {
  const lastItem = state.detailsNavigation[state.detailsNavigation.length - 1];
  state.selectedEntity = lastItem
    ? {
        type: lastItem.type,
        id: lastItem.id,
      }
    : null;
};

const directorySlice = createSlice({
  name: "directorySlice",
  initialState,
  reducers: {
    setDirectoryClientContext(state, action: PayloadAction<string | null>) {
      if (state.clientId === action.payload) {
        return;
      }

      return {
        ...initialState,
        clientId: action.payload,
      };
    },
    //DetailsNavigation
    setSelectedEntity(state, action: PayloadAction<ISelectedEntity | null>) {
      state.selectedEntity = action.payload;

      if (!action.payload) {
        state.detailsNavigation = [];
      }
    },
    setDetailsNavigation(
      state,
      action: PayloadAction<DirectoryDetailsNavigationItem[]>
    ) {
      state.detailsNavigation = action.payload;
    },
    truncateDetailsNavigation(state, action: PayloadAction<number>) {
      const index = action.payload;
      if (index < 0 || index >= state.detailsNavigation.length) {
        return;
      }

      state.detailsNavigation = state.detailsNavigation.slice(0, index + 1);
      syncSelectedEntityWithDetailsNavigation(state);
    },
    clearDetailsNavigation(state) {
      state.detailsNavigation = [];
    },
    //Folder
    replaceFoldersWindow(
      state,
      action: PayloadAction<{
        folderId: string | null;
        offset: number;
        totalCount: number;
        loadedCount: number;
        clientId?: string | null;
        items: IFolder[];
      }>
    ) {
      if (
        action.payload.clientId !== undefined &&
        state.clientId !== action.payload.clientId
      ) {
        return;
      }

      foldersAdapter.setAll(state.folders, action.payload.items);
      state.foldersWindow = {
        folderId: action.payload.folderId,
        offset: action.payload.offset,
        totalCount: action.payload.totalCount,
        loadedCount: action.payload.loadedCount,
      };
    },
    clearFoldersWindow(state) {
      foldersAdapter.removeAll(state.folders);
      state.foldersWindow = createInitialFoldersWindow();
    },
    setSelectedFolderSnapshot(state, action: PayloadAction<IFolder | null>) {
      state.selectedFolderSnapshot = action.payload;
    },
    updateFolder(
      state,
      action: PayloadAction<{
        folderId: string;
        changes: { name?: string; description?: string };
      }>
    ) {
      const { folderId, changes } = action.payload;
      const visibleFolder = state.folders.entities[folderId];

      if (visibleFolder) {
        if (changes.name !== undefined) {
          visibleFolder.name = changes.name;
        }

        if (changes.description !== undefined) {
          visibleFolder.description = changes.description;
        }
      }

      if (state.selectedFolderSnapshot?.id === folderId) {
        if (changes.name !== undefined) {
          state.selectedFolderSnapshot.name = changes.name;
        }

        if (changes.description !== undefined) {
          state.selectedFolderSnapshot.description = changes.description;
        }
      }
    },
    deleteFolder(
      state,
      action: PayloadAction<{
        folderId: string;
        parentFolderId?: string | null;
      }>
    ) {
      const { folderId } = action.payload;
      if (state.selectedFolderSnapshot?.id === folderId) {
        state.selectedFolderSnapshot = null;
      }

      if (
        state.selectedEntity?.type === "folder" &&
        state.selectedEntity.id === folderId
      ) {
        state.selectedEntity = null;
      }

      const detailsIndex = state.detailsNavigation.findIndex(
        (item) => item.type === "folder" && item.id === folderId
      );

      if (detailsIndex !== -1) {
        state.detailsNavigation = state.detailsNavigation.slice(
          0,
          detailsIndex
        );
        syncSelectedEntityWithDetailsNavigation(state);
      }
    },
    //Folder Navigation
    setActiveFolderId(state, action: PayloadAction<string | null>) {
      state.activeFolderId = action.payload;
    },
    pushFolderToNavigation(state, action: PayloadAction<IFolder>) {
      const lastFolder =
        state.folderNavigation[state.folderNavigation.length - 1];

      if (lastFolder?.id === action.payload.id) {
        return;
      }

      state.folderNavigation.push(action.payload);
    },
    clearFolderNavigation(state) {
      state.folderNavigation = [];
    },
    truncateFolderNavigation(state, action: PayloadAction<string>) {
      const folderIndex = state.folderNavigation.findIndex(
        (folder) => folder.id === action.payload
      );

      if (folderIndex === -1) {
        return;
      }

      state.folderNavigation = state.folderNavigation.slice(0, folderIndex + 1);
    },
    //Group
    addGroups(state, action: PayloadAction<IRbacGroup[]>) {
      groupsAdapter.setAll(state.groups, action.payload);
    },
    upsertGroup(state, action: PayloadAction<IRbacGroup>) {
      groupsAdapter.upsertOne(state.groups, action.payload);
    },
    deleteGroupFromFolder(state, action: PayloadAction<{ groupId: string }>) {
      const { groupId } = action.payload;
      const group = state.groups.entities[groupId];
      if (!group) return;
      groupsAdapter.removeOne(state.groups, groupId);
    },
    updateGroup(
      state,
      action: PayloadAction<{
        groupId: string;
        changes: { name?: string; description?: string };
      }>
    ) {
      const { groupId, changes } = action.payload;
      groupsAdapter.updateOne(state.groups, {
        id: groupId,
        changes,
      });
    },
    //User
    setCurrentUserId(state, action: PayloadAction<string | null>) {
      state.currentUserId = action.payload;
    },
    setViewedUserId(state, action: PayloadAction<string | null>) {
      state.viewedUserId = action.payload;
    },
    setPasswordUserId(state, action: PayloadAction<string | null>) {
      state.passwordUserId = action.payload;
    },
    addUsers(state, action: PayloadAction<IRbacUser[]>) {
      usersAdapter.setAll(state.users, action.payload);
    },
    updateUser(
      state,
      action: PayloadAction<{
        userId: string;
        changes: Partial<Omit<IRbacUser, "id">>;
      }>
    ) {
      const { userId, changes } = action.payload;
      usersAdapter.updateOne(state.users, {
        id: userId,
        changes,
      });
    },
  },
});

export const {
  setDirectoryClientContext,
  replaceFoldersWindow,
  clearFoldersWindow,
  setSelectedEntity,
  setSelectedFolderSnapshot,
  setDetailsNavigation,
  truncateDetailsNavigation,
  clearDetailsNavigation,
  setActiveFolderId,
  pushFolderToNavigation,
  clearFolderNavigation,
  truncateFolderNavigation,
  updateFolder,
  deleteFolder,
  addGroups,
  upsertGroup,
  updateGroup,
  deleteGroupFromFolder,
  setCurrentUserId,
  setViewedUserId,
  setPasswordUserId,
  addUsers,
  updateUser,
} = directorySlice.actions;

export default directorySlice.reducer;
