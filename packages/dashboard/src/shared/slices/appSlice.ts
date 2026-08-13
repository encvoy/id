import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { routes } from "src/shared/utils/enums";
import { IShortClient } from "../api/clients";

export type TAppSlice = {
  clientProfile: IShortClient | undefined;
  systemClientId: string | null;
  isNotificationPanelOpen: boolean;
  isSnackbarOpen: boolean;
  isModalOpen: boolean;
  isChangesUnsaved: boolean;
  componentPath: string;
  currentTab: string;
  startRoutePath: string;
  selectedTheme: "dark" | "white";
};

const initialState: TAppSlice = {
  clientProfile: undefined,
  systemClientId: null,
  isNotificationPanelOpen: false,
  isSnackbarOpen: false,
  isModalOpen: false,
  isChangesUnsaved: false,
  componentPath: "",
  currentTab: routes.profile,
  startRoutePath: routes.system,
  selectedTheme: "white",
};

const appSlice = createSlice({
  name: "appSlice",
  initialState,
  reducers: {
    setClientProfile(state, action: PayloadAction<IShortClient | undefined>) {
      state.clientProfile = action.payload;
    },
    setSystemClientId(state, action: PayloadAction<string | null>) {
      state.systemClientId = action.payload;
    },
    setIsNotificationPanelOpen(state, action: PayloadAction<boolean>) {
      state.isNotificationPanelOpen = action.payload;
    },
    setIsSnackbarOpen(state, action: PayloadAction<boolean>) {
      state.isSnackbarOpen = action.payload;
    },
    setCurrentTab(state, { payload }: PayloadAction<TAppSlice["currentTab"]>) {
      state.currentTab = payload;
    },
    setStartRoutePath(
      state,
      { payload }: PayloadAction<TAppSlice["startRoutePath"]>
    ) {
      state.startRoutePath = payload;
    },
  },
});

export const {
  setClientProfile,
  setSystemClientId,
  setIsNotificationPanelOpen,
  setIsSnackbarOpen,
  setCurrentTab,
  setStartRoutePath,
} = appSlice.actions;
export default appSlice.reducer;
