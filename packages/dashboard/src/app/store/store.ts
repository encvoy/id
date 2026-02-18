import { configureStore } from "@reduxjs/toolkit";
import appSlice from "../../shared/lib/appSlice";
import userSlice from "../../shared/lib/userSlice";
import noticesSlice from "../../shared/lib/noticesSlice";
import { setupListeners } from "@reduxjs/toolkit/query";
import { rtkQueryErrorLogger } from "src/app/store/middleware";
import { emptySplitApi } from "src/shared/api/baseApi";
import { ethereumApi } from "src/shared/api/ethereum";

export type RootState = ReturnType<typeof store.getState>;

export const store = configureStore({
  reducer: {
    user: userSlice,
    app: appSlice,
    notices: noticesSlice,
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

setupListeners(store.dispatch);
