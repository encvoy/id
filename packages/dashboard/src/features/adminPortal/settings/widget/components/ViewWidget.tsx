import ContrastIcon from "@mui/icons-material/Contrast";
import LanguageIcon from "@mui/icons-material/Language";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { Box, IconButton } from "@mui/material";
import Avatar from "@mui/material/Avatar";
import clsx from "clsx";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import {
  EGetProviderAction,
  ProviderType,
  useGetProvidersQuery,
} from "src/shared/api/provider";
import { useGetSettingsQuery } from "src/shared/api/settings";
import { getImageURL } from "src/shared/utils/helpers";
import styles from "./ViewWidget.module.css";
import { COPYRIGHT } from "src/shared/utils/constants";
import { useGetClientInfoQuery } from "src/shared/api/clients";
import DOMPurify from "dompurify";
import SwapHorizontalCircleOutlined from "@mui/icons-material/SwapHorizontalCircleOutlined";
import { CustomIcon } from "src/shared/ui/components/CustomIcon";

export const ViewWidget: FC = () => {
  const { t: translate, i18n } = useTranslation();
  const { appId = "", clientId = "" } =
    useParams<{ appId: string; clientId: string }>();
  const { data: dataSettings } = useGetSettingsQuery();
  const { data: client } = useGetClientInfoQuery({
    id: clientId || appId,
  });

  const { data: providers = [] } = useGetProvidersQuery({
    client_id: clientId || appId,
    query: {
      only_active: true,
      action: EGetProviderAction.all,
    },
  });

  let label = translate("pages.widget.enterLabel");
  let allowedLoginFields: string[] = [];
  if (dataSettings?.allowed_login_fields) {
    allowedLoginFields = dataSettings?.allowed_login_fields.trim().split(" ");
    for (let index = 0; index < allowedLoginFields.length; index++) {
      const element = allowedLoginFields[index];

      if (allowedLoginFields.length > 1 && index !== 0) {
        label +=
          index === allowedLoginFields.length - 1
            ? translate("pages.widget.or")
            : ",";
      }

      switch (element) {
        case "login":
          label += translate("pages.widget.login");
          break;
        case "email":
          label += translate("pages.widget.email");
          break;
        case "phone_number":
          label += translate("pages.widget.phone");
          break;
      }
    }
  }

  const smallProviders = providers.filter(
    (provider) =>
      provider.type !== ProviderType.CREDENTIALS && provider.groupe === "SMALL"
  );
  const smallProvidersLine = smallProviders.slice(
    0,
    smallProviders.length > 5 ? 4 : 5
  );

  return (
    <div
      style={{ backgroundImage: `url(${getImageURL(client?.cover)})` }}
      className={styles.widgetBack}
    >
      <Box className={styles.widget}>
        {client?.show_avatar_in_widget && (
          <div className={styles.logo}>
            <Avatar variant={"square"} src={getImageURL(client?.avatar)} />
          </div>
        )}
        <div className={styles.header}>
          <IconButton className={styles.iconButton}>
            <ContrastIcon className={styles.icon} />
          </IconButton>
          <p className={styles.title}>
            {client?.widget_title
              .replace("WIDGET_APP_NAME", client.name)
              .replace("APP_NAME", client.name)}
          </p>
          <IconButton className={styles.iconButton}>
            <LanguageIcon className={styles.icon} />
          </IconButton>
        </div>
        <div className={styles.main}>
          <div className={styles.toggles}>
            <div className={clsx(styles.toggle, styles.active)}>
              {translate("pages.widget.preview.toggleLogin")}
            </div>
            <div className={styles.toggle}>
              {translate("pages.widget.preview.toggleSessions")}
            </div>
          </div>
          {!!providers.find(
            (provider) => provider.type === ProviderType.CREDENTIALS
          ) && (
            <>
              <div className={styles.label}>
                <input
                  placeholder={label}
                  name="name"
                  className={styles.input}
                  type="text"
                />
              </div>
              <div
                className={styles.button}
                style={{
                  backgroundColor: client?.widget_colors.button_color,
                  color: client?.widget_colors.font_color,
                }}
              >
                {translate("pages.widget.preview.logIn")}
              </div>
            </>
          )}
          {!client?.hide_widget_create_account && (
            <div className={clsx(styles.button, styles.buttonSecondary)}>
              {translate("pages.widget.preview.createAccount")}
            </div>
          )}
          {providers
            .filter(
              (provider) =>
                provider.type !== ProviderType.CREDENTIALS &&
                provider.groupe === "BIG"
            )
            .sort((a, b) => a.index - b.index)
            .map((provider) => (
              <div
                key={provider.id}
                className={styles.button}
                style={{
                  backgroundColor: client?.widget_colors.button_color,
                  color: client?.widget_colors.font_color,
                }}
              >
                {!client?.hide_avatars_of_big_providers && (
                  <Avatar
                    src={getImageURL(provider?.avatar)}
                    className={styles.buttonIcon}
                  >
                    {!provider.avatar && (
                      <CustomIcon
                        Icon={SwapHorizontalCircleOutlined}
                        sx={{ width: "35px", height: "35px" }}
                      />
                    )}
                  </Avatar>
                )}
                {provider?.name}
              </div>
            ))}
          {!!smallProvidersLine.length && (
            <>
              <p className={styles.text}>
                {translate("pages.widget.preview.otherProvider")}
              </p>
              <div className={styles.actions}>
                {smallProvidersLine
                  .sort((a, b) => a.index - b.index)
                  ?.map((provider) => (
                    <Avatar
                      key={provider?.id}
                      src={getImageURL(provider?.avatar)}
                      className={styles.providerIcon}
                    >
                      {!provider.avatar && (
                        <CustomIcon
                          color="textSecondary"
                          Icon={SwapHorizontalCircleOutlined}
                          sx={{ width: "35px", height: "35px" }}
                        />
                      )}
                    </Avatar>
                  ))}
                {smallProviders.length > 5 && (
                  <IconButton className={styles.moreButton}>
                    <MoreHorizIcon />
                  </IconButton>
                )}
              </div>
            </>
          )}
        </div>
        {client?.widget_info && (
          <div
            className={styles.preview}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(client?.widget_info),
            }}
          />
        )}
        {!client?.hide_widget_footer && !!COPYRIGHT[i18n.language] && (
          <div className={styles.footer}>
            <div className={styles.divider}></div>
            <p className={styles.footerText}>{COPYRIGHT[i18n.language]}</p>
          </div>
        )}
      </Box>
      {client?.widget_info_out && (
        <div
          className={styles.preview}
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(client?.widget_info_out),
          }}
        />
      )}
    </div>
  );
};
