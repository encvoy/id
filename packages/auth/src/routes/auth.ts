import { Router, Request, Response } from "express";
import createError from "http-errors";
import { DOMAIN } from "../main";
import { addRefreshToken } from "../utils";

const router = Router();

router.post("/token", async (req: Request, res: Response) => {
  const params = new URLSearchParams(req.body as Record<string, string>);
  try {
    const response = await fetch(DOMAIN + "/oidc/token", {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(response.status.toString());
    }

    const responseData = (await response.json()) as any;
    const { refresh_token } = responseData;
    addRefreshToken(res, refresh_token);
    return res.status(response.status).json(responseData);
  } catch (error) {
    console.error("Error fetching token:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/me", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw createError(401, "Unauthorized");
  }

  const token = authHeader.substring(7);

  if (!token) {
    throw createError(401, "Unauthorized: token not found");
  }

  try {
    const response = await fetch(DOMAIN + "/oidc/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: response.body });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching user data:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/refresh", async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token not found" });
  }

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: req.body.client_id,
  });

  try {
    const response = await fetch(DOMAIN + "/oidc/token", {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(response.status.toString());
    }

    const responseData = (await response.json()) as any;
    const { refresh_token } = responseData;
    addRefreshToken(res, refresh_token);
    return res.status(response.status).json(responseData);
  } catch (error) {
    console.error("Error refreshing token:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
