import { FC, useEffect, useState } from "react";
import { connect, useDispatch } from "react-redux";
import { Navigate, Outlet, Route, useLocation } from "react-router-dom";
import { RootState } from "src/app/store/store";
import { TUserSlice } from "src/shared/lib/userSlice";
import { TopTabsAdmin } from "src/app/routes/tabs/TopTabsAdmin";
import { ClientsList } from "src/features/adminPortal/clients/pages/ClientsList";
import { EventLog } from "src/features/eventLog/EventLogList";
import { ClientDetails } from "src/features/adminPortal/clients/pages/ClientDetails";
import { ClientSettings } from "src/features/adminPortal/settings/pages/ClientSettings";
import { UserProfile } from "src/features/adminPortal/users/UserProfile";
import LinearProgress from "@mui/material/LinearProgress";
import { CreateClient } from "src/features/adminPortal/clients/pages/CreateClient";
import { setStartRoutePath } from "src/shared/lib/appSlice";
import { Widget } from "src/features/adminPortal/settings/widget/Widget";
import { ERoles, routes, subTabs, tabs } from "src/shared/utils/enums";

interface IAdminRouteProps {
  profile: TUserSlice["profile"];
  isAuthorized: TUserSlice["isAuthorized"];
  roles: TUserSlice["roles"];
}

const mapStateToProps = ({ user }: RootState) => ({
  profile: user.profile,
  isAuthorized: user.isAuthorized,
  roles: user.roles,
});

const AdminRouteComponent: FC<IAdminRouteProps> = ({
  profile,
  isAuthorized,
  roles,
}) => {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const { pathname } = useLocation();
  const dispatch = useDispatch();

  const userId = profile?.id;
  const passwordChangeRequired = profile?.password_change_required;
  const needsProfileFill =
    pathname !== "/fill-profile" && userId && passwordChangeRequired;

  useEffect(() => {
    const pathSegments = window.location.pathname.split("/");
    switch (pathSegments[1]) {
      case routes.admin:
        dispatch(setStartRoutePath(routes.admin));
        break;
      default:
        if (pathSegments[1]) {
          dispatch(setStartRoutePath(routes.system));
        }
    }
  }, [dispatch, pathname]);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthorized) return;
      if (!profile.id) return;

      if (roles) {
        const isAdminMiniApp = roles.some(
          (item) => item.role === ERoles.EDITOR
        );
        setHasAccess(isAdminMiniApp);
      }
    };

    checkAuth();
  }, [isAuthorized, profile, roles]);

  if (hasAccess === null) return <LinearProgress />;
  if (!isAuthorized) return <Navigate to="/login" replace />;
  if (!hasAccess) return <Navigate to={`/${routes.profile}`} replace />;
  if (needsProfileFill) return <Navigate to="/fill-profile" replace />;

  return (
    <>
      <TopTabsAdmin />
      <Outlet />
    </>
  );
};

export const AdminRoute = connect(mapStateToProps)(AdminRouteComponent);

export const getAdminRoutes = () => {
  return (
    <>
      <Route path={`:appId/${tabs.eventLog}`} element={<EventLog />} />
      <Route path={`:appId/${tabs.clients}`} element={<ClientsList />} />
      <Route
        path={`:appId/${tabs.clients}/${subTabs.create}`}
        element={<CreateClient />}
      />
      <Route
        path={`:appId/${tabs.clients}/:clientId`}
        element={<ClientDetails />}
      />
      <Route
        path={`:appId/${tabs.clients}/:clientId/${tabs.settings}`}
        element={<ClientSettings />}
      />
      <Route
        path={`:appId/${tabs.clients}/:clientId/${tabs.widget}`}
        element={<Widget />}
      />
      <Route
        path={`:appId/${tabs.clients}/:clientId/${tabs.users}/:userId`}
        element={<UserProfile />}
      />
    </>
  );
};
