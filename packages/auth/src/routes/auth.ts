import { Router, Request, Response } from "express";
import createError from "http-errors";
import { DOMAIN, getSystemClientId } from "../main";
import { addRefreshToken, REFRESH_TOKEN_COOKIE } from "../utils";

const router = Router();

router.get("/config", async (_req: Request, res: Response) => {
  const systemClientId = await getSystemClientId();
  if (!systemClientId) {
    return res.status(500).json({ error: "System client id is not available" });
  }

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ system_client_id: systemClientId });
});

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
      const responseText = await response.text();
      return res
        .status(response.status)
        .json({ error: responseText || "Token exchange failed" });
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
  const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];

  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token not found" });
  }

  const requestedClientId =
    typeof req.body?.client_id === "string" ? req.body.client_id.trim() : "";
  const systemClientId = requestedClientId ? "" : await getSystemClientId();

  if (!requestedClientId && !systemClientId) {
    return res.status(500).json({ error: "System client id is not available" });
  }

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: requestedClientId || systemClientId,
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
      const responseText = await response.text();
      return res
        .status(response.status)
        .json({ error: responseText || "Refresh token exchange failed" });
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
