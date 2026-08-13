import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import GroupRemoveOutlinedIcon from "@mui/icons-material/GroupRemoveOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import RestoreFromTrashOutlinedIcon from "@mui/icons-material/RestoreFromTrashOutlined";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import clsx from "clsx";
import {
  Dispatch,
  FC,
  memo,
  MouseEventHandler,
  SetStateAction,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { ERoles, routes } from "src/shared/utils/enums";
import { getImageURL } from "src/shared/utils/helpers";
import { setNoticeError, setNoticeInfo } from "src/shared/slices/noticesSlice";
import {
  IClientFull,
  useAddUserToInternalListMutation,
  useBlockUserMutation,
  useDeleteSessionMutation,
  useDeleteUserRoleClientMutation,
  useGetClientInfoQuery,
  useRemoveUserFromInternalListMutation,
  useRemoveUserFromOrganizationListMutation,
  useUnblockUserMutation,
  useUpdateUserRoleClientMutation,
} from "src/shared/api/clients";
import {
  IUserShort,
  TUserWithRole,
  useDeleteUserMutation,
  useMarkUserForDeletionMutation,
  useRestoreProfileMutation,
} from "src/shared/api/users";
import { RootState } from "src/app/store/store";
import { CustomIcon } from "@encvoy-id/components";
import { ModalInfo } from "@encvoy-id/components";
import { ISubmitModalProps } from "@encvoy-id/components";
import { ActionButtons } from "@encvoy-id/components";
import { Card, ICardProps } from "@encvoy-id/components";
import { MenuControls } from "@encvoy-id/components";
import styles from "./UserCard.module.css";
import { getDisplayName } from "../utils";
import Typography from "@mui/material/Typography";
import { ControlLabel } from "@encvoy-id/components";
import Radio from "@mui/material/Radio";
import { useSystemClientId } from "src/shared/hooks/useSystemClientId";
import { getLocalizedTextValue } from "src/shared/utils/locales";

export interface IUserCardProps extends ICardProps {
  items: TUserWithRole[];
  index: number;
  onClick: (userId?: string) => void;
  setConfirmModalProps: Dispatch<SetStateAction<ISubmitModalProps>>;
  updateItems: (items: TUserWithRole[], totalCount: number) => void;
  client?: IClientFull;
  onManageGroups?: (user: IUserShort) => void;
}

const UserCardComponent: FC<IUserCardProps> = (props) => {
  const { appId = "", clientId = "" } =
    useParams<{ appId: string; clientId: string }>();
  const systemClientId = useSystemClientId();
  const { t: translate, i18n } = useTranslation();
  const startRoutePath = useSelector(
    (state: RootState) => state.app.startRoutePath
  );

  const {
    items,
    index,
    onClick,
    setConfirmModalProps,
    updateItems,
    client,
    onManageGroups,
  } = props;
  const { user, role } = items[index] || {};
  const currentClientId = clientId || appId;
  const isSystemRootList =
    currentClientId === appId && appId === systemClientId;
  const isOrganizationRootList =
    currentClientId === appId && appId !== systemClientId;
  const isManagerRole =
    role === ERoles.OWNER || role === ERoles.ADMIN || role === ERoles.EDITOR;
  const canAddToInternalList =
    isSystemRootList && role === ERoles.USER && user?.org_id == null;
  const canRemoveFromInternalList =
    isSystemRootList && user?.org_id === systemClientId && !isManagerRole;
  const canRemoveFromOrganizationList =
    isOrganizationRootList && !isManagerRole;

  //States
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [isRoleModalOpen, setIsRoleOpenModal] = useState(false);
  const [userRole, setUserRole] = useState<ERoles>(role);

  const clientProfile = useSelector(
    (state: RootState) => state.app.clientProfile
  );
  const { data: organizationClient } = useGetClientInfoQuery(
    { id: appId },
    {
      skip: !isOrganizationRootList || !appId,
    }
  );
  const systemProjectName =
    getLocalizedTextValue(clientProfile?.name, i18n.language) ||
    translate("pages.usersList.defaultClient");
  const organizationProjectName = getLocalizedTextValue(
    organizationClient?.name,
    i18n.language
  ).trim();
  const localizedClientName = getLocalizedTextValue(
    client?.name,
    i18n.language
  );
  const PROJECT_NAME =
    isOrganizationRootList && organizationProjectName
      ? organizationProjectName
      : systemProjectName;
  const organizationName = getLocalizedTextValue(
    user?.organization_name,
    i18n.language
  ).trim();

  const dispatch = useDispatch();

  //Requests
  const [deleteSession] = useDeleteSessionMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [markUserForDeletion] = useMarkUserForDeletionMutation();
  const [restoreProfile] = useRestoreProfileMutation();
  const [blockUser] = useBlockUserMutation();
  const [unblockUser] = useUnblockUserMutation();
  const [updateUserRoleClient] = useUpdateUserRoleClientMutation();
  const [deleteUserRoleClient] = useDeleteUserRoleClientMutation();
  const [addUserToInternalList] = useAddUserToInternalListMutation();
  const [removeUserFromInternalList] = useRemoveUserFromInternalListMutation();
  const [removeUserFromOrganizationList] =
    useRemoveUserFromOrganizationListMutation();

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
      const isNeverDeleteMarker = deleteDate.getUTCFullYear() >= 9999;
      stateStatus = {
        text: isNeverDeleteMarker
          ? translate("pages.usersList.status.deleted")
          : `${translate(
              "pages.usersList.status.deleted"
            )} ${deleteDate.toLocaleDateString(i18n.language)}`,
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
        <ControlLabel
          title={item.title}
          description={item.description}
          checked={userRole === item.role}
          onClick={() => {
            setUserRole(item.role);
          }}
          control={<Radio data-test-id={`radio-${item.role}`} disableRipple />}
        />
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
  if (currentClientId === appId && startRoutePath !== routes.customer) {
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
    userId: string
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
    userId: string
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
        client_id: currentClientId,
        id: userId,
        role,
      }).unwrap();
      const updatedItems = items.map((item) =>
        item.user.id === userId ? { ...item, role } : item
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
      await deleteSession({ id: userId, client_id: clientId }).unwrap();
    } catch (error) {
      console.error("rejected", error);
    }
    onCloseConfirmModal();
  };

  const handleBlocked = async (
    items: TUserWithRole[],
    role: ERoles,
    userId: string
  ) => {
    try {
      let isBlocked = false;
      if (user.blocked) {
        await unblockUser({ client_id: currentClientId, id: user.id }).unwrap();
      } else {
        await blockUser({ client_id: currentClientId, id: user.id }).unwrap();
        isBlocked = true;
      }

      const updatedItems = items.map((item) =>
        item.user.id === userId
          ? { ...item, user: { ...item.user, blocked: isBlocked }, role }
          : item
      );
      updateItems(updatedItems, items.length);
    } catch (error) {
      console.error("rejected", error);
    }
    onCloseConfirmModal();
  };

  const handleRemove = async (items: TUserWithRole[], id: string) => {
    try {
      if (currentClientId === appId) {
        await deleteUser({ id }).unwrap();
      } else {
        await deleteUserRoleClient({
          client_id: currentClientId,
          id,
        }).unwrap();
      }
      const updatedItems = items.filter(({ user }) => user?.id !== id);
      updateItems(updatedItems, updatedItems?.length);
    } catch (error) {
      console.error("rejected", error);
    }
    onCloseConfirmModal();
  };

  const handleMarkForDeletion = async (
    items: TUserWithRole[],
    userId: string
  ) => {
    try {
      const result = await markUserForDeletion({ id: userId }).unwrap();
      const updatedItems = items.map((item) =>
        item.user.id === userId
          ? {
              ...item,
              user: {
                ...item.user,
                deleted: result.deleted || new Date().toISOString(),
              },
            }
          : item
      );
      updateItems(updatedItems, updatedItems.length);
      dispatch(setNoticeInfo(translate("info.infoUpdated")));
    } catch (error) {
      console.error("mark user for deletion rejected", error);
      dispatch(setNoticeError(translate("info.updateError")));
    }

    onCloseConfirmModal();
  };

  const handleUnmarkDeletion = async (
    items: TUserWithRole[],
    userId: string
  ) => {
    try {
      await restoreProfile({ id: userId }).unwrap();
      const updatedItems = items.map((item) =>
        item.user.id === userId
          ? {
              ...item,
              user: {
                ...item.user,
                deleted: undefined,
              },
            }
          : item
      );
      updateItems(updatedItems, updatedItems.length);
      dispatch(setNoticeInfo(translate("info.infoUpdated")));
    } catch (error) {
      console.error("unmark user deletion rejected", error);
      dispatch(setNoticeError(translate("info.updateError")));
    }

    onCloseConfirmModal();
  };

  const handleAddToInternalList = async (
    items: TUserWithRole[],
    userId: string
  ) => {
    try {
      await addUserToInternalList({
        client_id: currentClientId,
        id: userId,
      }).unwrap();

      const updatedItems = items.map((item) =>
        item.user.id === userId
          ? {
              ...item,
              user: {
                ...item.user,
                org_id: systemClientId,
                organization_name: systemProjectName,
              },
            }
          : item
      );

      updateItems(updatedItems, updatedItems.length);
      dispatch(setNoticeInfo(translate("info.infoUpdated")));
    } catch (error) {
      console.error("add user to internal list rejected", error);
      dispatch(setNoticeError(translate("info.updateError")));
    }

    onCloseConfirmModal();
  };

  const handleRemoveFromInternalList = async (
    items: TUserWithRole[],
    userId: string
  ) => {
    try {
      await removeUserFromInternalList({
        client_id: currentClientId,
        id: userId,
      }).unwrap();

      const updatedItems = items.map((item) =>
        item.user.id === userId
          ? {
              ...item,
              role: ERoles.USER,
              user: { ...item.user, org_id: null, organization_name: null },
            }
          : item
      );

      updateItems(updatedItems, updatedItems.length);
      dispatch(setNoticeInfo(translate("info.infoUpdated")));
    } catch (error) {
      console.error("remove user from internal list rejected", error);
      dispatch(setNoticeError(translate("info.updateError")));
    }

    onCloseConfirmModal();
  };

  const handleRemoveFromOrganizationList = async (
    items: TUserWithRole[],
    userId: string
  ) => {
    try {
      await removeUserFromOrganizationList({
        client_id: currentClientId,
        id: userId,
      }).unwrap();

      const updatedItems = items.filter((item) => item.user.id !== userId);
      updateItems(updatedItems, updatedItems.length);
      dispatch(setNoticeInfo(translate("info.infoUpdated")));
    } catch (error) {
      console.error("remove user from organization list rejected", error);
      dispatch(setNoticeError(translate("info.updateError")));
    }

    onCloseConfirmModal();
  };

  const endSessionsModal = {
    title: translate("pages.usersList.menuControls.endSessions"),
    onSubmit: () => {
      handleDeleteSessions(user?.id, currentClientId);
    },
    actionButtonText: translate(
      "pages.usersList.modals.endSessions.actions.endSessions"
    ),
    mainMessage: [
      translate("pages.usersList.modals.endSessions.mainMessage", {
        userName: getDisplayName(user),
      }),
    ],
  };

  const blockModal = {
    title: translate(
      `pages.usersList.menuControls.${
        user?.blocked ? "unblockUser" : "blockUser"
      }`,
      {
        projectName: localizedClientName || PROJECT_NAME,
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
      translate(
        client
          ? "pages.usersList.modals.blockUserClient.mainMessage"
          : "pages.usersList.modals.blockUser.mainMessage",
        {
          userName: getDisplayName(user),
          action: translate(
            `pages.usersList.modals.blockUser.actions.${
              user?.blocked ? "first" : "second"
            }`
          ),
          projectName: localizedClientName || PROJECT_NAME,
        }
      ),
    ],
  };

  const deleteModal = {
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
          projectName: systemProjectName,
        }
      ),
    ],
  };

  const markForDeletionModal = {
    title: translate("pages.usersList.modals.markForDeletion.title"),
    onSubmit: () => {
      handleMarkForDeletion(items, user?.id);
    },
    actionButtonText: translate(
      "pages.usersList.modals.markForDeletion.action"
    ),
    mainMessage: [
      translate("pages.usersList.modals.markForDeletion.mainMessage", {
        userName: getDisplayName(user),
      }),
    ],
  };

  const unmarkDeletionModal = {
    title: translate("pages.usersList.modals.unmarkDeletion.title"),
    onSubmit: () => {
      handleUnmarkDeletion(items, user?.id);
    },
    actionButtonText: translate("pages.usersList.modals.unmarkDeletion.action"),
    mainMessage: [
      translate("pages.usersList.modals.unmarkDeletion.mainMessage", {
        userName: getDisplayName(user),
      }),
    ],
  };

  const addToInternalListModal = {
    title: translate("pages.usersList.modals.addToInternalList.title"),
    onSubmit: () => {
      handleAddToInternalList(items, user?.id);
    },
    actionButtonText: translate("actionButtons.add"),
    mainMessage: [
      translate("pages.usersList.modals.addToInternalList.mainMessage", {
        userName: getDisplayName(user),
      }),
    ],
  };

  const removeFromInternalListModal = {
    title: translate("pages.usersList.modals.removeFromInternalList.title"),
    onSubmit: () => {
      handleRemoveFromInternalList(items, user?.id);
    },
    actionButtonText: translate("actionButtons.delete"),
    mainMessage: [
      translate("pages.usersList.modals.removeFromInternalList.mainMessage", {
        userName: getDisplayName(user),
      }),
    ],
  };

  const removeFromOrganizationListModal = {
    title: translate("pages.usersList.modals.removeFromOrganizationList.title"),
    onSubmit: () => {
      handleRemoveFromOrganizationList(items, user?.id);
    },
    actionButtonText: translate("actionButtons.delete"),
    mainMessage: [
      translate(
        "pages.usersList.modals.removeFromOrganizationList.mainMessage",
        {
          userName: getDisplayName(user),
          projectName: PROJECT_NAME,
        }
      ),
    ],
  };
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
      dataTestId: "btn-users-сhange-permissions",
      action: () => {
        handleCloseMenuControl();
        setUserRole(role);
        setIsRoleOpenModal(true);
      },
      addDivider: !onManageGroups || Boolean(user?.deleted),
    },
    ...(onManageGroups && user && !user.deleted
      ? [
          {
            icon: GroupsOutlinedIcon,
            title: translate("pages.usersList.menuControls.manageGroups"),
            dataTestId: "btn-users-manage-groups",
            action: () => {
              handleCloseMenuControl();
              onManageGroups(user);
            },
            addDivider: true,
          },
        ]
      : []),
    ...(canAddToInternalList
      ? [
          {
            icon: GroupAddOutlinedIcon,
            title: translate("pages.usersList.menuControls.addToInternalList"),
            dataTestId: "btn-users-add-to-internal-list",
            action: async () => {
              handleCloseMenuControl();
              setConfirmModalProps({
                isOpen: true,
                onClose: onCloseConfirmModal,
                ...addToInternalListModal,
              });
            },
          },
        ]
      : []),
    ...(canRemoveFromInternalList
      ? [
          {
            icon: GroupRemoveOutlinedIcon,
            title: translate(
              "pages.usersList.menuControls.removeFromInternalList"
            ),
            dataTestId: "btn-users-remove-from-internal-list",
            action: async () => {
              handleCloseMenuControl();
              setConfirmModalProps({
                isOpen: true,
                onClose: onCloseConfirmModal,
                ...removeFromInternalListModal,
              });
            },
          },
        ]
      : []),
    {
      icon: LogoutOutlinedIcon,
      title: endSessionsModal.title,
      dataTestId: "btn-users-sessions-end",
      action: async () => {
        handleCloseMenuControl();
        setConfirmModalProps({
          isOpen: true,
          onClose: onCloseConfirmModal,
          ...endSessionsModal,
        });
      },
    },
    {
      icon: LockOutlinedIcon,
      title: blockModal.title,
      dataTestId: "btn-users-user-block",
      action: async () => {
        handleCloseMenuControl();
        setConfirmModalProps({
          isOpen: true,
          onClose: onCloseConfirmModal,
          ...blockModal,
        });
      },
    },
    {
      icon: user?.deleted
        ? RestoreFromTrashOutlinedIcon
        : DeleteOutlineOutlinedIcon,
      title: translate(
        `pages.usersList.menuControls.${
          user?.deleted ? "unmarkDeletion" : "markForDeletion"
        }`
      ),
      dataTestId: user?.deleted
        ? "btn-users-user-unmark-deletion"
        : "btn-users-user-mark-deletion",
      action: async () => {
        handleCloseMenuControl();
        setConfirmModalProps({
          isOpen: true,
          onClose: onCloseConfirmModal,
          ...(user?.deleted ? unmarkDeletionModal : markForDeletionModal),
        });
      },
    },
    ...(canRemoveFromOrganizationList
      ? [
          {
            icon: DeleteOutlineOutlinedIcon,
            title: translate(
              "pages.usersList.menuControls.removeFromOrganizationList"
            ),
            dataTestId: "btn-users-remove-from-organization-list",
            action: async () => {
              handleCloseMenuControl();
              setConfirmModalProps({
                isOpen: true,
                onClose: onCloseConfirmModal,
                ...removeFromOrganizationListModal,
              });
            },
          },
        ]
      : []),
    {
      icon: DeleteOutlineOutlinedIcon,
      title: deleteModal.title,
      dataTestId: "btn-users-user-delete",
      action: async () => {
        handleCloseMenuControl();
        setConfirmModalProps({
          isOpen: true,
          onClose: onCloseConfirmModal,
          ...deleteModal,
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
        avatarUrl={getImageURL(user?.picture)}
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
                {organizationName ? (
                  <Typography color="text.secondary" className="text-12">
                    {translate("pages.usersList.labels.organization")}{" "}
                    {organizationName}
                  </Typography>
                ) : null}
              </Box>
              <Box className={styles.userRole}>
                <Typography color="text.secondary" className="text-12">
                  {translate("pages.usersList.labels.role")}
                </Typography>
                <Typography className="text-14">
                  {textWrapper(getRoleName(role))}
                </Typography>
              </Box>
              <Box className={styles.userGroups}>
                <Typography color="text.secondary" className="text-12">
                  {translate("pages.usersList.labels.groupsCount")}
                </Typography>
                <Typography className="text-14">
                  {user?.groupsCount ?? 0}
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
                data-test-id="btn-users-open-menu-controls"
                onClick={handleOpenMenuControl}
                startIcon={
                  <CustomIcon
                    Icon={MoreHorizOutlinedIcon}
                    color="textSecondary"
                  />
                }
              />
            </div>
          </div>
        }
      />

      {anchorEl ? (
        <MenuControls
          anchorEl={anchorEl}
          onClose={handleCloseMenuControl}
          controls={userControls}
          dataTestId={userControls.map((control) => control.dataTestId)}
        />
      ) : null}

      {isRoleModalOpen ? (
        <ModalInfo
          isOpen={isRoleModalOpen}
          title={translate("pages.usersList.modals.chooseRole.title")}
          onClose={() => setIsRoleOpenModal(false)}
        >
          <Typography className="text-14">
            {translate("pages.usersList.modals.chooseRole.description", {
              projectName: localizedClientName || PROJECT_NAME,
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
            cancelText={translate("actionButtons.cancel")}
            onCancel={handleCancelSaveRole}
            submitText={translate("actionButtons.save")}
            onSubmit={() => prepareHandleSaveRole(items, userRole, user?.id)}
          />
        </ModalInfo>
      ) : null}
    </>
  );
};

export const UserCard = memo(UserCardComponent);
