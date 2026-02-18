import { FC, useLayoutEffect } from "react";
import { showDisplay } from "src/shared/utils/helpers";
import { Outlet } from "react-router-dom";

export const PublicLayout: FC = () => {
  useLayoutEffect(() => {
    showDisplay();
  }, []);

  return <Outlet />;
};
