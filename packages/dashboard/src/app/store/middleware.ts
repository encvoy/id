import {
  isRejectedWithValue,
  Middleware,
  MiddlewareAPI,
} from "@reduxjs/toolkit";
import { ENoticeType } from "src/shared/utils/enums";
import { setNotice } from "src/shared/lib/noticesSlice";

export const rtkQueryErrorLogger: Middleware =
  (api: MiddlewareAPI) => (next) => (action) => {
    if (isRejectedWithValue(action)) {
      const payload = action.payload as {
        data: { statusCode: number; message: string; details: string };
      };
      if (payload.data.statusCode !== 403) {
        api.dispatch(
          setNotice({
            type: ENoticeType.error,
            message:
              payload.data.message +
              (payload.data?.details ? ": " + payload.data?.details : ""),
            ...(payload.data.statusCode === 404 && {
              message: `Not Found url:: ${payload.data?.message}`,
            }),
            ...(payload.data.message === "code.still.active" && {
              message: `Previous code is still active`,
            }),
          })
        );
      }
    }

    return next(action);
  };
