import { FC, RefObject } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Error } from "src/features/Error";
import { Box } from "@mui/material";
import { Login } from "src/features/Login";
import { AdminRoute, getAdminRoutes } from "src/app/routes/AdminRoute";
import { CustomerRoute, getCustomerRoutes } from "src/app/routes/CustomerRoute";
import {
  OwnerOrEditorRoute,
  getSystemRoutes,
} from "src/app/routes/OwnerOrEditorRoute";
import { PrivateRoute, getPrivateRoutes } from "src/app/routes/PrivateRoute";
import { PublicLayout } from "src/layouts/PublicLayout";
import { useSystemClientId } from "src/shared/hooks/useSystemClientId";
import { routes, tabs } from "src/shared/utils/enums";
import { MainLayout } from "src/layouts/MainLayout";
import { AuthLayout } from "src/layouts/AuthLayout";

export const AppRoutes: FC<{
  isAccessToken: boolean;
  orgId?: string;
  contentRef: RefObject<HTMLDivElement | null>;
}> = ({ isAccessToken, orgId, contentRef }) => {
  const location = useLocation();
  const systemClientId = useSystemClientId();
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/code";

  if (!isAccessToken && !isAuthPage) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <>
      <Box ref={contentRef}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/code" element={<Login />} />
          </Route>

          <Route element={<PublicLayout />}>
            <Route index path="/error/:text" element={<Error />} />
          </Route>

          <Route element={<MainLayout contentRef={contentRef} />}>
            <Route path={routes.profile} element={<PrivateRoute />}>
              {getPrivateRoutes()}
            </Route>

            <Route path={routes.admin} element={<AdminRoute />}>
              <Route
                key="index"
                index
                element={
                  <Navigate to={`${systemClientId}/${tabs.clients}`} replace />
                }
              />
              {getAdminRoutes()}
            </Route>

            <Route path={routes.customer} element={<CustomerRoute />}>
              <Route
                index
                element={<Navigate to={`${orgId}/${tabs.settings}`} replace />}
              />
              {getCustomerRoutes()}
            </Route>

            <Route path={routes.system} element={<OwnerOrEditorRoute />}>
              {getSystemRoutes(systemClientId)}
            </Route>

            <Route
              path="*"
              element={
                <Navigate to={`/${routes.profile}/${tabs.profile}`} replace />
              }
            />
          </Route>
        </Routes>
      </Box>
    </>
  );
};
