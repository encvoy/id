import { Response } from "express";

export const addRefreshToken = (res: Response, refreshToken?: string) => {
  if (refreshToken) {
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/auth",
    });
  }
};
