import AppsIcon from "@mui/icons-material/Apps";
import PersonIcon from "@mui/icons-material/Person";
import { Avatar, IconButton, Tooltip } from "@mui/material";
import clsx from "clsx";
import { changeLanguage } from "i18next";
import { FC, MouseEventHandler, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CatalogPopover } from "src/packages/authWidget/components/CatalogPopover";
import {
  decodeJWT,
  getTokenByRefreshToken,
  getTokensByCode,
  getUrlParams,
  isTokenValid,
  login,
  setDataToLocalStorage,
} from "../helpers/auth";
import { generateStyles, getImageURL } from "../helpers/utils";
import {
  EBaseColors,
  EDefaultConfigValues,
  InfoWidgetConfig,
  IUserProfile,
  WidgetConfig,
} from "../types";
import { AccountPopover } from "./AccountPopover";
import { CustomButton } from "./CustomButton";
import styles from "./Widget.module.css";

interface WidgetProps {
  config: WidgetConfig;
}

export const Widget: FC<WidgetProps> = ({ config }) => {
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
      setExp(Number(expiresIn));
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

  const fetchUserData = async () => {
    try {
      const response = await fetch(
        (config?.issuer || EDefaultConfigValues.issuer) +
          (config?.userInfoEndPoint || EDefaultConfigValues.userInfoEndPoint),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

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

      //verify and update language to localStorage
      if (localStorage.getItem("locale") !== data.locale) {
        changeLanguage(data.locale || "ru-RU");
      }
      localStorage.setItem("locale", data.locale || "ru-RU");

      setProfile(data);
    } catch (error) {
      console.error("fetchUserData: Network/Parse error:", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUserData();
    }
  }, [token]);

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
      return `${profile.given_name} ${profile.family_name ?? ""}`.trim();
    }
    return profile.nickname;
  };

  if (token && profile) {
    return (
      <>
        {profile.catalog && (
          <IconButton
            className={styles.button}
            sx={{ marginRight: "8px" }}
            onClick={(event) => setAnchorCatalog(event.currentTarget)}
          >
            <AppsIcon
              sx={{
                color:
                  config?.profile?.button?.color.background ||
                  EBaseColors.hover,
              }}
            />
          </IconButton>
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
          <Tooltip title={translate("button.avatar", { ns: "widget" })} arrow>
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
        {config?.data.catalog && (
          <IconButton
            className={styles.button}
            sx={{ marginRight: "8px" }}
            onClick={(event) => setAnchorCatalog(event.currentTarget)}
          >
            <AppsIcon
              sx={{
                color:
                  config?.profile?.button?.color.background ||
                  EBaseColors.hover,
              }}
            />
          </IconButton>
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
          <Tooltip title={translate("button.avatar", { ns: "widget" })} arrow>
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
