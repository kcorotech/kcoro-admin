import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { Auth_Status, CURRENT_APP_ID, EXPIRE_KEY } from "../../utils/Keys";
import type { UserRole } from "../../utils/enum";

export interface UserState {
  isAuthenticated: boolean;
  role: UserRole | null;
  currentAppId: string
}

const getInitialAuthState = (): boolean => {
  const isAuthenticated = localStorage.getItem(Auth_Status);
  const expiry = localStorage.getItem(EXPIRE_KEY);

  if (isAuthenticated !== "true" || !expiry) {
    return false;
  }

  const expiryTime = Number(expiry);

  // Session expired
  if (Date.now() >= expiryTime) {
    localStorage.removeItem(Auth_Status);
    localStorage.removeItem(EXPIRE_KEY);

    return false;
  }

  return true;
};

const initialState: UserState = {
  isAuthenticated: getInitialAuthState(),
  role: null,
  currentAppId:localStorage.getItem(CURRENT_APP_ID) || "myuog",
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    set_Is_Authenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
    set_User_Role: (state, action: PayloadAction<UserRole>) => {
      state.role = action.payload;
    },
    setCurrentApp: (state, action: PayloadAction<string>) => {
      state.currentAppId = action.payload;
    },
    logoutUser: (state) => {
      state.isAuthenticated = false;
      localStorage.removeItem(EXPIRE_KEY);
      localStorage.removeItem(Auth_Status);
      localStorage.clear();
    },
  },
});

// Action creators are generated for each case reducer function
export const { set_Is_Authenticated, set_User_Role, logoutUser, setCurrentApp } = userSlice.actions;

export default userSlice.reducer;
