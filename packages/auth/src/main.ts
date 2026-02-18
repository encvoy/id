import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import NodeCache from "node-cache";
import fetch from "node-fetch";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth";

dotenv.config();
const app = express();
const port = 3007;

export const DOMAIN: string =
  process.env.DOMAIN ?? process.env.VITE_DOMAIN ?? "https://localhost";
const cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

async function fetchAllowedOrigins(): Promise<string[]> {
  try {
    const response = await fetch(`${DOMAIN}/api/v1/clients/white-list`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = (await response.json()) as { origins?: string[] };
    return data.origins ?? [];
  } catch (error) {
    console.error("Error fetching allowed origins:", error);
    return [DOMAIN];
  }
}

// Function to update the cache
function updateOriginsCache(origins: string[]): void {
  cache.set("allowedOrigins", origins);
}

// Endpoint for updating CORS origins by an external service
app.post("/auth/update-cors", express.json(), (req, res) => {
  try {
    const origins = req.body.origins ?? [];
    if (!Array.isArray(origins)) {
      throw new Error("Invalid origins format: expected an array");
    }
    updateOriginsCache(origins);
    res.status(200).json({ message: "CORS origins updated successfully" });
  } catch (error) {
    console.error("Failed to update CORS origins:", error);
    res.status(400).json({ error: "Failed to update CORS origins" });
  }
});

app.use(
  cors({
    origin: async (origin, callback) => {
      let allowedOrigins = cache.get("allowedOrigins") as string[] | undefined;

      if (!allowedOrigins) {
        allowedOrigins = await fetchAllowedOrigins();
        cache.set("allowedOrigins", allowedOrigins);
      }
      callback(null, allowedOrigins.includes(origin ?? "") ? origin : false);
    },
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["Access-Control-Allow-Origin"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/auth", authRoutes);
app.use(errorHandler);

app.listen(port, () => {
  console.info(`HTTPS server running at ${DOMAIN}:${port}`);
});
