import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import Popover from "@mui/material/Popover";
import clsx from "clsx";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { generateStyles, getImageURL } from "../helpers/utils";
import {
  BaseWidgetConfig,
  EBaseColors,
  EDefaultConfigValues,
  IUserProfile,
} from "../types";
import styles from "./AccountPopover.module.css";
import { CustomButton } from "./CustomButton";

interface IAccountPopoverProps {
  isOpen: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  profile: Partial<IUserProfile> | null;
  config: BaseWidgetConfig;
}

export const AccountPopover: FC<IAccountPopoverProps> = ({
  isOpen,
  anchorEl,
  onClose,
  profile,
  config,
}) => {
  const customStyles = generateStyles(config);
  const { t } = useTranslation();
  const ClientsListSystem = profile?.lk?.filter(
    (item) => item.type === "client_system"
  );
  const ClientsListOrg = profile?.lk?.filter(
    (item) => item.type === "client_org"
  );
  const lkSystem = profile?.lk?.find((item) => item.type === "lk_system");
  const lkOrg = profile?.lk?.filter((item) => item.type === "lk_org") ?? [];
  const lkListAdmin = profile?.lk?.filter((item) => item.type === "lk_admin");
  return (
    <Popover
      id="accounts-popover"
      open={isOpen}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      classes={{
        paper: styles.popover,
      }}
      className={styles.popover}
      slotProps={{
        paper: {
          sx: {
            borderRadius: customStyles.borderRadius,
            backgroundColor: customStyles.background,
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
            padding: "16px",
            width: "100%",
            maxWidth: "280px",
          },
        },
      }}
    >
      <button
        onClick={onClose}
        data-test-id="btn-mini-widget-close"
        className={styles.closeButton}
      >
        <CloseIcon
          style={{
            color: customStyles.text,
          }}
        />
      </button>
      <div className={styles.account}>
        <div>
          {profile?.picture ? (
            <img
              src={getImageURL(
                profile.picture,
                config.issuer || EDefaultConfigValues.issuer
              )}
              alt={
                profile?.given_name ||
                profile?.nickname ||
                t("labels.user", { ns: "trusted-widget" })
              }
              className={styles.accountImage}
              style={{ borderColor: customStyles.text }}
            />
          ) : (
            <PersonIcon
              style={{
                width: "60px",
                height: "60px",
                color: customStyles.text,
                backgroundColor: EBaseColors.background,
              }}
              className={clsx(styles.accountImage, styles.accountImageDefault)}
            />
          )}
        </div>
        <p className={styles.text} style={{ color: customStyles.text }}>
          {profile?.given_name
            ? `${profile?.given_name ?? ""} ${
                profile?.family_name ?? ""
              }`.trim()
            : profile?.nickname || ""}
        </p>
        {profile?.email && (
          <p className={styles.text} style={{ color: customStyles.text }}>
            {profile?.email}
          </p>
        )}
      </div>

      <div className={styles.menuWrapper}>
        <div className={styles.menu}>
          {config.menuButtons?.map((item) => (
            <CustomButton
              key={item.text}
              config={config}
              customStyles={item.customStyles || customStyles.accountButton}
              content={item}
              icon={item.icon}
              onClick={item.onClick}
            />
          ))}
        </div>

        {/* render organization clients list */}
        {!!ClientsListOrg?.length && (
          <>
            <div className={styles.section}>
              <div className={styles.divider}></div>
              <p className={styles.sectionText}>
                {profile?.orgClient ||
                  t("labels.organization", { ns: "trusted-widget" })}
              </p>
              <div className={styles.divider}></div>
            </div>
            <div className={styles.menu}>
              {ClientsListOrg?.map((item) => (
                <CustomButton
                  icon={item.avatar}
                  key={item.text}
                  config={config}
                  content={item}
                  dataTestId={`btn-mini-widget-org-application-${item.text}`}
                  customStyles={customStyles.accountButton}
                />
              ))}
            </div>
          </>
        )}

        {/* render system clients list */}
        {!!ClientsListSystem?.length && (
          <>
            <div className={styles.section}>
              <div className={styles.divider}></div>
              <p className={styles.sectionText}>
                {profile?.systemClient ||
                  t("labels.mainServices", { ns: "trusted-widget" })}
              </p>
              <div className={styles.divider}></div>
            </div>
            <div className={styles.menu}>
              {ClientsListSystem?.map((item) => (
                <CustomButton
                  icon={item.avatar}
                  key={item.text}
                  config={config}
                  content={item}
                  dataTestId={`btn-mini-widget-system-application-${item.text}`}
                  customStyles={customStyles.accountButton}
                />
              ))}
            </div>
          </>
        )}

        <div className={styles.menu}>
          {lkSystem ? (
            <div>
              <div className={styles.section}>
                <div className={styles.divider}></div>
                <p className={styles.sectionText}>
                  {profile?.systemClient ||
                    t("labels.mainServices", { ns: "trusted-widget" })}
                </p>
                <div className={styles.divider}></div>
              </div>
              <CustomButton
                icon={lkSystem.avatar}
                config={config}
                content={{
                  ...lkSystem,
                  text: t("button.id", { ns: "trusted-widget" }),
                }}
                customStyles={customStyles.accountButton}
                dataTestId="btn-mini-widget-system-account"
                onClose={onClose}
              />
            </div>
          ) : (
            <></>
          )}
          {lkOrg.map((item) => (
            <CustomButton
              icon={item.avatar}
              key={item.client_id || item.text}
              config={config}
              content={item}
              customStyles={customStyles.accountButton}
              dataTestId={`btn-mini-widget-organization-${
                item.client_id || item.text
              }`}
              onClose={onClose}
            />
          ))}
          {lkListAdmin?.map((item) => (
            <CustomButton
              icon={item.avatar}
              key={item.text}
              config={config}
              content={item}
              customStyles={customStyles.accountButton}
              dataTestId="btn-mini-widget-adm"
              onClose={onClose}
            />
          ))}
        </div>
        <div className={styles.buttons}>
          <CustomButton
            config={config}
            content={{
              text: t("button.profile", { ns: "trusted-widget" }),
              type: "lk_personal",
              link:
                profile?.lk?.find((item) => item.type === "lk_personal")
                  ?.link || "",
            }}
            customStyles={customStyles.primaryButton}
            dataTestId="btn-mini-widget-profile"
            onClose={onClose}
          />

          <CustomButton
            config={config}
            content={{
              text: t("button.exit", { ns: "trusted-widget" }),
              type: "logout",
              link: "",
            }}
            customStyles={customStyles.secondaryButton}
            dataTestId="btn-mini-widget-logout-account"
            onClick={config.logoutButtonFn}
          />
        </div>
      </div>
    </Popover>
  );
};
