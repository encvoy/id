import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ERoles } from "../utils/enums";
import { IRoleClients, IUserProfile } from "../api/users";

export type TCustomFields = { [key: string]: File | string | null };

export type TUserSlice = {
  isAuthorized: boolean | null;
  profile: IUserProfile;
  roleInApp?: ERoles;
  orgId?: string;
  roles?: IRoleClients[];
};

const initialState: TUserSlice = {
  isAuthorized: null,
  profile: {},
  roleInApp: undefined,
  orgId: undefined,
  roles: undefined,
};

const userSlice = createSlice({
  name: "userSlice",
  initialState,
  reducers: {
    setIsAuthorized(state, action: PayloadAction<TUserSlice["isAuthorized"]>) {
      state.isAuthorized = action.payload;
    },

    setUserProfile(state, action: PayloadAction<TUserSlice["profile"]>) {
      state.profile = { ...state.profile, ...action.payload };
    },

    setUserRoleInApp(state, action: PayloadAction<TUserSlice["roleInApp"]>) {
      state.roleInApp = action.payload;
    },

    setUserOrgId(state, action: PayloadAction<TUserSlice["orgId"]>) {
      state.orgId = action.payload;
    },

    setUserRoles(state, action: PayloadAction<TUserSlice["roles"]>) {
      state.roles = action.payload;
    },
  },
});

export const {
  setIsAuthorized,
  setUserProfile,
  setUserRoleInApp,
  setUserOrgId,
  setUserRoles,
} = userSlice.actions;
export default userSlice.reducer;
