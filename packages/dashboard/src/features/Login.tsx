import { FC, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { setPendingReturnTo } from "src/packages/authWidget/helpers/auth";

export const Login: FC = () => {
  const location = useLocation();

  useLayoutEffect(() => {
    const from = (location.state as
      | {
          from?: {
            pathname?: string;
            search?: string;
            hash?: string;
          };
        }
      | undefined)?.from;

    if (!from?.pathname) {
      return;
    }

    setPendingReturnTo(
      `${from.pathname}${from.search || ""}${from.hash || ""}`,
    );
  }, [location.state]);

  return null;
};
