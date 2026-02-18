import { IUserShort } from "src/shared/api/users";

export const getDisplayName = (user: IUserShort, withOutId?: boolean) => {
  const name = user
    ? user.given_name ?? user.nickname ?? (withOutId ? "" : `c id: ${user.id}`)
    : "";
  return name;
};
