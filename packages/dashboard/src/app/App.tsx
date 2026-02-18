import { useSnackbar } from "notistack";
import { FC, useEffect, useLayoutEffect, useRef, useState } from "react";
import { connect, useDispatch } from "react-redux";
import "./App.css";
import { CLIENT_ID } from "../shared/utils/constants";
import { ERoles } from "../shared/utils/enums";
import { getImageURL } from "src/shared/utils/helpers";
import { setClientProfile, TAppSlice } from "../shared/lib/appSlice";
import { TNoticesSlice } from "../shared/lib/noticesSlice";
import { useGetClientInfoQuery } from "../shared/api/clients";
import { useGetMeInfoQuery, useGetUserRolesQuery } from "../shared/api/users";
import { RootState } from "./store/store";
import {
  setUserOrgId,
  setUserProfile,
  setUserRoleInApp,
  setUserRoles,
  TUserSlice,
} from "../shared/lib/userSlice";
import { getFirstClientInfo } from "src/shared/requests/user";
import { getAccessToken } from "../shared/utils/auth";
import { useGetSettingsQuery } from "../shared/api/settings";
import { changeLanguage } from "i18next";
import { useTranslation } from "react-i18next";
import { getUrlParams } from "../packages/authWidget/helpers/auth";
import { AppRoutes } from "src/app/routes/Routes";

const mapStateToProps = (state: RootState) => ({
  isNotificationPanelOpen: state.app.isNotificationPanelOpen,
  isSnackbarOpen: state.app.isSnackbarOpen,
  notices: state.notices.notices,
  orgId: state.user.orgId,
  isAuthorized: state.user.isAuthorized,
});

interface IAppProps {
  isNotificationPanelOpen: TAppSlice["isNotificationPanelOpen"];
  isSnackbarOpen: TAppSlice["isSnackbarOpen"];
  notices?: TNoticesSlice["notices"];
  orgId?: TUserSlice["orgId"];
  isAuthorized?: TUserSlice["isAuthorized"];
}

const AppComponent: FC<IAppProps> = ({
  isNotificationPanelOpen,
  isSnackbarOpen,
  notices,
  orgId,
  isAuthorized,
}) => {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const token = getAccessToken();
  const [isAccessToken, setIsAccessToken] = useState(!!token);

  const contentRef = useRef<HTMLDivElement>(null);
  const { data: profile } = useGetMeInfoQuery(undefined, {
    skip: !isAccessToken,
  });
  const { data: dataSettings } = useGetSettingsQuery(undefined, {
    skip: !isAccessToken,
  });
  const { data: client } = useGetClientInfoQuery(
    { id: CLIENT_ID },
    {
      skip: !isAccessToken,
    }
  );
  const { data: roles } = useGetUserRolesQuery(
    { id: profile?.id || "" },
    { skip: !profile?.id }
  );

  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  useLayoutEffect(() => {
    const code = getUrlParams();
    const token = getAccessToken();
    if (token || code) {
      setIsAccessToken(!!token);
    }
  }, [isAuthorized]);

  useEffect(() => {
    const locale = dataSettings?.i18n?.default_language;
    if (locale) {
      if (currentLanguage !== locale) {
        changeLanguage(locale);
      }
      localStorage.setItem("locale", locale);
    }
  }, [currentLanguage, dataSettings]);

  useEffect(() => {
    const getProfile = async () => {
      if (profile?.id) {
        const roleInRootApp = profile?.Role?.[0]?.role;
        if (roleInRootApp) {
          dispatch(setUserRoleInApp(roleInRootApp));
        }
        dispatch(setUserProfile(profile));
      }
    };

    getProfile();
  }, [profile]);

  useEffect(() => {
    const getProfile = async () => {
      const fetchedClient = await getFirstClientInfo();
      if (fetchedClient) {
        dispatch(setClientProfile(fetchedClient));
      }
    };

    getProfile();

    // Set favicon
    if (client?.avatar) {
      const url = getImageURL(client?.avatar);
      let link: HTMLLinkElement | null =
        document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      if (url) link.href = url;
    }
  }, [client]);

  useEffect(() => {
    if (roles?.length) {
      dispatch(setUserRoles(roles));
      roles.forEach((item) => {
        if (item.role === ERoles.OWNER && item.client.parent_id === null) {
          dispatch(setUserOrgId(item.client.client_id));
        }
      });
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

  return (
    <AppRoutes
      isAccessToken={isAccessToken}
      orgId={orgId}
      contentRef={contentRef}
    />
  );
};

export const App = connect(mapStateToProps)(AppComponent);
