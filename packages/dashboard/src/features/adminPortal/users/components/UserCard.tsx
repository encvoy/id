import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import clsx from "clsx";
import {
  Dispatch,
  FC,
  MouseEventHandler,
  SetStateAction,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { ERoles } from "src/shared/utils/enums";
import { getImageURL } from "src/shared/utils/helpers";
import { setNoticeError, setNoticeInfo } from "src/shared/lib/noticesSlice";
import {
  IClientFull,
  useDeleteSessionMutation,
  useDeleteUserRoleClientMutation,
  useUpdateUserRoleClientMutation,
} from "src/shared/api/clients";
import {
  IUserShort,
  TUserWithRole,
  useBlockUserMutation,
  useDeleteUserMutation,
  useUnblockUserMutation,
} from "src/shared/api/users";
import { RootState } from "src/app/store/store";
import { CustomIcon } from "../../../../shared/ui/components/CustomIcon";
import { ModalInfo } from "src/shared/ui/modal/ModalInfo";
import { ISubmitModalProps } from "src/shared/ui/modal/SubmitModal";
import { ActionButtons } from "src/shared/ui/components/ActionButtons";
import { Card, ICardProps } from "src/shared/ui/components/Card";
import { MenuControls } from "src/shared/ui/components/MenuControls";
import styles from "./UserCard.module.css";
import { getDisplayName } from "../utils";
import { FormControlLabel, Radio } from "@mui/material";
import Typography from "@mui/material/Typography";

export interface IUserCardProps extends ICardProps {
  items: TUserWithRole[];
  index: number;
  onClick: (userId?: number) => void;
  setConfirmModalProps: Dispatch<SetStateAction<ISubmitModalProps>>;
  updateItems: (items: TUserWithRole[], totalCount: number) => void;
  client?: IClientFull;
}

const UserCardComponent: FC<IUserCardProps> = (props) => {
  const { appId = "", clientId = "" } =
    useParams<{ appId: string; clientId: string }>();
  const { t: translate, i18n } = useTranslation();

  const { items, index, onClick, setConfirmModalProps, updateItems, client } =
    props;
  const { user, role } = items[index] || {};
  const currentClientId = clientId || appId;

  //States
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [isRoleModalOpen, setIsRoleOpenModal] = useState(false);
  const [userRole, setUserRole] = useState<ERoles>(role);

  const clientProfile = useSelector(
    (state: RootState) => state.app.clientProfile
  );
  const PROJECT_NAME =
    clientProfile?.name || translate("pages.usersList.defaultClient");

  const dispatch = useDispatch();

  //Requests
  const [deleteSession] = useDeleteSessionMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [blockUser] = useBlockUserMutation();
  const [unblockUser] = useUnblockUserMutation();
  const [updateUserRoleClient] = useUpdateUserRoleClientMutation();
  const [deleteUserRoleClient] = useDeleteUserRoleClientMutation();

  //#region Templates for displaying text
  const textWrapper = (text: string) => {
    return user ? text || "" : "";
  };

  const getRoleName = (role: string): string => {
    switch (role) {
      case ERoles.OWNER:
        return translate("roles.owner");
      case ERoles.ADMIN:
        return translate("roles.admin");
      case ERoles.EDITOR:
        return translate("roles.editor");
      case ERoles.USER:
        return translate("roles.user");
      case ERoles.TRUSTED_USER:
        return translate("roles.trusted_user");
      default:
        return "";
    }
  };

  const getUserStatus = (user: IUserShort) => {
    let stateStatus: { text: string; color?: string } = {
      text: translate("pages.usersList.status.active"),
      color: undefined,
    };
    if (user?.blocked) {
      stateStatus = {
        text: translate("pages.usersList.status.blocked"),
        color: "custom.error",
      };
    } else if (user?.deleted) {
      const deleteDate = new Date(user?.deleted);
      stateStatus = {
        text:
          translate("pages.usersList.status.deleted") +
          " " +
          deleteDate.toLocaleDateString(i18n.language),
        color: "custom.mainGrey",
      };
    }

    return (
      <Typography className="text-14" color={stateStatus.color}>
        {stateStatus.text}
      </Typography>
    );
  };

  const getRadioButton = (
    item: { title: string; description: string; role: ERoles },
    index: number
  ) => {
    return (
      <div key={index}>
        <FormControlLabel
          label={item.title}
          checked={userRole === item.role}
          onClick={() => {
            setUserRole(item.role);
          }}
          control={<Radio disableRipple />}
        />
        <Typography
          sx={{ marginLeft: "30px", marginBottom: "16px" }}
          className="text-12"
          color="text.secondary"
        >
          {item.description}
        </Typography>
      </div>
    );
  };
  //#endregion

  //#region Chooser roles
  const baseRoles: { title: string; description: string; role: ERoles }[] = [
    {
      title: translate("pages.usersList.roles.user.title"),
      description: translate("pages.usersList.roles.user.description"),
      role: ERoles.USER,
    },
    {
      title: translate("pages.usersList.roles.editor.title"),
      description: translate(
        `pages.usersList.roles.editor.${
          currentClientId === appId ? "descriptionFirst" : "descriptionSecond"
        }`
      ),
      role: ERoles.EDITOR,
    },
  ];

  const rolesForChoose = baseRoles;
  if (currentClientId === appId) {
    rolesForChoose.push({
      title: translate("pages.usersList.roles.owner.title"),
      description: translate("pages.usersList.roles.owner.description"),
      role: ERoles.ADMIN,
    });
  }

  const handleCancelSaveRole = () => {
    setIsRoleOpenModal(false);
    setUserRole(role);
  };

  const prepareHandleSaveRole = (
    items: TUserWithRole[],
    currentRole: ERoles,
    userId: number
  ) => {
    //Check for Manager role (after role change, the organization deletion process begins)
    if (ERoles.ADMIN === role && currentRole !== ERoles.ADMIN) {
      setConfirmModalProps({
        title: translate("pages.usersList.modals.changeUserRole.title"),
        mainMessage: [
          translate("pages.usersList.modals.changeUserRole.mainMessage"),
        ],
        isOpen: true,
        onClose: onCloseConfirmModal,
        actionButtonText: translate("actionButtons.edit"),
        onSubmit: () => {
          handleSaveRole(items, currentRole, userId);
          onCloseConfirmModal();
        },
      });
    } else {
      handleSaveRole(items, currentRole, userId);
    }
  };

  const handleSaveRole = async (
    items: TUserWithRole[],
    role: ERoles,
    userId: number
  ) => {
    const notice = (isSuccess: boolean): string =>
      translate(
        `pages.usersList.notice.${
          isSuccess ? "changeUserRole" : "NotChangeUserRole"
        }`,
        {
          userName: getDisplayName(user),
          projectName: PROJECT_NAME,
        }
      );

    try {
      await updateUserRoleClient({
        clientId: currentClientId,
        userId: userId.toString(),
        role,
      }).unwrap();
      const updatedItems = items.map((item) =>
        item.user.id === userId ? { user: item.user, role } : item
      );
      updateItems(updatedItems, updatedItems.length);
      dispatch(setNoticeInfo(notice(true)));
    } catch (error) {
      console.error("Error save role", error);
      dispatch(setNoticeError(notice(false)));
    }

    setIsRoleOpenModal(false);
  };
  //#endregion

  //#region Modal confirmation
  const onCloseConfirmModal = () => {
    setConfirmModalProps((prev) => {
      return { ...prev, isOpen: false };
    });
  };

  const handleDeleteSessions = async (userId: string, clientId: string) => {
    try {
      await deleteSession({ userId, clientId }).unwrap();
    } catch (error) {
      console.error("rejected", error);
    }
    onCloseConfirmModal();
  };

  const handleBlocked = async (
    items: TUserWithRole[],
    role: ERoles,
    userId: number
  ) => {
    try {
      let isBlocked = false;
      if (user.blocked) {
        await unblockUser({ id: user.id.toString() }).unwrap();
      } else {
        await blockUser({ id: user.id.toString() }).unwrap();
        isBlocked = true;
      }

      const updatedItems = items.map((item) =>
        item.user.id === userId
          ? { user: { ...item.user, blocked: isBlocked }, role }
          : item
      );
      updateItems(updatedItems, items.length);
    } catch (error) {
      console.error("rejected", error);
    }
    onCloseConfirmModal();
  };

  const handleRemove = async (items: TUserWithRole[], id: number) => {
    try {
      if (currentClientId === appId) {
        await deleteUser({ id: id.toString() }).unwrap();
      } else {
        await deleteUserRoleClient({
          clientId: currentClientId,
          userId: id.toString(),
        }).unwrap();
      }
      const updatedItems = items.filter(({ user }) => user?.id !== id);
      updateItems(updatedItems, updatedItems?.length);
    } catch (error) {
      console.error("rejected", error);
    }
    onCloseConfirmModal();
  };

  const confirmModalPrams = [
    {
      title: translate("pages.usersList.menuControls.endSessions"),
      onSubmit: () => {
        handleDeleteSessions(user?.id?.toString(), currentClientId);
      },
      actionButtonText: translate(
        "pages.usersList.modals.endSessions.actions.endSessions"
      ),
      mainMessage: [
        translate("pages.usersList.modals.endSessions.mainMessage", {
          userName: getDisplayName(user),
        }),
      ],
    },
    {
      title: translate(
        `pages.usersList.menuControls.${
          user?.blocked ? "unblockUser" : "blockUser"
        }`,
        {
          projectName: PROJECT_NAME,
        }
      ),
      onSubmit: () => {
        handleBlocked(items, role, user?.id);
      },
      actionButtonText: translate(
        `pages.usersList.modals.blockUser.actions.${
          !user?.blocked ? "blocked" : "unblocked"
        }`
      ),
      mainMessage: [
        translate("pages.usersList.modals.blockUser.mainMessage", {
          userName: getDisplayName(user),
          action: translate(
            `pages.usersList.modals.blockUser.actions.${
              user?.blocked ? "first" : "second"
            }`
          ),
          projectName: PROJECT_NAME,
        }),
      ],
    },
    {
      title: translate(
        `pages.usersList.menuControls.${
          currentClientId === appId ? "removeUser" : "deleteUserFromClient"
        }`
      ),
      onSubmit: () => {
        handleRemove(items, user?.id);
      },
      actionButtonText: translate("actionButtons.delete"),
      mainMessage: [
        translate(
          `pages.usersList.modals.removeUser.${
            currentClientId === appId ? "mainMessageFirst" : "mainMessageSecond"
          }`,
          {
            userName: getDisplayName(user),
            projectName: PROJECT_NAME,
          }
        ),
      ],
    },
  ];
  //#endregion

  //#region Menu control handlers
  const handleOpenMenuControl: MouseEventHandler<HTMLButtonElement> = (
    event
  ) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenuControl = () => {
    setAnchorEl(null);
  };

  const userControls = [
    {
      icon: ManageAccountsOutlinedIcon,
      title: translate("pages.usersList.menuControls.changeUserRole"),
      action: () => {
        handleCloseMenuControl();
        setIsRoleOpenModal(true);
      },
      addDivider: true,
    },
    {
      icon: LogoutOutlinedIcon,
      title: confirmModalPrams[0].title,
      action: async () => {
        handleCloseMenuControl();
        setConfirmModalProps({
          isOpen: true,
          onClose: onCloseConfirmModal,
          ...confirmModalPrams[0],
        });
      },
    },
    {
      icon: LockOutlinedIcon,
      title: confirmModalPrams[1].title,
      action: async () => {
        handleCloseMenuControl();
        setConfirmModalProps({
          isOpen: true,
          onClose: onCloseConfirmModal,
          ...confirmModalPrams[1],
        });
      },
    },
    {
      icon: DeleteOutlineOutlinedIcon,
      title: confirmModalPrams[2].title,
      action: async () => {
        handleCloseMenuControl();
        setConfirmModalProps({
          isOpen: true,
          onClose: onCloseConfirmModal,
          ...confirmModalPrams[2],
        });
      },
    },
  ];
  //#endregionw

  return (
    <>
      <Card
        {...props}
        cardId={user?.id?.toString()}
        isImage
        avatarUrl={user?.picture}
        onClick={() => onClick(user.id)}
        DefaultIcon={PersonOutlineOutlinedIcon}
        figure="circle"
        content={
          <div className={styles.content}>
            <div className={styles.userInfo}>
              <Box className={styles.userMainInfo}>
                <Typography
                  translate="no"
                  className={clsx("text-14", styles.userTitle)}
                >
                  {textWrapper(user?.given_name)}{" "}
                  {textWrapper(user?.family_name)}
                </Typography>
                <Typography
                  translate="no"
                  color="text.secondary"
                  className="text-12"
                >
                  {textWrapper(user?.nickname)}
                </Typography>
                <Typography color="text.secondary" className="text-12">
                  {textWrapper(`Id ${user?.id}`)}
                </Typography>
              </Box>
              <Box className={styles.userRole}>
                <Typography color="text.secondary" className="text-12">
                  {translate("pages.usersList.labels.role")}
                </Typography>
                <Typography className="text-14">
                  {textWrapper(getRoleName(role))}
                </Typography>
              </Box>
              <Box className={styles.userStatus}>
                <Typography color="text.secondary" className="text-12">
                  {translate("pages.usersList.labels.status")}
                </Typography>
                {getUserStatus(user)}
              </Box>
            </div>
            <div>
              <Button
                variant="text"
                color="secondary"
                data-id="open-menu-controls-button"
                onClick={handleOpenMenuControl}
                startIcon={
                  <CustomIcon
                    Icon={MoreHorizOutlinedIcon}
                    color="textSecondary"
                  />
                }
              />
              <MenuControls
                anchorEl={anchorEl}
                onClose={handleCloseMenuControl}
                controls={userControls}
              />
            </div>
          </div>
        }
      />

      <ModalInfo
        isOpen={isRoleModalOpen}
        title={translate("pages.usersList.modals.chooseRole.title")}
        onClose={() => setIsRoleOpenModal(false)}
      >
        <Typography className="text-14">
          {translate("pages.usersList.modals.chooseRole.description", {
            projectName: client ? client.name : PROJECT_NAME,
          })}
        </Typography>
        <div className={styles.modalContent}>
          <Avatar src={getImageURL(user?.picture)} className={styles.avatar}>
            {!user?.picture && (
              <Typography className="text-14">
                {getDisplayName(user, true)
                  ?.split(" ")
                  .map((name: string) => name[0]?.toUpperCase())
                  .join("")}
              </Typography>
            )}
          </Avatar>
          <Typography className="text-14">{getDisplayName(user)}</Typography>
        </div>
        <Typography style={{ marginBottom: 16 }} className="text-15-medium">
          {translate("pages.usersList.modals.chooseRole.listRoles")}
        </Typography>
        {rolesForChoose.map((item, index) => getRadioButton(item, index))}
        <ActionButtons
          onCancel={handleCancelSaveRole}
          submitText={translate("actionButtons.save")}
          onSubmit={() => prepareHandleSaveRole(items, userRole, user?.id)}
        />
      </ModalInfo>
    </>
  );
};

export const UserCard = UserCardComponent;
