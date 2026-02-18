import Popover from "@mui/material/Popover";
import { FC, useEffect, useState, MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { generateStyles, getImageURL } from "../helpers/utils";
import {
  IUserProfile,
  BaseWidgetConfig,
  EDefaultConfigValues,
  EBaseColors,
} from "../types";
import styles from "./CatalogPopover.module.css";
import clsx from "clsx";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import BookmarkAddedIcon from "@mui/icons-material/BookmarkAdded";
import BookmarkAddOutlinedIcon from "@mui/icons-material/BookmarkAddOutlined";
import { ICatalogClient } from "src/shared/api/clients";

interface ICatalogPopoverProps {
  isOpen: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  profile: Partial<IUserProfile> | null;
  config: BaseWidgetConfig;
}

export const CatalogPopover: FC<ICatalogPopoverProps> = ({
  isOpen,
  anchorEl,
  onClose,
  profile,
  config,
}) => {
  const customStyles = generateStyles(config);
  const { t: translate } = useTranslation();
  const [groupedClients, setGroupedClients] = useState<
    Record<string, ICatalogClient[]>
  >({});
  const [catalogData, setCatalogData] = useState<ICatalogClient[]>([]);

  const fetchToggleStatus = async (isFavorite: boolean, clientId: string) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const params = new URLSearchParams({
        client_id: clientId,
      });
      const response = await fetch(
        (config?.issuer || EDefaultConfigValues.issuer) +
          "/api/v1/users/" +
          `${profile?.sub}` +
          "/favorite_clients" +
          `?${params}`,
        {
          method: isFavorite ? "DELETE" : "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
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
      await fetchCatalogData();
    } catch (error) {
      console.error("fetchUserData: Network/Parse error:", error);
    }
  };

  const fetchCatalogData = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const params = new URLSearchParams({
        sortBy: "created_at",
        search: "",
      });
      const response = await fetch(
        (config?.issuer || EDefaultConfigValues.issuer) +
          "/api/v1/catalog" +
          `?${params}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "fetchCatalogData: HTTP error response:",
          response.status,
          errorText
        );
        return;
      }

      const data = await response.json();
      setCatalogData(data);
    } catch (error) {
      console.error("fetchCatalogData: Network/Parse error:", error);
    }
  };

  useEffect(() => {
    fetchCatalogData();
  }, []);

  useEffect(() => {
    const grouped = (catalogData || []).reduce((acc, client) => {
      const typeName = client.type?.name || translate("global.catalog.other");

      if (client.favorite) {
        return acc;
      }

      if (!acc[typeName]) {
        acc[typeName] = [];
      }

      acc[typeName].push(client);
      return acc;
    }, {} as Record<string, ICatalogClient[]>);
    setGroupedClients(grouped);
  }, [catalogData, translate]);

  const handleToggleStatus = async (
    event: MouseEvent<HTMLButtonElement>,
    isFavorite: boolean,
    clientId: string
  ) => {
    event.stopPropagation();
    event.preventDefault();
    await fetchToggleStatus(isFavorite, clientId);
  };

  return (
    <Popover
      id="catalog-popover"
      open={isOpen}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "left",
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
      <div className={styles.container}>
        {!!catalogData.filter((item) => item.favorite).length && (
          <div className={styles.favorite}>
            <p
              className={styles.favoriteTitle}
              style={{
                color: customStyles.text,
              }}
            >
              {translate("global.catalog.favorite")}
            </p>

            <ul className={styles.listFavorite}>
              {catalogData
                .filter((item) => item.favorite)
                .map((item) => (
                  <li key={item.client_id} className={styles.listItem}>
                    <a href={item.domain} target="_blank" rel="noreferrer">
                      <div className={styles.client}>
                        {item.avatar ? (
                          <img
                            src={getImageURL(
                              item.avatar as string,
                              config.issuer || EDefaultConfigValues.issuer
                            )}
                            className={styles.clientImage}
                            alt={item.name}
                          />
                        ) : (
                          <LayersOutlinedIcon
                            className={clsx(
                              styles.clientImageDefault,
                              styles.clientImage
                            )}
                          />
                        )}
                        <p className={styles.clientText}>{item.name}</p>
                        <button
                          className={styles.button}
                          onClick={(event) => {
                            handleToggleStatus(
                              event,
                              item?.favorite,
                              item.client_id
                            );
                          }}
                        >
                          <BookmarkAddedIcon
                            sx={{
                              color:
                                config?.profile?.button?.color.background ||
                                EBaseColors.hover,
                            }}
                            className={styles.buttonIcon}
                          />
                        </button>
                      </div>
                    </a>
                  </li>
                ))}
            </ul>
          </div>
        )}
        {Object.keys(groupedClients).length === 0 && (
          <p
            className={styles.groupTitle}
            style={{
              color: customStyles.text,
            }}
          >
            {translate("global.catalog.noServices")}
          </p>
        )}
        <div>
          {Object.keys(groupedClients).map((typeName) => (
            <div key={typeName} className={styles.block}>
              <p
                key={`${typeName}-title`}
                className={styles.groupTitle}
                style={{
                  color: customStyles.text,
                }}
              >
                {typeName}
              </p>
              <ul className={styles.list}>
                {groupedClients[typeName]
                  .filter((item) => !item.favorite)
                  .map((client) => (
                    <li key={client.client_id} className={styles.listItem}>
                      <a href={client.domain} target="_blank" rel="noreferrer">
                        <div className={styles.client}>
                          {client.avatar ? (
                            <img
                              src={getImageURL(
                                client.avatar as string,
                                config.issuer || EDefaultConfigValues.issuer
                              )}
                              alt={client.name}
                              className={styles.clientImage}
                            />
                          ) : (
                            <LayersOutlinedIcon
                              className={clsx(
                                styles.clientImageDefault,
                                styles.clientImage
                              )}
                            />
                          )}
                          <p className={styles.clientText}>{client.name}</p>
                          <button
                            className={styles.button}
                            onClick={(event) => {
                              handleToggleStatus(
                                event,
                                client?.favorite,
                                client.client_id
                              );
                            }}
                          >
                            <BookmarkAddOutlinedIcon
                              sx={{ color: "#858ba0" }}
                              className={styles.buttonIcon}
                            />
                          </button>
                        </div>
                      </a>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Popover>
  );
};
