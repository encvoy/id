import { useSnackbar } from "notistack";
import { FC, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { connect, useDispatch } from "react-redux";
import { AppRoutes } from "src/app/routes/Routes";
import {
  DEFAULT_SYSTEM_LANGUAGE,
  getLocalizedTextValue,
  normalizeSystemLanguage,
  syncStoredSystemLanguage,
} from "src/shared/utils/locales";
import { getUrlParams } from "../packages/authWidget/helpers/auth";
import { useGetSettingsQuery } from "../shared/api/settings";
import { useGetMeInfoQuery, useGetUserRolesQuery } from "../shared/api/users";
import { setClientProfile, TAppSlice } from "src/shared/slices/appSlice";
import { TNoticesSlice } from "src/shared/slices/noticesSlice";
import {
  setUserOrgId,
  setUserProfile,
  setUserRoleInApp,
  setUserRoles,
  TUserSlice,
} from "src/shared/slices/userSlice";
import { getAccessToken, getFirstClientInfo } from "../shared/utils/auth";
import { ERoles } from "../shared/utils/enums";
import "./App.css";
import { RootState } from "./store/store";

const mapStateToProps = (state: RootState) => ({
  clientProfile: state.app.clientProfile,
  isNotificationPanelOpen: state.app.isNotificationPanelOpen,
  isSnackbarOpen: state.app.isSnackbarOpen,
  notices: state.notices.notices,
  orgId: state.user.orgId,
  isAuthorized: state.user.isAuthorized,
  userProfile: state.user.profile,
  systemClientId: state.app.systemClientId,
});

interface IAppProps {
  clientProfile: TAppSlice["clientProfile"];
  isNotificationPanelOpen: TAppSlice["isNotificationPanelOpen"];
  isSnackbarOpen: TAppSlice["isSnackbarOpen"];
  notices?: TNoticesSlice["notices"];
  orgId?: TUserSlice["orgId"];
  isAuthorized?: TUserSlice["isAuthorized"];
  systemClientId: TAppSlice["systemClientId"];
  userProfile: TUserSlice["profile"];
}

const AppComponent: FC<IAppProps> = ({
  clientProfile,
  isNotificationPanelOpen,
  isSnackbarOpen,
  notices,
  orgId,
  isAuthorized,
  systemClientId,
  userProfile,
}) => {
  if (!systemClientId) {
    throw new Error("System client ID is not initialized");
  }

  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const token = getAccessToken();
  const [isAccessToken, setIsAccessToken] = useState(!!token);

  const contentRef = useRef<HTMLDivElement>(null);
  const { data: profileData, isLoading: isProfileLoading } = useGetMeInfoQuery(
    undefined,
    {
      skip: !isAccessToken,
    }
  );
  const { data: dataSettings, isLoading: isSettingsLoading } =
    useGetSettingsQuery(undefined, {
      skip: !isAccessToken,
    });
  const { data: roles } = useGetUserRolesQuery(
    { id: profileData?.id || userProfile?.id || "" },
    { skip: !(profileData?.id || userProfile?.id) }
  );

  const { i18n } = useTranslation();
  const currentLanguage = i18n.resolvedLanguage || i18n.language;
  const localizedClientName = getLocalizedTextValue(
    clientProfile?.name,
    currentLanguage
  ).trim();
  const profileLocale = userProfile?.locale
    ? normalizeSystemLanguage(userProfile.locale)
    : profileData?.locale
    ? normalizeSystemLanguage(profileData.locale)
    : null;
  const systemLocale = dataSettings?.i18n?.default_language
    ? normalizeSystemLanguage(dataSettings.i18n.default_language)
    : null;
  const shouldWaitForLocale =
    isAccessToken &&
    !profileLocale &&
    (isProfileLoading || (!systemLocale && isSettingsLoading));
  const preferredLocale = shouldWaitForLocale
    ? null
    : profileLocale || systemLocale || DEFAULT_SYSTEM_LANGUAGE;
  const isLocaleResolved =
    !isAccessToken ||
    (!!preferredLocale &&
      normalizeSystemLanguage(currentLanguage) === preferredLocale);

  useLayoutEffect(() => {
    const code = getUrlParams();
    const token = getAccessToken();
    if (token || code) {
      setIsAccessToken(!!token);
    }
  }, [isAuthorized]);

  useEffect(() => {
    if (!preferredLocale) {
      return;
    }

    if (normalizeSystemLanguage(currentLanguage) !== preferredLocale) {
      void i18n.changeLanguage(preferredLocale);
      return;
    }

    syncStoredSystemLanguage(preferredLocale);
  }, [currentLanguage, i18n, preferredLocale]);

  useEffect(() => {
    document.title = localizedClientName;
  }, [localizedClientName]);

  useEffect(() => {
    const getProfile = async () => {
      if (profileData?.id) {
        const roleInRootApp =
          profileData?.Role?.find((item) => item.client_id === systemClientId)
            ?.role || profileData?.Role?.[0]?.role;
        const orgId = profileData?.Role?.find(
          (item) =>
            item.client_id !== systemClientId &&
            item.parent_id === null &&
            (item.role === ERoles.OWNER || item.role === ERoles.EDITOR)
        )?.client_id;

        dispatch(setUserRoleInApp(roleInRootApp));
        dispatch(setUserOrgId(orgId));
        dispatch(setUserProfile(profileData));
      }
    };

    getProfile();
  }, [dispatch, profileData, systemClientId]);

  useEffect(() => {
    const getProfile = async () => {
      const fetchedClient = await getFirstClientInfo(systemClientId);
      if (fetchedClient) {
        dispatch(setClientProfile(fetchedClient));
      }
    };

    getProfile();
  }, [dispatch, systemClientId]);

  useEffect(() => {
    if (roles?.length) {
      dispatch(setUserRoles(roles));
    }
  }, [roles]);

  useEffect(() => {
    if (!isNotificationPanelOpen && !isSnackbarOpen) {
      const firstItem = notices?.[0];
      if (typeof firstItem?.message === "string")
        enqueueSnackbar(firstItem?.message, {
          variant: "customSnackbar",
          snackbarVariant: firstItem.type,
        });
    }
  }, [notices?.length]);

  if (!isLocaleResolved) {
    return null;
  }

  return (
    <AppRoutes
      isAccessToken={isAccessToken}
      orgId={orgId}
      contentRef={contentRef}
    />
  );
};

export const App = connect(mapStateToProps)(AppComponent);
