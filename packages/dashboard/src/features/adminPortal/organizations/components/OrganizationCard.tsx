import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import QueryStatsOutlinedIcon from "@mui/icons-material/QueryStatsOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import clsx from "clsx";
import { FC, MouseEventHandler, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { routes, tabs } from "src/shared/utils/enums";
import { RootState } from "src/app/store/store";
import { useSystemClientId } from "src/shared/hooks/useSystemClientId";
import { canTransferOrganizationOwner } from "src/shared/utils/userAccess";
import { Card, ICardProps } from "@encvoy-id/components";
import { CustomIcon } from "@encvoy-id/components";
import { MenuControls } from "@encvoy-id/components";
import { SubmitModal } from "@encvoy-id/components";
import { UserSearchModal } from "src/shared/ui/modal/UserSearchModal";
import { refreshTrustedWidgetProfile } from "src/packages/authWidget/helpers/auth";
import {
  IClient,
  TClientLocalizedName,
  useDeleteOrganizationMutation,
  useTransferOrganizationOwnerMutation,
} from "src/shared/api/clients";
import { setNoticeError, setNoticeInfo } from "src/shared/slices/noticesSlice";
import { getLocalizedTextValue } from "src/shared/utils/locales";
import { getUserDisplayName } from "src/shared/utils/userDisplayName";
import styles from "./OrganizationCard.module.css";

export interface IOrganizationCardProps extends ICardProps {
  items: IClient[];
  index: number;
  updateItems: (items: IClient[], totalCount: number) => void;
}

const getOwnerName = (owner?: IClient["owner"]) => {
  if (!owner) {
    return "";
  }

  return owner.display_name || owner.email || "";
};

const OrganizationCardComponent: FC<IOrganizationCardProps> = (props) => {
  const { items, index, updateItems } = props;
  const { t: translate, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const systemClientId = useSystemClientId();
  const profile = useSelector((state: RootState) => state.user.profile);

  const client = items[index] || {};
  const clientName =
    getLocalizedTextValue(
      client?.name as TClientLocalizedName,
      i18n.language
    ) || translate("helperText.loading");
  const ownerName = getOwnerName(client?.owner);
  const systemRole = profile.Role?.find(
    (item) => item.client_id === systemClientId
  )?.role;
  const organizationRole = profile.Role?.find(
    (item) => item.client_id === client.client_id
  )?.role;
  const canTransferOwner = canTransferOrganizationOwner({
    systemRole,
    organizationRole,
  });
  const membersCount = client?._count?.Role ?? 0;
  const activityCount = client?.activity_30d ?? 0;

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const [deleteOrganization, { isLoading: isDeleteLoading }] =
    useDeleteOrganizationMutation();
  const [transferOrganizationOwner] = useTransferOrganizationOwnerMutation();

  const handleOpenMenuControl: MouseEventHandler<HTMLButtonElement> = (
    event
  ) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenuControl = () => {
    setAnchorEl(null);
  };

  const navigateToId = () => {
    handleCloseMenuControl();
    navigate(`/${routes.customer}/${client?.client_id}/${tabs.settings}`);
  };

  const openDeleteModal = () => {
    handleCloseMenuControl();
    setIsDeleteModalOpen(true);
  };

  const openTransferOwnerUserSearch = () => {
    handleCloseMenuControl();
    setIsTransferModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const closeTransferModal = () => {
    setIsTransferModalOpen(false);
  };

  const handleDeleteOrganization = async () => {
    const nextItems = items.filter(
      (item) => item.client_id !== client.client_id
    );

    try {
      await deleteOrganization(client.client_id).unwrap();
      refreshTrustedWidgetProfile();
      updateItems(nextItems, nextItems.length);
      dispatch(setNoticeInfo(translate("info.infoUpdated")));
    } catch (error) {
      console.error("delete organization rejected", error);
      dispatch(setNoticeError(translate("info.updateError")));
    } finally {
      closeDeleteModal();
    }
  };

  const handleTransferOwner = async (selectedOwner: {
    user: {
      id: string;
      given_name?: string | null;
      family_name?: string | null;
      nickname?: string | null;
    };
  }) => {
    try {
      await transferOrganizationOwner({
        client_id: client.client_id,
        user_id: selectedOwner.user.id,
      }).unwrap();

      const nextOwnerName = getUserDisplayName(selectedOwner.user, true).trim();
      const nextOwnerSummary = {
        id: selectedOwner.user.id,
        display_name:
          nextOwnerName || selectedOwner.user.nickname || selectedOwner.user.id,
        email: null,
      };

      updateItems(
        items.map((item) =>
          item.client_id === client.client_id
            ? {
                ...item,
                owner: nextOwnerSummary,
              }
            : item
        ),
        items.length
      );

      refreshTrustedWidgetProfile();

      dispatch(setNoticeInfo(translate("info.infoUpdated")));
    } catch (error) {
      console.error("transfer owner rejected", error);
      dispatch(setNoticeError(translate("info.updateError")));
      throw error;
    }
  };

  const organizationControls = [
    {
      icon: HomeWorkOutlinedIcon,
      title: translate("pages.organizations.menuControls.id"),
      action: navigateToId,
    },
    ...(canTransferOwner
      ? [
          {
            icon: SwapHorizOutlinedIcon,
            title: translate("pages.organizations.menuControls.transferOwner"),
            action: openTransferOwnerUserSearch,
            addDivider: true,
          },
        ]
      : []),
    {
      icon: DeleteOutlineOutlinedIcon,
      title: translate("pages.organizations.menuControls.delete"),
      action: openDeleteModal,
    },
  ];

  return (
    <>
      <Card
        {...props}
        cardId={client?.client_id}
        dataTestId={`btn-organization-${client?.client_id}`}
        isImage
        DefaultIcon={HomeWorkOutlinedIcon}
        onClick={undefined}
        content={
          <div className={styles.content}>
            <div className={styles.main}>
              <Box className={styles.titleBlock}>
                <Typography className={clsx("text-14", styles.title)}>
                  {clientName}
                </Typography>
              </Box>

              <Box className={styles.details}>
                <div className={styles.row}>
                  <CustomIcon
                    Icon={PersonOutlineOutlinedIcon}
                    color="textSecondary"
                    className={styles.icon}
                  />
                  <Typography color="text.secondary" className="text-12">
                    {translate("owner")}{" "}
                    <span className={styles.value}>
                      {ownerName || translate("helperText.loading")}
                    </span>
                  </Typography>
                </div>

                <div className={styles.row}>
                  <CustomIcon
                    Icon={PeopleAltOutlinedIcon}
                    color="textSecondary"
                    className={styles.icon}
                  />
                  <Typography color="text.secondary" className="text-12">
                    {translate("pages.listClient.users")}{" "}
                    <span className={styles.value}>{membersCount}</span>
                  </Typography>
                </div>

                <div className={styles.row}>
                  <CustomIcon
                    Icon={QueryStatsOutlinedIcon}
                    color="textSecondary"
                    className={styles.icon}
                  />
                  <Typography color="text.secondary" className="text-12">
                    {translate("pages.organizations.labels.activity")}{" "}
                    <span className={styles.value}>
                      {activityCount}{" "}
                      {translate("pages.organizations.labels.activityPeriod")}
                    </span>
                  </Typography>
                </div>
              </Box>

              <Box className={styles.actionBlock}>
                <Button
                  variant="text"
                  color="secondary"
                  aria-describedby={client?.client_id}
                  onClick={handleOpenMenuControl}
                  className={styles.moreButton}
                  data-test-id={`btn-organization-open-menu-controls-${client?.client_id}`}
                >
                  <CustomIcon
                    Icon={MoreHorizOutlinedIcon}
                    color="textSecondary"
                  />
                </Button>
              </Box>
            </div>
          </div>
        }
      />

      {anchorEl ? (
        <MenuControls
          anchorEl={anchorEl}
          onClose={handleCloseMenuControl}
          controls={organizationControls}
        />
      ) : null}

      <SubmitModal
        cancelText={translate("actionButtons.cancel")}
        deleteText={translate("actionButtons.delete")}
        isOpen={isDeleteModalOpen}
        onSubmit={handleDeleteOrganization}
        onClose={closeDeleteModal}
        title={translate("pages.organizations.modals.delete.title")}
        actionButtonText={translate("actionButtons.delete")}
        disabled={isDeleteLoading}
        mainMessage={[
          translate("pages.organizations.modals.delete.mainMessage"),
        ]}
      />

      {canTransferOwner ? (
        <UserSearchModal
          isOpen={isTransferModalOpen}
          clientId={client?.client_id}
          disabledUserId={client?.owner?.id}
          title={translate("pages.organizations.modals.transferOwner.title")}
          mainMessage={[
            translate("pages.organizations.modals.transferOwner.mainMessage", {
              ownerName: ownerName || translate("helperText.loading"),
            }),
          ]}
          actionButtonText={translate(
            "pages.organizations.modals.transferOwner.action"
          )}
          placeholder={translate(
            "pages.organizations.modals.transferOwner.placeholder"
          )}
          helperText={translate(
            "pages.organizations.modals.transferOwner.helper"
          )}
          onClose={closeTransferModal}
          onSubmit={handleTransferOwner}
        />
      ) : null}
    </>
  );
};

export const OrganizationCard = OrganizationCardComponent;
