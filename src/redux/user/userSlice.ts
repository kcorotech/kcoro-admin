import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface UserState {
  isAuthenticated: boolean;
}

const initialState: UserState = {
  isAuthenticated: false,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    set_Is_Authenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { set_Is_Authenticated } = userSlice.actions;

export default userSlice.reducer;
