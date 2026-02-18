import { CLIENT_ID } from "../utils/constants";
import { IClient } from "src/shared/api/clients";

export const getFirstClientInfo = async (): Promise<IClient | undefined> => {
  try {
    const response = await fetch(
      window.location.origin + `/api/v1/clients/` + CLIENT_ID,
      {
        method: "GET",
      }
    );

    return await response.json();
  } catch (e) {
    console.error("getFirstClientInfo error: ", e);
  }
};

export const checkIdentifier = async (identifier: string) => {
  try {
    const body = "identifier=" + encodeURIComponent(identifier);

    const response = await fetch(
      window.location.origin + "/api/v1/auth/check_identifier",
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded ",
        },
        method: "POST",
        body,
      }
    );
    if (!response.ok) {
      return false;
    }
    const { is_active } = await response.json();
    return is_active;
  } catch (e) {
    console.error("checkIdentifier error: ", e);
  }
};
