import { FC } from "react";
import LinearProgress from "@mui/material/LinearProgress";
import { connect } from "react-redux";
import { useTranslation } from "react-i18next";
import { RootState } from "src/app/store/store";
import { isAdministrator } from "src/shared/utils/helpers";
import { TopTabsProfile } from "src/app/routes/tabs/TopTabsProfile";
import { useGetSettingsQuery } from "src/shared/api/settings";
import { Navigate, Outlet, Route, useLocation } from "react-router-dom";
import { TUserSlice } from "src/shared/lib/userSlice";
import { EventLog } from "src/features/eventLog/EventLogList";
import { ConfirmPhone } from "src/features/accountPortal/pages/ConfirmPhone";
import { ChangePassword } from "src/features/accountPortal/pages/ChangePassword";
import { ConfirmEmail } from "src/features/accountPortal/pages/ConfirmEmail";
import { DeleteProfile } from "src/features/accountPortal/pages/DeleteProfile";
import { EditProfile } from "src/features/accountPortal/pages/EditProfile";
import { AddIdentifyToProfile } from "src/features/accountPortal/pages/AddIdentifyToProfile";
import { Profile } from "src/features/accountPortal/pages/Profile";
import { ScopesList } from "src/features/accountPortal/scopes/ScopesList";
import { RequestList } from "src/features/accountPortal/requests/RequestList";
import { routes, subTabs, tabs } from "src/shared/utils/enums";

interface IPrivateRouteProps {
  profile: TUserSlice["profile"];
  roleInApp: TUserSlice["roleInApp"];
  isAuthorized: TUserSlice["isAuthorized"];
}

const mapStateToProps = ({ user }: RootState) => ({
  profile: user.profile,
  roleInApp: user.roleInApp,
  isAuthorized: user.isAuthorized,
});

const PrivateRouteComponent: FC<IPrivateRouteProps> = ({
  profile,
  roleInApp,
  isAuthorized,
}) => {
  const { t: translate } = useTranslation();
  const location = useLocation();
  const { data: generalSettings, isFetching: settingsLoading } =
    useGetSettingsQuery();

  const userId = profile?.id;
  const deleted = profile?.deleted;
  const passwordChangeRequired = profile?.password_change_required;

  const needsProfileFill =
    location.pathname !== "/fill-profile" &&
    location.pathname !== `/${routes.profile}/restore-profile` &&
    userId &&
    passwordChangeRequired;

  const needsRestore =
    location.pathname !== `/${routes.profile}/restore-profile` &&
    userId &&
    deleted;

  if (settingsLoading || isAuthorized === null) return <LinearProgress />;
  if (!isAuthorized) return <Navigate to="/login" replace />;
  if (needsRestore) return <Navigate to="restore-profile" replace />;
  if (needsProfileFill) return <Navigate to="/fill-profile" replace />;

  if (generalSettings?.authorize_only_admins && !isAdministrator(roleInApp)) {
    return (
      <Navigate to={`error/${translate("errors.adminAccessOnly")}`} replace />
    );
  }

  return (
    <>
      <TopTabsProfile />
      <Outlet />
    </>
  );
};

export const PrivateRoute = connect(mapStateToProps)(PrivateRouteComponent);

export const getPrivateRoutes = () => {
  return (
    <>
      <Route index element={<Navigate to={`${tabs.profile}`} replace />} />
      <Route path={`${tabs.profile}`} element={<Profile />} />,
      <Route
        path={`${tabs.profile}/${subTabs.edit}`}
        element={<EditProfile />}
      />
      <Route
        path={`${tabs.profile}/${subTabs.delete}`}
        element={<DeleteProfile />}
      />
      <Route path={`email/:action`} element={<ConfirmEmail />} />,
      <Route path={`phone/:action`} element={<ConfirmPhone />} />,
      <Route path={`change-password`} element={<ChangePassword />} />
      <Route path={`external-provider`} element={<AddIdentifyToProfile />} />
      <Route path={`${tabs.scopes}`} element={<ScopesList />} />,
      <Route path={`${tabs.eventLog}`} element={<EventLog />} />,
      <Route path={`${tabs.request}`} element={<RequestList />} />
    </>
  );
};
