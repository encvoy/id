import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ENoticeType } from "src/shared/utils/enums";

export type TNotice = {
  id: number;
  type: ENoticeType;
  isRead: boolean;
  message: string;
  timestamp: string;
};

export type TNoticesSlice = {
  notices: TNotice[];
};

const initialState: TNoticesSlice = {
  notices: [],
};

const createNotice = (type: ENoticeType, message: string): TNotice => ({
  id: Math.random(),
  type,
  isRead: false,
  timestamp: new Date().toString(),
  message,
});

const noticesSlice = createSlice({
  name: "noticesSlice",
  initialState,
  reducers: {
    setNotice(state, action: PayloadAction<Pick<TNotice, "type" | "message">>) {
      const notice: TNotice = {
        id: Math.random(),
        isRead: false,
        timestamp: new Date().toString(),
        ...action.payload,
      };
      state.notices = [notice, ...state.notices];
    },
    setNoticeInfo(state, action: PayloadAction<string>) {
      state.notices = [
        createNotice(ENoticeType.info, action.payload),
        ...state.notices,
      ];
    },
    setNoticeError(state, action: PayloadAction<string>) {
      state.notices = [
        createNotice(ENoticeType.error, action.payload),
        ...state.notices,
      ];
    },
    setNoticeWarning(state, action: PayloadAction<string>) {
      state.notices = [
        createNotice(ENoticeType.warning, action.payload),
        ...state.notices,
      ];
    },
    deleteNotice(state, action: PayloadAction<number>) {
      state.notices = state.notices.filter(
        (notices) => notices.id !== action.payload
      );
    },
    deleteAllNotices(state) {
      state.notices = [];
    },
    setIsReadNotice(state, action: PayloadAction<boolean>) {
      state.notices.forEach((notices) => (notices.isRead = action.payload));
    },
  },
});

export const {
  setNotice,
  setNoticeInfo,
  setNoticeError,
  setNoticeWarning,
  deleteNotice,
  deleteAllNotices,
  setIsReadNotice,
} = noticesSlice.actions;
export default noticesSlice.reducer;
