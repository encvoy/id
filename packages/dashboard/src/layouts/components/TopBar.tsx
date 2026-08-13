import AddIcon from "@mui/icons-material/Add";
import CardMembershipOutlinedIcon from "@mui/icons-material/CardMembershipOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { useTheme } from "@mui/material";
import Box from "@mui/material/Box";
import { FC } from "react";
import { connect, useDispatch } from "react-redux";
import { createBaseConfig } from "src/shared/utils/constants";
import {
  useCreateOrganizationMutation,
  useGetClientInfoQuery,
} from "src/shared/api/clients";
import { getImageURL } from "src/shared/utils/helpers";
import { TAppSlice } from "src/shared/slices/appSlice";
import { RootState } from "src/app/store/store";
import { TrustedWidget } from "src/packages/authWidget";
import { TrustedWidgetConfig } from "src/packages/authWidget";
import styles from "./TopBar.module.css";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { routes, tabs } from "src/shared/utils/enums";
import { setIsAuthorized, TUserSlice } from "src/shared/slices/userSlice";
import { getAccessToken } from "src/shared/utils/auth";
import { consumePostLoginReturnTo } from "src/packages/authWidget/helpers/auth";
import { refreshTrustedWidgetProfile } from "src/packages/authWidget/helpers/auth";
import { useTranslation } from "react-i18next";
import { getLocalizedTextValue } from "src/shared/utils/locales";
import { ERoles } from "src/shared/utils/enums";
import { isOwnerOrEditor } from "src/shared/utils/helpers";
import { APP_BASE_PATH } from "src/shared/utils/appBasePath";

const mapStateToProps = (state: RootState) => ({
  clientProfile: state.app.clientProfile,
  orgId: state.user.orgId,
  profile: state.user.profile,
  systemClientId: state.app.systemClientId,
});

interface ITopBarProps {
  clientProfile: TAppSlice["clientProfile"];
  orgId: TUserSlice["orgId"];
  profile: TUserSlice["profile"];
  systemClientId: TAppSlice["systemClientId"];
}

const TopBarComponent: FC<ITopBarProps> = ({
  clientProfile,
  orgId,
  profile,
  systemClientId,
}) => {
  const { i18n } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const tokenLocal = getAccessToken();
  const [createOrganization] = useCreateOrganizationMutation();
  const pathSegments = pathname.split("/").filter(Boolean);
  const routeName = pathSegments[0];
  const routeAppId = pathSegments[1];
  const activeOrganizationId =
    routeName === routes.customer ? routeAppId || orgId || "" : "";
  const shouldShowOrganizationSuffix =
    Boolean(activeOrganizationId) && activeOrganizationId !== systemClientId;
  const { data: organizationClient } = useGetClientInfoQuery(
    {
      id: activeOrganizationId,
    },
    { skip: !shouldShowOrganizationSuffix }
  );
  const organizationName = getLocalizedTextValue(
    organizationClient?.name,
    i18n.language
  ).trim();
  const localizedClientName = getLocalizedTextValue(
    clientProfile?.name,
    i18n.language
  ).trim();
  const canCreateOrganization = profile?.Role?.some(
    (item) =>
      item.client_id === systemClientId &&
      (item.role === ERoles.ADMIN || item.role === ERoles.EDITOR)
  );
  const canOpenSystemCabinet = profile?.Role?.some(
    (item) => item.client_id === systemClientId && isOwnerOrEditor(item.role)
  );

  const handleCreateOrganization = async () => {
    try {
      const result = await createOrganization().unwrap();
      if (result?.orgId) {
        refreshTrustedWidgetProfile();
        navigate(`/${routes.customer}/${result.orgId}/${tabs.settings}`);
      }
    } catch (error) {
      console.error("create organization rejected", error);
    }
  };
  const navigateByLink = (link?: string) => {
    if (!link) {
      return false;
    }

    const url = new URL(link, window.location.origin);
    if (url.origin !== window.location.origin) {
      window.location.href = link;
      return true;
    }

    const pathname =
      APP_BASE_PATH && url.pathname.startsWith(`${APP_BASE_PATH}/`)
        ? url.pathname.slice(APP_BASE_PATH.length)
        : url.pathname;
    navigate(`${pathname}${url.search}${url.hash}`);
    return true;
  };

  const newConfig: TrustedWidgetConfig = {
    ...createBaseConfig(systemClientId || ""),
    customRoute: (token: string) => {
      dispatch(setIsAuthorized(!!token));
      const isAuthRoute = pathname === "/login" || pathname === "/code";

      if (!tokenLocal || isAuthRoute) {
        const returnTo = consumePostLoginReturnTo();
        navigate(returnTo || `/${routes.profile}/${tabs.profile}`, {
          replace: true,
        });
      }
    },
    routerMainFn: (value, link) => {
      if (navigateByLink(link)) {
        return;
      }

      switch (value) {
        case "lk_system":
          navigate(`/${routes.system}/${systemClientId}/${tabs.settings}`);
          break;
        case "lk_org":
          navigate(`/${routes.customer}/${orgId}/${tabs.settings}`);
          break;
        case "lk_admin":
          navigate(`/${routes.admin}/${systemClientId}/${tabs.clients}`);
          break;
        default:
          navigate(`/${routes.profile}/${tabs.profile}`);
          break;
      }
    },
    profile: {
      wrapper: {
        color: {
          text: theme.palette.text.primary,
        },
      },
      button: {
        color: {
          text: theme.palette.primary.contrastText,
          background: theme.palette.primary.main,
          hover: theme.palette.primary.main,
        },
      },
    },
    loginButton: {
      text: "",
      customStyles: {
        color: {
          text: theme.palette.secondary.contrastText,
          background: theme.palette.secondary.main,
        },
      },
    },
    headerButtons: canOpenSystemCabinet
      ? [
          {
            text: i18n.t("button.systemSettings", { ns: "trusted-widget" }),
            icon: <SettingsOutlinedIcon />,
            onClick: () =>
              navigate(`/${routes.system}/${systemClientId}/${tabs.system}`),
          },
        ]
      : [],
    menuButtons: [
      ...(canCreateOrganization
        ? [
            {
              text: i18n.t("pages.organizations.actions.createOrganization"),
              icon: <AddIcon />,
              onClick: () => {
                void handleCreateOrganization();
              },
            },
          ]
        : []),
    ],
    customStyles: {
      global: {
        color: {
          text: theme.palette.text.secondary,
          background: theme.palette.background.paper,
        },
        borderRadius: theme.encvoy.buttonBorderRadius,
      },
      components: {
        accountButton: {
          color: {
            text: theme.palette.secondary.contrastText,
            background: theme.palette.secondary.main,
          },
        },
        primaryButton: {
          color: {
            text: theme.palette.primary.contrastText,
            background: theme.palette.primary.main,
          },
        },
        secondaryButton: {
          color: {
            text: theme.palette.secondary.contrastText,
            background: theme.palette.secondary.main,
          },
        },
      },
    },
  };

  return (
    <>
      <Box id="top-bar" className={styles.topBar}>
        <Box className={styles.brand}>
          {clientProfile?.avatar && (
            <img
              className={styles.logo}
              src={getImageURL(clientProfile?.avatar)}
              alt={localizedClientName}
            />
          )}
          {localizedClientName && (
            <span translate="no" className={styles.title}>
              {localizedClientName}
            </span>
          )}
          {shouldShowOrganizationSuffix && organizationName && (
            <>
              <span className={styles.separator} aria-hidden="true" />
              {organizationClient?.avatar && (
                <img
                  className={styles.orgLogo}
                  src={getImageURL(organizationClient.avatar)}
                  alt={organizationName}
                />
              )}
              <span translate="no" className={styles.subTitle}>
                {organizationName}
              </span>
            </>
          )}
        </Box>
        <div className={styles.profile}>
          <TrustedWidget config={newConfig} />
        </div>
      </Box>
    </>
  );
};

export const TopBar = connect(mapStateToProps)(TopBarComponent);
