import { configureStore } from "@reduxjs/toolkit";
import appSlice from "src/shared/slices/appSlice";
import userSlice from "src/shared/slices/userSlice";
import noticesSlice from "src/shared/slices/noticesSlice";
import directorySlice from "src/shared/slices/directorySlice";
import { setupListeners } from "@reduxjs/toolkit/query";
import { rtkQueryErrorLogger } from "src/app/store/middleware";
import { emptySplitApi } from "src/shared/api/baseApi";
import { ethereumApi } from "src/shared/api/ethereum";
import { useDispatch } from "react-redux";

export const store = configureStore({
  reducer: {
    user: userSlice,
    app: appSlice,
    notices: noticesSlice,
    directory: directorySlice,
    [emptySplitApi.reducerPath]: emptySplitApi.reducer,
    [ethereumApi.reducerPath]: ethereumApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      emptySplitApi.middleware,
      ethereumApi.middleware,
      rtkQueryErrorLogger
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();

setupListeners(store.dispatch);
