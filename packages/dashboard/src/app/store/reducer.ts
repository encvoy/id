import { combineReducers } from "@reduxjs/toolkit";
import appSlice from "../../shared/lib/appSlice";
import userSlice from "../../shared/lib/userSlice";
import noticesSlice from "../../shared/lib/noticesSlice";

export const reducer = combineReducers({
  user: userSlice,
  app: appSlice,
  notices: noticesSlice,
});

export type RootState = ReturnType<typeof reducer>;
