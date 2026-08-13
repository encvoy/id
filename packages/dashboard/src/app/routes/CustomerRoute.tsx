import { FC, useEffect, useState } from "react";
import { connect, useDispatch } from "react-redux";
import { Navigate, Outlet, Route, useLocation } from "react-router-dom";
import { isAdministrator } from "src/shared/utils/helpers";
import { RootState } from "src/app/store/store";
import { TUserSlice } from "src/shared/slices/userSlice";
import { UserProfile } from "src/features/adminPortal/users/UserProfile";
import { CreateUserProfile } from "src/features/adminPortal/users/CreateUserProfile";
import { EditUserProfile } from "src/features/adminPortal/users/EditUserProfile";
import { ChangeUserPassword } from "src/features/adminPortal/users/ChangeUserProfilePassword";
import { CreateClient } from "src/features/adminPortal/clients/pages/CreateClient";
import { ClientDetails } from "src/features/adminPortal/clients/pages/ClientDetails";
import { ClientsList } from "src/features/adminPortal/clients/pages/ClientsList";
import { EventLog } from "src/features/eventLog/EventLogList";
import { ClientSettings } from "src/features/adminPortal/settings/pages/ClientSettings";
import { TopTabsCustomer } from "src/app/routes/tabs/TopTabsCustomer";
import LinearProgress from "@mui/material/LinearProgress";
import { setStartRoutePath } from "src/shared/slices/appSlice";
import { WidgetSettings } from "src/features/adminPortal/settings/pages/WidgetSettings";
import { ProfileSettings } from "src/features/adminPortal/settings/pages/ProfileSettings";
import { EmailTemplatesSettings } from "src/features/adminPortal/settings/pages/EmailTemplatesSettings";
import { routes, subTabs, tabs } from "src/shared/utils/enums";
import { OrgSettings } from "src/features/adminPortal/settings/pages/OrgSettings";
import { UsersList } from "src/features/adminPortal/users/UsersList";

interface ICustomerRouteProps {
  profile: TUserSlice["profile"];
  roleInApp: TUserSlice["roleInApp"];
  isAuthorized: TUserSlice["isAuthorized"];
}

const mapStateToProps = ({ user }: RootState) => ({
  profile: user.profile,
  roleInApp: user.roleInApp,
  isAuthorized: user.isAuthorized,
});

const CustomerRouteComponent: FC<ICustomerRouteProps> = ({
  profile,
  roleInApp,
  isAuthorized,
}) => {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const appId = pathname.split("/").filter(Boolean)[1];

  const userId = profile?.id;
  const passwordChangeRequired = profile?.password_change_required;

  const needsPasswordChange =
    pathname !== `/${routes.profile}/change-password` &&
    userId &&
    passwordChangeRequired;

  useEffect(() => {
    const pathSegments = pathname.split("/");
    switch (pathSegments[1]) {
      case routes.customer:
        dispatch(setStartRoutePath(routes.customer));
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

      const roleForRoute =
        profile.Role?.find((item) => item.client_id === appId)?.role ||
        roleInApp;

      setHasAccess(isAdministrator(roleForRoute));
    };

    checkAuth();
  }, [appId, isAuthorized, profile, roleInApp]);

  if (hasAccess === null) return <LinearProgress />;
  if (!isAuthorized) return <Navigate to="/login" replace />;
  if (!hasAccess) return <Navigate to={`/${routes.profile}`} replace />;
  if (needsPasswordChange)
    return <Navigate to={`/${routes.profile}/change-password`} replace />;

  return (
    <>
      <TopTabsCustomer />
      <Outlet />
    </>
  );
};

export const CustomerRoute = connect(mapStateToProps)(CustomerRouteComponent);

export const getCustomerRoutes = () => {
  return (
    <>
      <Route path={`:appId/${tabs.settings}`} element={<OrgSettings />} />
      <Route
        path={`:appId/${tabs.profileSettings}`}
        element={<ProfileSettings mode="custom" />}
      />
      <Route path={`:appId/${tabs.eventLog}`} element={<EventLog />} />
      <Route path={`:appId/${tabs.clients}`} element={<ClientsList />} />
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
        path={`:appId/${tabs.users}/:userId/${tabs.password}`}
        element={<ChangeUserPassword />}
      />
      <Route path={`:appId/${tabs.widget}`} element={<WidgetSettings />} />
      <Route
        path={`:appId/${tabs.emailTemplates}/:providerId`}
        element={<EmailTemplatesSettings />}
      />
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
        element={<WidgetSettings />}
      />
      <Route
        path={`:appId/${tabs.clients}/:clientId/${tabs.emailTemplates}/:providerId`}
        element={<EmailTemplatesSettings />}
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
        path={`:appId/${tabs.clients}/:clientId/${tabs.users}/:userId/${tabs.password}`}
        element={<ChangeUserPassword />}
      />
    </>
  );
};
