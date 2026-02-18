import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import DashboardCustomizeOutlinedIcon from "@mui/icons-material/DashboardCustomizeOutlined";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import clsx from "clsx";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { tabs } from "src/shared/utils/enums";
import { getImageURL } from "src/shared/utils/helpers";
import { TAppSlice } from "src/shared/lib/appSlice";
import { IClientFull, useDeleteClientMutation } from "src/shared/api/clients";
import { CustomIcon } from "../../../../shared/ui/components/CustomIcon";
import { SubmitModal } from "src/shared/ui/modal/SubmitModal";
import styles from "./ClientDetailsHeader.module.css";
import Typography from "@mui/material/Typography";
import { componentBorderRadius } from "src/shared/theme/Theme";

interface IHeaderProps {
  client?: IClientFull;
  startRoutePath: TAppSlice["startRoutePath"];
}

const HeaderComponent: FC<IHeaderProps> = ({ client, startRoutePath }) => {
  const { t: translate } = useTranslation();
  const navigate = useNavigate();
  const { appId = "", clientId = "" } =
    useParams<{ appId: string; clientId: string }>();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [deleteClient, result] = useDeleteClientMutation();
  useEffect(() => {
    if (result.isSuccess) {
      setDeleteModalOpen(false);
      navigate(`/${startRoutePath}/${appId}/${tabs.clients}`);
    }
  }, [result]);

  const handleDelete = () => {
    deleteClient(clientId ?? "");
  };

  return (
    <div className={styles.header}>
      <Box
        className={styles.headerContent}
        sx={{ borderRadius: componentBorderRadius }}
      >
        <Box className={styles.headerAvatar}>
          {client?.avatar ? (
            <Avatar
              src={getImageURL(client.avatar)}
              className={styles.avatar}
            />
          ) : (
            <CustomIcon
              Icon={LayersOutlinedIcon}
              color="textSecondary"
              className={styles.avatar}
            />
          )}
        </Box>
        <Box className={styles.headerInfo}>
          <Typography className="text-20-medium">{client?.name}</Typography>
          <div className={styles.headerButtons}>
            <Tooltip title={translate("pages.clientDetails.widgetTooltip")}>
              <Button
                data-id="widget-button"
                variant="contained"
                component="label"
                color="secondary"
                onClick={() =>
                  navigate(
                    `/${startRoutePath}/${appId}/${tabs.clients}/${clientId}/${tabs.widget}`
                  )
                }
                startIcon={
                  <DashboardCustomizeOutlinedIcon
                    classes={{ root: styles.buttonIcon }}
                  />
                }
              />
            </Tooltip>
            <Tooltip title={translate("pages.clientDetails.settingsTooltip")}>
              <Button
                data-id="settings-button"
                variant="contained"
                component="label"
                color="secondary"
                onClick={() =>
                  navigate(
                    `/${startRoutePath}/${appId}/${tabs.clients}/${clientId}/${tabs.settings}`
                  )
                }
                startIcon={
                  <SettingsOutlinedIcon classes={{ root: styles.buttonIcon }} />
                }
              />
            </Tooltip>
            <Tooltip title={translate("pages.clientDetails.deleteAppTooltip")}>
              <Button
                data-id="delete-button"
                variant="contained"
                component="label"
                color="secondary"
                onClick={() => setDeleteModalOpen(true)}
                startIcon={
                  <DeleteOutlineOutlinedIcon
                    classes={{ root: styles.buttonIcon }}
                  />
                }
              />
            </Tooltip>
          </div>
        </Box>
      </Box>
      <Box
        className={styles.descriptionContent}
        sx={{ borderRadius: componentBorderRadius }}
      >
        <div className={styles.descriptionHeader}>
          <CustomIcon
            Icon={InfoOutlinedIcon}
            className={styles.icon}
            color="textSecondary"
          />
          <Typography className="text-15-medium">
            {translate("pages.clientDetails.descriptionTitle")}
          </Typography>
        </div>
        <Typography className={clsx("text-14", styles.descriptionText)}>
          {!client?.description
            ? translate("pages.clientDetails.noDescription")
            : client?.description}
        </Typography>
      </Box>
      <SubmitModal
        title={translate("pages.clientDetails.modals.deleteClient.title")}
        mainMessage={[
          translate("pages.clientDetails.modals.deleteClient.mainMessage", {
            projectName: client?.name,
          }),
        ]}
        isOpen={deleteModalOpen}
        onSubmit={() => handleDelete()}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};

export const ClientDetailsHeader = HeaderComponent;
