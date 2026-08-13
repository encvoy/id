import { combineReducers } from "@reduxjs/toolkit";
import appSlice from "src/shared/slices/appSlice";
import userSlice from "src/shared/slices/userSlice";
import noticesSlice from "src/shared/slices/noticesSlice";
import directorySlice from "src/shared/slices/directorySlice";

export const reducer = combineReducers({
  user: userSlice,
  app: appSlice,
  notices: noticesSlice,
  directory: directorySlice,
});

export type RootState = ReturnType<typeof reducer>;
