import { IUserShort } from "src/shared/api/users";

type TUserDisplayNameSource = Pick<IUserShort, "id"> & {
  given_name?: string | null;
  family_name?: string | null;
  nickname?: string | null;
};

export const getUserDisplayName = (
  user?: TUserDisplayNameSource | null,
  withOutId?: boolean
) => {
  if (!user) {
    return "";
  }

  const fullName = [user.given_name, user.family_name].filter(Boolean).join(" ").trim();

  return fullName || user.nickname || (withOutId ? "" : `c id: ${user.id}`);
};
