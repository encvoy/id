import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FormState {
  login: string;
  password: string;
}

const initialState: FormState = {
  login: '',
  password: '',
};

export const formSlice = createSlice({
  name: 'form',
  initialState,
  reducers: {
    setLogin: (state, action: PayloadAction<string>) => {
      state.login = action.payload;
    },
    setPassword: (state, action: PayloadAction<string>) => {
      state.password = action.payload;
    },
    resetForm: (state) => {
      state.login = '';
      state.password = '';
    },
  },
});

export const { setLogin, setPassword, resetForm } = formSlice.actions;
export default formSlice.reducer;
