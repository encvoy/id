import PersonIcon from "@mui/icons-material/Person";
import { Avatar, IconButton, Tooltip } from "@mui/material";
import clsx from "clsx";
import AppsIcon from "@mui/icons-material/Apps";
import {
  FC,
  MouseEventHandler,
  isValidElement,
  useEffect,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  decodeJWT,
  getTokenByRefreshToken,
  getTokensByCode,
  getUrlParams,
  isTokenValid,
  login,
  logout,
  onTrustedWidgetProfileRefresh,
  setDataToLocalStorage,
} from "../helpers/auth";
import { generateStyles, getImageURL } from "../helpers/utils";
import {
  EBaseColors,
  EButtonTypes,
  EDefaultConfigValues,
  BaseWidgetConfig,
  InfoWidgetConfig,
  ICustomMenuButton,
  IUserProfile,
  TrustedWidgetConfig,
} from "../types";
import { AccountPopover } from "./AccountPopover";
import { CustomButton } from "./CustomButton";
import styles from "./Widget.module.css";
import { CatalogPopover } from "./CatalogPopover";
import { normalizeSystemLanguage } from "src/shared/utils/locales";

interface WidgetProps {
  config: TrustedWidgetConfig;
}

interface IHeaderActionButtonProps {
  config: BaseWidgetConfig;
  button: ICustomMenuButton;
}

const HeaderActionButton: FC<IHeaderActionButtonProps> = ({
  config,
  button,
}) => {
  const buttonTitle = button.text || button.link || "";
  const icon = (() => {
    if (typeof button.icon === "string") {
      return (
        <img
          src={button.icon}
          className={styles.headerActionIcon}
          alt={buttonTitle}
        />
      );
    }

    if (isValidElement(button.icon)) {
      return button.icon;
    }

    if (typeof button.avatar === "string") {
      return (
        <img
          src={button.avatar}
          className={styles.headerActionIcon}
          alt={buttonTitle}
        />
      );
    }

    return null;
  })();

  const handleClick = () => {
    if (button.onClick) {
      button.onClick();
      return;
    }

    if (button.type === EButtonTypes.logout) {
      logout();
      return;
    }

    if (
      config.routerMainFn &&
      button.type &&
      (button.type === EButtonTypes.personal ||
        button.type === EButtonTypes.system ||
        button.type === EButtonTypes.org ||
        button.type === EButtonTypes.admin)
    ) {
      config.routerMainFn(button.type, button.link);
      return;
    }

    if (button.link) {
      window.location.href = button.link;
      return;
    }

    window.location.href = config.issuer || EDefaultConfigValues.issuer;
  };

  return (
    <Tooltip title={buttonTitle} arrow>
      <button
        type="button"
        className={styles.button}
        onClick={handleClick}
        aria-label={buttonTitle}
        data-test-id={`btn-mini-widget-header-${button.text}`}
        style={{
          color:
            button.customStyles?.color.text ||
            config?.profile?.button?.color.background ||
            EBaseColors.hover,
        }}
      >
        {icon}
      </button>
    </Tooltip>
  );
};

export const TrustedWidget: FC<WidgetProps> = ({ config }) => {
  const [token, setToken] = useState<string>("");
  const [profile, setProfile] = useState<IUserProfile | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [anchorCatalog, setAnchorCatalog] = useState<null | HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [exp, setExp] = useState<number | null>(null);
  const { t: translate } = useTranslation();

  const isOpen = Boolean(anchorEl);
  const isOpenCatalog = Boolean(anchorCatalog);
  const customStyles = generateStyles(config);
  const issuer = config?.issuer || EDefaultConfigValues.issuer;
  const userInfoEndPoint =
    config?.userInfoEndPoint || EDefaultConfigValues.userInfoEndPoint;

  useEffect(() => {
    const auth = async () => {
      try {
        const { access_token, id_token, expires_in } = await getTokensByCode(
          config
        );
        const isValidToken = await isTokenValid(id_token);
        const isDecodeJWT = decodeJWT(id_token);
        if (isValidToken && isDecodeJWT) {
          setToken(access_token);
          setDataToLocalStorage(access_token, expires_in);
          if (expires_in) {
            const expiresAt = Date.now() + expires_in * 1000;
            setExp(expiresAt);
          }
          if (config.customRoute) {
            config.customRoute(access_token);
          } else {
            window.location.replace("/");
          }
        } else {
          console.warn("auth: Token validation failed, not setting tokens");
        }
      } catch (e) {
        console.error("auth error: " + e);
      }
    };

    const accessToken = localStorage.getItem("accessToken");
    const expiresIn = localStorage.getItem("expiresIn");

    if (expiresIn) {
      const parsedExp = Number(expiresIn);
      setExp(parsedExp);
    }

    if (accessToken && !token) {
      setToken(accessToken);
      if (config.customRoute) {
        config.customRoute(accessToken);
      }
      return;
    }

    const code = getUrlParams();

    if (!accessToken && !token && !code && config?.withOutHomePage) {
      login(config);
    }

    if (!accessToken && !token) {
      auth();
    }
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    const loadUserData = async () => {
      try {
        const response = await fetch(issuer + userInfoEndPoint, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            "fetchUserData: HTTP error response:",
            response.status,
            errorText
          );
          return;
        }

        const data = await response.json();

        const normalizedLocale = normalizeSystemLanguage(data.locale);

        if (localStorage.getItem("locale") !== normalizedLocale) {
          localStorage.setItem("locale", normalizedLocale);
        }

        setProfile(data);
      } catch (error) {
        console.error("fetchUserData: Network/Parse error:", error);
      }
    };

    void loadUserData();

    return onTrustedWidgetProfileRefresh(() => {
      void loadUserData();
    });
  }, [issuer, token, userInfoEndPoint]);

  const updateAccessToken = async () => {
    const { access_token, expires_in } = await getTokenByRefreshToken(
      config.appId,
      config.issuer || EDefaultConfigValues.issuer
    );
    if (access_token) {
      setDataToLocalStorage(access_token, expires_in);
      setToken(access_token);

      if (expires_in) {
        const now = Date.now(); // at time in ms
        const expiresAt = now + expires_in * 1000;
        setExp(expiresAt);
      }
    }
  };

  useEffect(() => {
    if (!exp) return;
    const currentTime = Date.now(); // already in ms
    const timeUntilExpiration = exp - currentTime;
    const refreshThreshold = 60 * 1000; // 1 minute in ms

    //if token is expired or about to expire, refresh immediately
    if (timeUntilExpiration <= refreshThreshold) {
      updateAccessToken();
      return;
    }

    const timeout = setTimeout(() => {
      updateAccessToken();
    }, timeUntilExpiration - refreshThreshold);

    return () => clearTimeout(timeout);
  }, [exp]);

  const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setAnchorCatalog(null);
  };

  const getUserDisplayName = (profile?: IUserProfile | null) => {
    if (!profile || config.profile?.isHideText) return undefined;
    if (profile.given_name) {
      return `${profile?.given_name ?? ""} ${
        profile?.family_name ?? ""
      }`.trim();
    }
    return profile?.nickname || "";
  };

  if (token && profile) {
    return (
      <>
        {(config.headerButtons?.length || profile.catalog) && (
          <div className={styles.headerActions}>
            {config.headerButtons?.map((item) => (
              <HeaderActionButton
                key={`${item.text}-${item.link || item.type || "header"}`}
                config={config}
                button={item}
              />
            ))}

            {profile.catalog && (
              <IconButton
                data-test-id="btn-app-catalog"
                className={styles.button}
                onClick={(event) => setAnchorCatalog(event.currentTarget)}
                title={translate("button.catalog", { ns: "trusted-widget" })}
              >
                <AppsIcon
                  sx={{
                    color:
                      config.catalogButton?.color.text ||
                      config?.profile?.button?.color.background ||
                      EBaseColors.hover,
                  }}
                />
              </IconButton>
            )}
          </div>
        )}

        <div
          className={clsx(
            styles.authWidget,
            !!getUserDisplayName(profile) && styles.authWidget_padding
          )}
          style={{
            backgroundColor:
              config?.profile?.wrapper?.color.background ||
              EBaseColors.background,
          }}
        >
          {!config.profile?.isHideText && (
            <p
              style={{
                color:
                  config?.profile?.wrapper?.color.text || EBaseColors.primary,
              }}
              className={styles.text}
            >
              {getUserDisplayName(profile)}
            </p>
          )}
          <Tooltip
            title={translate("button.avatar", { ns: "trusted-widget" })}
            arrow
          >
            <button
              data-test-id="btn-profile-account"
              onClick={handleClick}
              className={styles.button}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={{
                color: customStyles.text,
                backgroundColor: isHovered
                  ? config.profile?.button?.color.hover || EBaseColors.hover
                  : config?.profile?.wrapper?.color.background,
              }}
            >
              {profile?.picture ? (
                <Avatar
                  src={getImageURL(
                    profile.picture,
                    config.issuer || EDefaultConfigValues.issuer
                  )}
                  className={styles.buttonImage}
                />
              ) : (
                <Avatar
                  className={clsx(styles.buttonImage)}
                  style={{
                    backgroundColor:
                      config?.profile?.button?.color.background ||
                      EBaseColors.hover,
                  }}
                >
                  <PersonIcon
                    style={{
                      color:
                        config?.profile?.button?.color.text ||
                        EBaseColors.secondary,
                    }}
                  />
                </Avatar>
              )}
            </button>
          </Tooltip>

          {profile.catalog && (
            <CatalogPopover
              isOpen={isOpenCatalog}
              anchorEl={anchorCatalog}
              onClose={handleClose}
              profile={profile}
              config={config}
            />
          )}

          <AccountPopover
            isOpen={isOpen}
            anchorEl={anchorEl}
            onClose={handleClose}
            profile={profile}
            config={config}
          />
        </div>
      </>
    );
  }

  return (
    <div>
      <CustomButton
        config={config}
        content={{
          text:
            typeof config?.loginButton?.text === "string"
              ? config.loginButton.text
              : EDefaultConfigValues.loginButton,
          link: "",
          type: EDefaultConfigValues.loginType,
        }}
        icon={config?.loginButton?.icon}
        customStyles={
          config?.loginButton?.customStyles || customStyles.primaryButton
        }
      />
    </div>
  );
};
interface InfoWidgetProps {
  config: InfoWidgetConfig;
}

export const InfoWidget: FC<InfoWidgetProps> = ({ config }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [anchorCatalog, setAnchorCatalog] = useState<null | HTMLElement>(null);
  const { t: translate } = useTranslation();

  const isOpen = Boolean(anchorEl);
  const isOpenCatalog = Boolean(anchorCatalog);
  const customStyles = generateStyles(config);

  const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setAnchorCatalog(null);
  };

  const getUserDisplayName = (profile?: IUserProfile | null) => {
    if (!profile || config.profile?.isHideText) return undefined;
    if (profile.given_name) {
      return `${profile.given_name} ${profile.family_name ?? ""}`.trim();
    }
    return profile.nickname;
  };

  if (config?.data) {
    return (
      <>
        {(config.headerButtons?.length || config?.data.catalog) && (
          <div className={styles.headerActions}>
            {config.headerButtons?.map((item) => (
              <HeaderActionButton
                key={`${item.text}-${item.link || item.type || "header"}`}
                config={config}
                button={item}
              />
            ))}

            {config?.data.catalog && (
              <IconButton
                data-test-id="btn-app-catalog"
                className={styles.button}
                onClick={(event) => setAnchorCatalog(event.currentTarget)}
                title={translate("button.catalog", { ns: "trusted-widget" })}
              >
                <AppsIcon
                  sx={{
                    color:
                      config.catalogButton?.color.text ||
                      config?.profile?.button?.color.background ||
                      EBaseColors.hover,
                  }}
                />
              </IconButton>
            )}
          </div>
        )}
        <div
          className={clsx(
            styles.authWidget,
            !!getUserDisplayName(config?.data) && styles.authWidget_padding
          )}
          style={{
            backgroundColor:
              config?.profile?.wrapper?.color.background ||
              EBaseColors.background,
          }}
        >
          {!config.profile?.isHideText && (
            <p
              style={{
                color:
                  config?.profile?.wrapper?.color.text || EBaseColors.primary,
              }}
              className={styles.text}
            >
              {getUserDisplayName(config?.data)}
            </p>
          )}
          <Tooltip
            title={translate("button.avatar", { ns: "trusted-widget" })}
            arrow
          >
            <button
              onClick={handleClick}
              className={styles.button}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={{
                color: customStyles.text,
                backgroundColor: isHovered
                  ? config.profile?.button?.color.hover || EBaseColors.hover
                  : config?.profile?.wrapper?.color.background,
              }}
            >
              {config?.data?.picture ? (
                <Avatar
                  src={getImageURL(config?.data.picture)}
                  className={styles.buttonImage}
                />
              ) : (
                <Avatar
                  className={clsx(styles.buttonImage)}
                  style={{
                    backgroundColor:
                      config?.profile?.button?.color.background ||
                      EBaseColors.hover,
                  }}
                >
                  <PersonIcon
                    style={{
                      color:
                        config?.profile?.button?.color.text ||
                        EBaseColors.secondary,
                    }}
                  />
                </Avatar>
              )}
            </button>
          </Tooltip>

          {config?.data.catalog && (
            <CatalogPopover
              isOpen={isOpenCatalog}
              anchorEl={anchorCatalog}
              onClose={handleClose}
              profile={config?.data}
              config={config}
            />
          )}

          <AccountPopover
            isOpen={isOpen}
            anchorEl={anchorEl}
            onClose={handleClose}
            profile={config?.data}
            config={config}
          />
        </div>
      </>
    );
  }

  return (
    <div>
      <CustomButton
        config={config}
        content={{
          text:
            typeof config?.loginButton?.text === "string"
              ? config.loginButton?.text
              : EDefaultConfigValues.loginButton,
          link: "",
          type: EDefaultConfigValues.loginType,
        }}
        icon={config?.loginButton?.icon}
        customStyles={
          config?.loginButton?.customStyles || customStyles.primaryButton
        }
        onClick={config.loginButton?.onClick}
      />
    </div>
  );
};
