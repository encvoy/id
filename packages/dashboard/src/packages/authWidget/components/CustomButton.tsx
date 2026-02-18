import AddIcon from "@mui/icons-material/Add";
import HomeRepairServiceOutlinedIcon from "@mui/icons-material/HomeRepairServiceOutlined";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import clsx from "clsx";
import { FC, isValidElement, ReactNode, useState } from "react";
import { routes, tabs } from "src/shared/utils/enums";
import { logout } from "../helpers/auth";
import { generateStyles } from "../helpers/utils";
import {
  BaseWidgetConfig,
  EButtonTypes,
  EDefaultConfigValues,
  IComponentStyles,
  IMenuButton,
} from "../types";
import styles from "./CustomButton.module.css";

interface ICustomButtonProps {
  config: BaseWidgetConfig;
  content: IMenuButton;
  customStyles: IComponentStyles;
  icon?: ReactNode | string;
  onClose?: () => void;
  onClick?: () => void;
}

export const CustomButton: FC<ICustomButtonProps> = ({
  config,
  content,
  customStyles,
  icon,
  onClose,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const globalStyles = generateStyles(config);
  const { position, borderRadius, padding, isHideIcon } = customStyles;
  const { background, text, hover } = customStyles.color;

  const handleNavigate = async (link?: string, type?: string) => {
    switch (type) {
      case EButtonTypes.logout:
        if (onClick) {
          onClick();
        } else {
          logout();
        }
        break;
      case EButtonTypes.sso:
        if (link) {
          const accessToken = localStorage.getItem("accessToken");
          const response = await fetch(link, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          });
          const res = await response.json();
          window.location.href = `/${routes.customer}/${res.orgId}/${tabs.settings}`;
        }
        break;
      default:
        if (onClick) {
          onClick();
          return;
        }
        if (
          config.routerMainFn &&
          (type === "lk_personal" ||
            type === "lk_system" ||
            type === "lk_org" ||
            type === "lk_admin")
        ) {
          if (onClose) {
            onClose();
          }
          config.routerMainFn(type);
          return;
        } else {
          window.location.href =
            link || config.issuer || EDefaultConfigValues.issuer;
        }
    }
  };

  const getIcon = (type?: string) => {
    if (typeof icon === "string") {
      return (
        <img src={icon} className={styles.buttonIcon} alt={content.text} />
      );
    } else if (isValidElement(icon)) {
      return icon;
    }

    switch (type) {
      case EButtonTypes.login:
      case EButtonTypes.logout:
        return <LogoutIcon className={styles.buttonIcon} />;
      case EButtonTypes.personal:
        return <PersonIcon className={styles.buttonIcon} />;
      case EButtonTypes.system:
      case EButtonTypes.org:
        return <HomeWorkOutlinedIcon className={styles.buttonIcon} />;
      case EButtonTypes.sso:
        return (
          <AddIcon className={clsx(styles.buttonIcon, styles.addIconWrapper)} />
        );
      case EButtonTypes.admin:
        return <HomeRepairServiceOutlinedIcon className={styles.buttonIcon} />;
      default:
        return;
    }
  };

  return (
    <button
      onClick={() => handleNavigate(content?.link, content.type)}
      className={clsx(
        styles.button,
        hover ? "" : styles.buttonHover,
        position === "center" && styles.buttonCenter,
        content.type === "logout" &&
          background === globalStyles.primaryButton.color.background
          ? styles.logoutButton
          : ""
      )}
      style={{
        color: text,
        backgroundColor: isHovered && hover ? hover : background,
        borderRadius: borderRadius || globalStyles.borderRadius,
        padding: padding || "12px 16px",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!isHideIcon && getIcon(content.type)}
      {content.text}
    </button>
  );
};
