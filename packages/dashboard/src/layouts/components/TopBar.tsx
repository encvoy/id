import { useTheme } from "@mui/material";
import Box from "@mui/material/Box";
import { FC } from "react";
import { connect, useDispatch } from "react-redux";
import {
  BASE_CONFIG,
  CLIENT_ID,
  CUSTOM_STYLES,
} from "src/shared/utils/constants";
import { getImageURL } from "src/shared/utils/helpers";
import { TAppSlice } from "src/shared/lib/appSlice";
import { RootState } from "src/app/store/store";
import { Widget } from "src/packages/authWidget";
import { WidgetConfig } from "src/packages/authWidget";
import { buttonBorderRadius } from "src/shared/theme/Theme";
import styles from "./TopBar.module.css";
import { useNavigate } from "react-router-dom";
import { routes, tabs } from "src/shared/utils/enums";
import { setIsAuthorized, TUserSlice } from "src/shared/lib/userSlice";
import { getAccessToken } from "src/shared/utils/auth";

const mapStateToProps = (state: RootState) => ({
  clientProfile: state.app.clientProfile,
  orgId: state.user.orgId,
});

interface ITopBarProps {
  clientProfile: TAppSlice["clientProfile"];
  orgId: TUserSlice["orgId"];
}

const TopBarComponent: FC<ITopBarProps> = ({ clientProfile, orgId }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const widgetStyles = CUSTOM_STYLES.widget;
  const buttonStyles = CUSTOM_STYLES.widget?.button;
  const tokenLocal = getAccessToken();

  const newConfig: WidgetConfig = {
    ...BASE_CONFIG,
    customRoute: (token: string) => {
      dispatch(setIsAuthorized(!!token));
      if (!tokenLocal) {
        navigate(`/${routes.profile}/${tabs.profile}`);
      }
    },
    routerMainFn: (value) => {
      switch (value) {
        case "lk_system":
          navigate(`/${routes.system}/${CLIENT_ID}/${tabs.settings}`);
          break;
        case "lk_org":
          navigate(`/${routes.customer}/${orgId}/${tabs.settings}`);
          break;
        case "lk_admin":
          navigate(`/${routes.admin}/${orgId || CLIENT_ID}/${tabs.clients}`);
          break;
        default:
          navigate(`/${routes.profile}/${tabs.profile}`);
          break;
      }
    },
    profile: {
      isHideText: widgetStyles?.displayText,
      wrapper: {
        color: {
          text: theme.palette.text.primary,
          background: "transparent",
        },
      },
      button: {
        color: {
          text: buttonStyles?.color || theme.palette.primary.contrastText,
          background: buttonStyles?.background || theme.palette.primary.main,
          hover: buttonStyles?.hover || theme.palette.primary.main,
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
    customStyles: {
      global: {
        color: {
          text: theme.palette.text.secondary,
          background: theme.palette.background.paper,
        },
        borderRadius: buttonBorderRadius,
      },
      components: {
        accountButton: {
          color: {
            text: theme.palette.text.primary,
          },
        },
        primaryButton: {
          color: {
            text: theme.palette.primary.contrastText,
            background: theme.palette.primary.main,
            hover: theme.palette.primary.main,
          },
        },
        secondaryButton: {
          color: {
            text: theme.palette.secondary.contrastText,
            background: theme.palette.secondary.main,
            hover: theme.palette.secondary.main,
          },
        },
      },
    },
  };

  return (
    <>
      <Box id="top-bar" className={styles.topBar}>
        {clientProfile?.avatar && (
          <img
            className={styles.logo}
            src={getImageURL(clientProfile?.avatar)}
            alt={clientProfile?.name}
          />
        )}
        <span translate="no" className={styles.title}>
          {clientProfile?.name}
        </span>
        <div className={styles.profile}>
          <Widget config={newConfig} />
        </div>
      </Box>
    </>
  );
};

export const TopBar = connect(mapStateToProps)(TopBarComponent);
