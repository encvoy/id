import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import TurnLeftOutlinedIcon from "@mui/icons-material/TurnLeftOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import clsx from "clsx";
import {
  Dispatch,
  FC,
  MouseEventHandler,
  SetStateAction,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useDeleteSessionMutation } from "src/shared/api/clients";
import { IScope, useRevokeScopesMutation } from "src/shared/api/users";
import { CustomIcon } from "../../../shared/ui/components/CustomIcon";
import { ISubmitModalProps } from "src/shared/ui/modal/SubmitModal";
import { Card, ICardProps } from "../../../shared/ui/components/Card";
import { IconWithTooltip } from "../../../shared/ui/components/IconWithTooltip";
import { MenuControls } from "../../../shared/ui/components/MenuControls";
import styles from "./ScopeCard.module.css";
import { getScopeProps } from "./utils";
import Typography from "@mui/material/Typography";

export interface ICardScopeProps extends ICardProps {
  userId: string;
  items: IScope[];
  index: number;
  setModalProps: Dispatch<SetStateAction<ISubmitModalProps>>;
  updateItems: (items: IScope[], totalCount: number) => void;
}

const CardScope: FC<ICardScopeProps> = (props) => {
  const { userId, items, index, setModalProps, updateItems } = props;
  const { t: translate, i18n } = useTranslation();

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const [revokeScopes] = useRevokeScopesMutation();
  const [deleteSession] = useDeleteSessionMutation();

  const { client, scopes, created_at } = items[index] || {};
  const id = client?.client_id;
  const loading = translate("helperText.loading");
  const currentLanguage = i18n.language;
  const date = created_at ? new Date(created_at) : null;

  const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const onCloseModal = () =>
    setModalProps((prev) => {
      return { ...prev, isOpen: false };
    });

  const handleDeleteScopes = async () => {
    try {
      await revokeScopes({ userId, clientId: id }).unwrap();
      const newItems = [...items];
      newItems.splice(index, 1);
      updateItems(newItems, newItems.length);
    } catch (error) {
      console.error("rejected", error);
    }
  };

  const handleDeleteSessions = async () => {
    try {
      await deleteSession({ userId, clientId: id }).unwrap();
    } catch (error) {
      console.error("rejected", error);
    }
  };

  const modalPrams = [
    {
      onSubmit: () => {
        handleDeleteSessions();
        onCloseModal();
      },
      title: translate("pages.scopes.modals.deleteSessions.title"),
      actionButtonText: translate("actionButtons.delete"),
      mainMessage: [
        translate("pages.scopes.modals.deleteSessions.mainMessage", {
          clientName: client?.name,
        }),
      ],
    },
    {
      onSubmit: () => {
        handleDeleteScopes();
        onCloseModal();
      },
      title: translate("pages.scopes.modals.revokeScopes.title"),
      actionButtonText: translate("actionButtons.revoke"),
      mainMessage: [
        translate("pages.scopes.modals.revokeScopes.mainMessage", {
          clientName: client?.name,
        }),
      ],
    },
  ];

  const scopeControls = [
    {
      icon: LogoutOutlinedIcon,
      title: translate("pages.scopes.controls.deleteSessions"),
      action: async () => {
        handleClose();
        setModalProps({
          isOpen: true,
          onClose: onCloseModal,
          ...modalPrams[0],
        });
      },
      addDivider: true,
    },
    {
      icon: TurnLeftOutlinedIcon,
      title: translate("pages.scopes.controls.revokeScopes"),
      action: () => {
        handleClose();
        setModalProps({
          isOpen: true,
          onClose: onCloseModal,
          ...modalPrams[1],
        });
      },
    },
  ];

  return (
    <Card
      {...props}
      cardId={id}
      avatarUrl={client?.avatar}
      isImage
      content={
        <div className={styles.contentWrapper}>
          <div className={styles.content}>
            <div className={styles.clientInfo}>
              <Box className={styles.clientMainInfo}>
                <Link className={styles.clientTitle} href={client?.domain}>
                  {client?.name || loading}
                </Link>
                <Typography color="text.secondary" className="text-12">
                  {date?.toLocaleDateString(currentLanguage) || loading}
                </Typography>
              </Box>
              <div className={styles.clientAddInfo}>
                {client?.description && (
                  <div className={styles.clientDescription}>
                    <Typography color="text.secondary" className="text-12">
                      {translate("pages.scopes.clientDescription")}
                    </Typography>
                    <Typography className={clsx("text-12")}>
                      {client?.description || loading}
                    </Typography>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.clientScopesInfo}>
              <Typography color="text.secondary" className={clsx("text-12")}>
                {translate("pages.scopes.grantedPermissions")}
              </Typography>
              <Box className={styles.scopesList}>
                {scopes?.map((scope, index) => {
                  const scopeProps = getScopeProps(scope, translate);
                  return (
                    <IconWithTooltip
                      key={index}
                      Icon={scopeProps.icon}
                      title={scopeProps.description}
                      customStyleButton={styles.scopeIconButton}
                      staticHover
                    />
                  );
                })}
              </Box>
            </div>
          </div>
          <div className={styles.moreButtonWrapper}>
            <Button
              variant="text"
              color="secondary"
              data-id="open-menu-controls-button"
              aria-describedby={id}
              onClick={handleClick}
              className={styles.moreButton}
            >
              <CustomIcon Icon={MoreHorizOutlinedIcon} color="textSecondary" />
            </Button>
            <MenuControls
              anchorEl={anchorEl}
              onClose={handleClose}
              controls={scopeControls}
            />
          </div>
        </div>
      }
    />
  );
};

export default CardScope;
