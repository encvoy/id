import { Outlet } from "react-router-dom";
import { FC } from "react";
import { TopBar } from "src/layouts/components/TopBar";

export const AuthLayout: FC = () => {
  return (
    <>
      <TopBar />
      <Outlet />
    </>
  );
};
