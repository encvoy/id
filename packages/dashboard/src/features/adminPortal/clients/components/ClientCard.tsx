import BookmarksOutlinedIcon from "@mui/icons-material/BookmarksOutlined";
import InsertLinkOutlinedIcon from "@mui/icons-material/InsertLinkOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import SwapHorizontalCircleOutlined from "@mui/icons-material/SwapHorizontalCircleOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import clsx from "clsx";
import { FC } from "react";
import { getImageURL } from "src/shared/utils/helpers";
import { IClient } from "src/shared/api/clients";
import { TShortProvider } from "src/shared/api/provider";
import { CustomIcon } from "@encvoy-id/components";
import { Card, ICardProps } from "@encvoy-id/components";
import { DetailRow } from "@encvoy-id/components";
import { IconWithTooltip } from "@encvoy-id/components";
import styles from "./ClientCard.module.css";
import { useTranslation } from "react-i18next";
import Typography from "@mui/material/Typography";
import { getLocalizedTextValue } from "src/shared/utils/locales";

export interface IClientCardProps extends ICardProps {
  items: IClient[];
  index: number;
  onClick?: (id?: string) => void;
}

const ClientCardComponent: FC<IClientCardProps> = (props) => {
  const { t: translate, i18n } = useTranslation();
  const { items, index, onClick } = props;
  const client = items[index] || {};

  const textWrapper = (text: string) => {
    return client ? text || "" : translate("helperText.loading");
  };

  const renderProviders = (items: { provider: TShortProvider }[]) => {
    const providers = items?.slice(0, 4);
    const hiddenCount = items?.length - 4;
    const hasHiddenProviders = hiddenCount > 0;

    if (!providers?.length) {
      return (
        <Typography
          color="custom.error"
          className={clsx("text-14", styles.providersEmpty)}
        >
          {translate("pages.listClient.providersEmpty")}
        </Typography>
      );
    }

    return (
      <div className={styles.providersList}>
        {providers.map(({ provider }) => (
          <div key={provider?.id} onClick={(e) => e.stopPropagation()}>
            <IconWithTooltip
              customStyleButton={styles.providerButton}
              title={getLocalizedTextValue(provider?.name, i18n.language)}
              staticHover
            >
              {provider?.avatar ? (
                <Avatar
                  src={getImageURL(provider?.avatar)}
                  className={styles.providerIcon}
                />
              ) : (
                <CustomIcon
                  Icon={SwapHorizontalCircleOutlined}
                  sx={{ width: "35px", height: "35px" }}
                  className={styles.providerIcon}
                  color="textSecondary"
                />
              )}
            </IconWithTooltip>
          </div>
        ))}
        {hasHiddenProviders && (
          <Typography color="text.secondary" className="text-14">
            +{hiddenCount}
          </Typography>
        )}
      </div>
    );
  };

  return (
    <Card
      {...props}
      cardId={client?.client_id}
      dataTestId={`btn-application-${client?.client_id}`}
      isImage
      DefaultIcon={LayersOutlinedIcon}
      avatarUrl={getImageURL(client?.avatar)}
      onClick={onClick ? () => onClick(client?.client_id) : undefined}
      className={styles.card}
      content={
        <div className={styles.content}>
          <div className={styles.clientInfo}>
            <Box className={styles.clientMainInfo}>
              <Typography className={clsx("text-14", styles.hideText)}>
                {textWrapper(
                  getLocalizedTextValue(client?.name, i18n.language)
                )}
              </Typography>
              <Typography color="text.secondary" className={clsx("text-12")}>
                {textWrapper(
                  new Date(client?.created_at).toLocaleDateString(i18n.language)
                )}
              </Typography>
            </Box>
            <Box className={styles.clientAddInfo}>
              <DetailRow
                Icon={InsertLinkOutlinedIcon}
                value={textWrapper(client?.domain)}
                link={{ href: client?.domain || "", target: "_blank" }}
              />
              {client?.owner && (
                <DetailRow
                  Icon={PersonOutlineOutlinedIcon}
                  label={translate("pages.listClient.owner")}
                  value={client.owner.display_name}
                />
              )}
              <DetailRow
                Icon={PeopleAltOutlinedIcon}
                label={translate("pages.listClient.users")}
                value={textWrapper(client?._count?.Role.toString())}
              />
              {client?.parent && (
                <DetailRow
                  Icon={HomeWorkOutlinedIcon}
                  value={getLocalizedTextValue(
                    client.parent.name,
                    i18n.language
                  )}
                />
              )}
              {client?.catalog && (
                <DetailRow
                  Icon={BookmarksOutlinedIcon}
                  value={translate("pages.listClient.catalog")}
                />
              )}
            </Box>
            <Box className={styles.clientProviders}>
              <Typography color="text.secondary" className={clsx("text-12")}>
                {translate("pages.listClient.activeLoginMethods")}
              </Typography>
              {renderProviders(client?.Provider_relations)}
            </Box>
          </div>
        </div>
      }
    />
  );
};

export const ClientCard = ClientCardComponent;
