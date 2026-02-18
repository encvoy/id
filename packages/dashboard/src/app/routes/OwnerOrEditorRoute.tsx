import LinearProgress from "@mui/material/LinearProgress";
import { FC, useEffect, useState } from "react";
import { connect, useDispatch } from "react-redux";
import { Navigate, Outlet, Route, useLocation } from "react-router-dom";
import { isOwnerOrEditor } from "src/shared/utils/helpers";
import { RootState } from "src/app/store/store";
import { TUserSlice } from "src/shared/lib/userSlice";
import { ClientsList } from "src/features/adminPortal/clients/pages/ClientsList";
import { EventLog } from "src/features/eventLog/EventLogList";
import { UserProfile } from "src/features/adminPortal/users/UserProfile";
import { CreateUserProfile } from "src/features/adminPortal/users/CreateUserProfile";
import { EditUserProfile } from "src/features/adminPortal/users/EditUserProfile";
import { ChangeUserPassword } from "src/features/adminPortal/users/ChangeUserProfilePassword";
import { ClientSettings } from "src/features/adminPortal/settings/pages/ClientSettings";
import { UsersList } from "src/features/adminPortal/users/UsersList";
import { TopTabsOwner } from "src/app/routes/tabs/TopTabsOwner";
import { SystemSettings } from "src/features/adminPortal/settings/pages/SystemSettings";
import { setStartRoutePath } from "src/shared/lib/appSlice";
import { Widget } from "src/features/adminPortal/settings/widget/Widget";
import { routes, subTabs, tabs } from "src/shared/utils/enums";
import { CLIENT_ID } from "src/shared/utils/constants";
import { CreateClient } from "src/features/adminPortal/clients/pages/CreateClient";
import { ClientDetails } from "src/features/adminPortal/clients/pages/ClientDetails";

interface IOwnerOrEditorRouteProps {
  roleInApp: TUserSlice["roleInApp"];
  isAuthorized: TUserSlice["isAuthorized"];
  profile: TUserSlice["profile"];
}

const mapStateToProps = ({ user }: RootState) => ({
  roleInApp: user.roleInApp,
  isAuthorized: user.isAuthorized,
  profile: user.profile,
});

const OwnerOrEditorRouteComponent: FC<IOwnerOrEditorRouteProps> = ({
  roleInApp,
  isAuthorized,
  profile,
}) => {
  const dispatch = useDispatch();
  const { pathname } = useLocation();

  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  const needsProfileFill =
    pathname !== "/fill-profile" && profile?.password_change_required;

  useEffect(() => {
    const pathSegments = window.location.pathname.split("/");
    switch (pathSegments[1]) {
      case routes.system:
        dispatch(setStartRoutePath(routes.system));
        break;
      default:
        if (pathSegments[1]) {
          dispatch(setStartRoutePath(routes.system));
        }
    }
  }, [dispatch, pathname]);

  useEffect(() => {
    const checkAccess = async () => {
      if (!isAuthorized) return;
      if (!profile.id) return;
      if (!roleInApp) return;

      setHasAccess(isOwnerOrEditor(roleInApp));
    };

    checkAccess();
  }, [isAuthorized, profile, roleInApp]);

  if (hasAccess === null) return <LinearProgress />;
  if (!isAuthorized) return <Navigate to="/login" replace />;
  if (!hasAccess) return <Navigate to={`/${routes.profile}`} replace />;
  if (needsProfileFill) return <Navigate to="/fill-profile" replace />;

  return (
    <>
      <TopTabsOwner />
      <Outlet />
    </>
  );
};

export const OwnerOrEditorRoute = connect(mapStateToProps)(
  OwnerOrEditorRouteComponent
);

export const getSystemRoutes = () => {
  return (
    <>
      <Route
        index
        element={<Navigate to={`${CLIENT_ID}/${tabs.settings}`} replace />}
      />
      <Route path={`:appId/${tabs.settings}`} element={<SystemSettings />} />
      <Route path={`:appId/${tabs.widget}`} element={<Widget />} />
      <Route path={`:appId/${tabs.eventLog}`} element={<EventLog />} />
      <Route path={`:appId/${tabs.users}`} element={<UsersList />} />
      <Route
        path={`:appId/${tabs.users}/${subTabs.create}`}
        element={<CreateUserProfile />}
      />
      <Route path={`:appId/${tabs.users}/:userId`} element={<UserProfile />} />
      <Route
        path={`:appId/${tabs.users}/:userId/${subTabs.edit}`}
        element={<EditUserProfile />}
      />
      <Route
        path={`:appId/${tabs.users}/:userId/change-password`}
        element={<ChangeUserPassword />}
      />
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
      <Route
        path={`:appId/${tabs.clients}/:clientId/${tabs.users}/:userId/${subTabs.edit}`}
        element={<EditUserProfile />}
      />
      <Route
        path={`:appId/${tabs.clients}/:clientId/${tabs.users}/:userId/change-password`}
        element={<ChangeUserPassword />}
      />
    </>
  );
};
