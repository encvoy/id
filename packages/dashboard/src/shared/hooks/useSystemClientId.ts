import { useSelector } from "react-redux";
import { RootState } from "src/app/store/store";

export const useSystemClientId = (): string => {
  const systemClientId = useSelector(
    (state: RootState) => state.app.systemClientId
  );

  if (!systemClientId) {
    throw new Error("System client ID is not initialized");
  }

  return systemClientId;
};
