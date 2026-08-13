import LinearProgress from "@mui/material/LinearProgress";
import { FC, useEffect, useState } from "react";
import { connect, useDispatch } from "react-redux";
import { Navigate, Outlet, Route, useLocation } from "react-router-dom";
import { isOwnerOrEditor } from "src/shared/utils/helpers";
import { RootState } from "src/app/store/store";
import { TUserSlice } from "src/shared/slices/userSlice";
import { ClientsList } from "src/features/adminPortal/clients/pages/ClientsList";
import { EventLog } from "src/features/eventLog/EventLogList";
import { UserProfile } from "src/features/adminPortal/users/UserProfile";
import { CreateUserProfile } from "src/features/adminPortal/users/CreateUserProfile";
import { EditUserProfile } from "src/features/adminPortal/users/EditUserProfile";
import { ChangeUserPassword } from "src/features/adminPortal/users/ChangeUserProfilePassword";
import { ClientSettings } from "src/features/adminPortal/settings/pages/ClientSettings";
import { UsersList } from "src/features/adminPortal/users/UsersList";
import { TopTabsOwner } from "src/app/routes/tabs/TopTabsOwner";
import { TopTabsSystem } from "src/app/routes/tabs/TopTabsSystem";
import { SystemOrgSettings } from "src/features/adminPortal/settings/pages/SystemOrgSettings";
import { OrganizationsList } from "src/features/adminPortal/organizations/pages/OrganizationsList";
import { ProfileSettings } from "src/features/adminPortal/settings/pages/ProfileSettings";
import { StylingSettings } from "src/features/adminPortal/settings/pages/StylingSettings";
import { EmailTemplatesSettings } from "src/features/adminPortal/settings/pages/EmailTemplatesSettings";
import { setStartRoutePath } from "src/shared/slices/appSlice";
import { WidgetSettings } from "src/features/adminPortal/settings/pages/WidgetSettings";
import { routes, subTabs, tabs } from "src/shared/utils/enums";
import { CreateClient } from "src/features/adminPortal/clients/pages/CreateClient";
import { ClientDetails } from "src/features/adminPortal/clients/pages/ClientDetails";
import { SystemSettings } from "src/features/adminPortal/settings/pages/SystemSettings";

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
  const pathSegments = pathname.split("/").filter(Boolean);
  const thirdSegment = pathSegments[2];
  const isSystemCabinet =
    thirdSegment === tabs.system ||
    thirdSegment === tabs.organizations ||
    thirdSegment === tabs.systemProfileSettings ||
    thirdSegment === tabs.styling;

  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  const needsPasswordChange =
    pathname !== `/${routes.profile}/change-password` &&
    profile?.password_change_required;

  useEffect(() => {
    const pathSegments = pathname.split("/");
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
  if (needsPasswordChange)
    return <Navigate to={`/${routes.profile}/change-password`} replace />;

  return (
    <>
      {isSystemCabinet ? <TopTabsSystem /> : <TopTabsOwner />}
      <Outlet />
    </>
  );
};

export const OwnerOrEditorRoute = connect(mapStateToProps)(
  OwnerOrEditorRouteComponent
);

export const getSystemRoutes = (systemClientId: string) => {
  return (
    <>
      <Route
        index
        element={<Navigate to={`${systemClientId}/${tabs.settings}`} replace />}
      />
      <Route path={`:appId/${tabs.settings}`} element={<SystemOrgSettings />} />
      <Route
        path={`:appId/${tabs.organizations}`}
        element={<OrganizationsList />}
      />
      <Route path={`:appId/${tabs.system}`} element={<SystemSettings />} />
      <Route
        path={`:appId/${tabs.profileSettings}`}
        element={<ProfileSettings mode="custom" />}
      />
      <Route
        path={`:appId/${tabs.systemProfileSettings}`}
        element={<ProfileSettings mode="base" />}
      />
      <Route path={`:appId/${tabs.styling}`} element={<StylingSettings />} />
      <Route
        path={`:appId/${tabs.emailTemplates}/:providerId`}
        element={<EmailTemplatesSettings />}
      />
      <Route path={`:appId/${tabs.widget}`} element={<WidgetSettings />} />
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
        path={`:appId/${tabs.users}/:userId/${tabs.password}`}
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
