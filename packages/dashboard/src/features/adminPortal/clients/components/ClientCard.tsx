import BookmarksOutlinedIcon from "@mui/icons-material/BookmarksOutlined";
import InsertLinkOutlinedIcon from "@mui/icons-material/InsertLinkOutlined";
import SwapHorizontalCircleOutlined from "@mui/icons-material/SwapHorizontalCircleOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import clsx from "clsx";
import { FC } from "react";
import { getImageURL } from "src/shared/utils/helpers";
import { IClient } from "src/shared/api/clients";
import { TShortProvider } from "src/shared/api/provider";
import { CustomIcon } from "../../../../shared/ui/components/CustomIcon";
import { Card, ICardProps } from "../../../../shared/ui/components/Card";
import { IconWithTooltip } from "../../../../shared/ui/components/IconWithTooltip";
import styles from "./ClientCard.module.css";
import { useTranslation } from "react-i18next";
import Typography from "@mui/material/Typography";

export interface IClientCardProps extends ICardProps {
  items: IClient[];
  index: number;
  onClick: (id?: string) => void;
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
              title={provider?.name}
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
      isImage
      DefaultIcon={LayersOutlinedIcon}
      avatarUrl={client?.avatar}
      onClick={() => onClick(client?.client_id)}
      className={styles.card}
      content={
        <div className={styles.content}>
          <div className={styles.clientInfo}>
            <Box className={styles.clientMainInfo}>
              <Typography className={clsx("text-14", styles.hideText)}>
                {textWrapper(client?.name)}
              </Typography>
              <Typography color="text.secondary" className={clsx("text-12")}>
                {textWrapper(
                  new Date(client?.created_at).toLocaleDateString(i18n.language)
                )}
              </Typography>
            </Box>
            <Box className={styles.clientAddInfo}>
              <div className={styles.rowWithIcon}>
                <CustomIcon
                  Icon={InsertLinkOutlinedIcon}
                  color="textSecondary"
                  className={styles.icon}
                />
                <Typography className={clsx("text-12", styles.hideText)}>
                  <Link
                    className={styles.clientLink}
                    href={client?.domain}
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {textWrapper(client?.domain)}
                  </Link>
                </Typography>
              </div>
              <div className={styles.rowWithIcon}>
                <CustomIcon
                  Icon={PeopleAltOutlinedIcon}
                  color="textSecondary"
                  className={styles.icon}
                />
                <Typography color="text.secondary" className={"text-12"}>
                  {translate("pages.listClient.users")}
                  <span className={clsx("text-14", styles.textNumber)}>
                    {textWrapper(client?._count?.Role.toString())}
                  </span>
                </Typography>
              </div>
              {client?.parent && (
                <div className={styles.rowWithIcon}>
                  <CustomIcon
                    Icon={HomeWorkOutlinedIcon}
                    color="textSecondary"
                    className={styles.icon}
                  />
                  <Typography color="text.secondary" className="text-12">
                    {client.parent.name}
                  </Typography>
                </div>
              )}
              {client?.catalog && (
                <div className={styles.rowWithIcon}>
                  <CustomIcon
                    Icon={BookmarksOutlinedIcon}
                    color="textSecondary"
                    className={styles.icon}
                  />
                  <Typography color="text.secondary" className="text-12">
                    {translate("pages.listClient.catalog")}
                  </Typography>
                </div>
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
