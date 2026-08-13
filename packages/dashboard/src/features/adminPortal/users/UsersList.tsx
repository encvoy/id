import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { yupResolver } from "@hookform/resolvers/yup";
import { FC, useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { connect } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Order, subTabs, tabs } from "src/shared/utils/enums";
import { RootState } from "src/app/store/reducer";
import { useLazyGetUsersClientQuery } from "src/shared/api/clients";
import {
  IGroup,
  useCreateGroupMutation,
  useDeleteGroupMutation,
  useLazyGetGroupsQuery,
} from "src/shared/api/groups";
import { IUserShort, TUserWithRole } from "src/shared/api/users";
import { IQueryPropsWithId } from "src/shared/api/types";
import { ISubmitModalProps, SubmitModal } from "@encvoy-id/components";
import { ListItems } from "../../../shared/ui/CardsList.tsx";
import { IUserCardProps, UserCard } from "./components/UserCard";
import { TAppSlice } from "src/shared/slices/appSlice";
import { IconWithTooltip } from "@encvoy-id/components";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import { setNoticeError, setNoticeInfo } from "src/shared/slices/noticesSlice";
import { InputField } from "@encvoy-id/components";
import { GroupCard, IGroupCardProps } from "./components/GroupCard";
import { GroupUsersPanel } from "./components/GroupUsersPanel";
import { UserGroupsPanel } from "./components/UserGroupsPanel";

const mapStateToProps = (state: RootState) => ({
  startRoutePath: state.app.startRoutePath,
});

type TUsersListTab = "users" | "groups";

interface IUsersListProps {
  startRoutePath: TAppSlice["startRoutePath"];
}

interface ICreateGroupFormValues {
  name: string;
  description: string;
}

const UsersListComponent: FC<IUsersListProps> = ({ startRoutePath }) => {
  const { appId = "" } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const { t: translate } = useTranslation();
  const dispatch = useDispatch();

  const [modalProps, setModalProps] = useState<ISubmitModalProps>({
    isOpen: false,
    onSubmit: () => {},
    onClose: () => {},
    title: "",
    actionButtonText: "",
    mainMessage: [],
  });
  const [activeTab, setActiveTab] = useState<TUsersListTab>("users");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [groupsCustomUpdate, setGroupsCustomUpdate] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<IGroup | null>(null);
  const [selectedUserForGroups, setSelectedUserForGroups] =
    useState<IUserShort | null>(null);
  const [getUsers] = useLazyGetUsersClientQuery();
  const [getGroups] = useLazyGetGroupsQuery();
  const [createGroup, { isLoading: isCreateGroupLoading }] =
    useCreateGroupMutation();
  const [deleteGroup] = useDeleteGroupMutation();
  const groupSchema = yup
    .object({
      name: yup
        .string()
        .required(translate("errors.requiredField"))
        .max(
          50,
          translate("errors.valueMaxLength", {
            maxLength: 50,
          })
        ),
      description: yup
        .string()
        .max(
          255,
          translate("errors.valueMaxLength", {
            maxLength: 255,
          })
        )
        .default(""),
    })
    .required();

  const groupFormMethods = useForm<ICreateGroupFormValues>({
    resolver: yupResolver(groupSchema) as any,
    defaultValues: {
      name: "",
      description: "",
    },
    mode: "onChange",
  });

  const { handleSubmit, reset } = groupFormMethods;

  const query = (offset: number, search?: string): IQueryPropsWithId => {
    return {
      query: {
        limit: 10,
        offset,
        search: search || "",
        sortDirection: Order.DESC,
        sortBy: "id",
      },
      id: appId,
    };
  };

  const groupsQuery = (offset: number, search = ""): IQueryPropsWithId => {
    return {
      id: appId,
      query: {
        limit: 10,
        offset,
        search,
        sortDirection: Order.ASC,
        sortBy: "name",
      },
    };
  };

  useEffect(() => {
    setActiveTab("users");
    setIsCreateGroupOpen(false);
    setGroupsCustomUpdate(false);
    setSelectedGroup(null);
    setSelectedUserForGroups(null);
    reset({
      name: "",
      description: "",
    });
  }, [appId, reset]);

  useEffect(() => {
    if (activeTab !== "groups" && selectedGroup) {
      setSelectedGroup(null);
    }

    if (activeTab !== "users" && selectedUserForGroups) {
      setSelectedUserForGroups(null);
    }
  }, [activeTab, selectedGroup, selectedUserForGroups]);

  const createUserButton = (
    <Box sx={{ display: "flex", gap: 1 }}>
      <IconWithTooltip
        title={translate("pages.usersList.createButton")}
        Icon={PersonAddAltOutlinedIcon}
        dataTestId="btn-users-user-create"
        onClick={() =>
          navigate(
            `/${startRoutePath}/${appId}/${tabs.users}/${subTabs.create}?mode=internal`
          )
        }
      />
    </Box>
  );

  const handleEventClick = (userId?: string) => {
    navigate(`/${startRoutePath}/${appId}/${tabs.users}/${userId}`);
  };

  const handleOpenGroupUsersPanel = (group: IGroup) => {
    setSelectedGroup(group);
  };

  const handleCloseGroupUsersPanel = () => {
    setSelectedGroup(null);
  };

  const handleOpenUserGroupsPanel = (user: IUserShort) => {
    setSelectedUserForGroups(user);
  };

  const handleCloseUserGroupsPanel = () => {
    setSelectedUserForGroups(null);
  };

  const handleCloseCreateGroup = () => {
    setIsCreateGroupOpen(false);
    reset({
      name: "",
      description: "",
    });
  };

  const handleOpenCreateGroup = () => {
    reset({
      name: "",
      description: "",
    });
    setIsCreateGroupOpen(true);
  };

  const createGroupButton = (
    <Box sx={{ display: "flex", gap: 1 }}>
      <IconWithTooltip
        title={translate("pages.directory.folders.actions.createGroup")}
        Icon={GroupAddOutlinedIcon}
        dataTestId="btn-users-group-create"
        disabled={isCreateGroupLoading}
        onClick={handleOpenCreateGroup}
      />
    </Box>
  );

  const handleCreateGroup = async (data: ICreateGroupFormValues) => {
    try {
      const createdGroup = await createGroup({
        organization_id: appId,
        body: {
          name: data.name,
          description: data.description || undefined,
        },
      }).unwrap();

      dispatch(
        setNoticeInfo(
          translate("pages.directory.folders.notices.groupCreated", {
            name: createdGroup.name,
          })
        )
      );
      setGroupsCustomUpdate(true);
      handleCloseCreateGroup();
    } catch (error) {
      console.error("Error create group in users list:", error);
      dispatch(
        setNoticeError(
          translate("pages.directory.folders.errors.createGroup", {
            name: data.name,
          })
        )
      );
    }
  };

  const handleCloseModal = () => {
    setModalProps((prev) => ({
      ...prev,
      isOpen: false,
    }));
  };

  const handleDeleteGroup = async (group: IGroup) => {
    if (!group.id) {
      return;
    }

    try {
      await deleteGroup({
        organization_id: appId,
        group_id: group.id,
      }).unwrap();

      if (selectedGroup?.id === group.id) {
        setSelectedGroup(null);
      }

      dispatch(
        setNoticeInfo(
          translate("pages.directory.groups.notices.deleted", { name: group.name })
        )
      );
      setGroupsCustomUpdate(true);
    } catch (error) {
      console.error("Error delete group in users list:", error);
      dispatch(
        setNoticeError(
          translate("pages.directory.groups.errors.delete", { name: group.name })
        )
      );
    } finally {
      handleCloseModal();
    }
  };

  const handleOpenDeleteGroupModal = (group: IGroup) => {
    setModalProps({
      isOpen: true,
      onClose: handleCloseModal,
      onSubmit: () => {
        void handleDeleteGroup(group);
      },
      title: translate("pages.directory.groups.modals.delete.title"),
      actionButtonText: translate("actionButtons.delete"),
      mainMessage: [
        translate("pages.directory.groups.modals.delete.message", {
          name: group.name,
        }),
        translate("pages.directory.groups.modals.delete.warningAdminRole"),
      ],
    });
  };

  return (
    <Box data-id="users" className="page-container">
      <Box className="content">
        <Box sx={{ mb: 3 }}>
          <Tabs
            data-variant="segmented"
            value={activeTab}
            onChange={(_, value: TUsersListTab) => setActiveTab(value)}
            sx={{ minHeight: "unset" }}
          >
            <Tab value="users" label={translate("tabs.users")} />
            <Tab value="groups" label={translate("tabs.groups")} />
          </Tabs>
        </Box>

        {activeTab === "users" ? (
          <ListItems<TUserWithRole, IQueryPropsWithId, IUserCardProps>
            key={`users-${appId}`}
            query={query}
            getItems={getUsers}
            RowElement={UserCard}
            searchDataTestId="btn-search-info"
            searchFormChildren={createUserButton}
            searchContext={`users_${appId}`}
            rowElementProps={{
              onClick: handleEventClick,
              onManageGroups: handleOpenUserGroupsPanel,
              setConfirmModalProps: setModalProps,
            }}
          />
        ) : (
          <ListItems<IGroup, IQueryPropsWithId, IGroupCardProps>
            key={`groups-${appId}`}
            query={groupsQuery}
            getItems={getGroups}
            RowElement={GroupCard}
            searchDataTestId="btn-search-groups"
            searchFormChildren={createGroupButton}
            searchContext={`groups_${appId}`}
            customUpdate={groupsCustomUpdate}
            setCustomUpdate={setGroupsCustomUpdate}
            rowElementProps={{
              onDeleteGroup: handleOpenDeleteGroupModal,
              onManageUsers: handleOpenGroupUsersPanel,
            }}
          />
        )}
        <SubmitModal
          cancelText={translate("actionButtons.cancel")}
          deleteText={translate("actionButtons.delete")}
          isOpen={modalProps.isOpen}
          onSubmit={modalProps.onSubmit}
          onClose={modalProps.onClose}
          title={modalProps.title}
          actionButtonText={modalProps.actionButtonText}
          mainMessage={modalProps.mainMessage}
        />
        <SubmitModal
          cancelText={translate("actionButtons.cancel")}
          deleteText={translate("actionButtons.delete")}
          isOpen={isCreateGroupOpen}
          onSubmit={() => {
            void handleSubmit(handleCreateGroup)();
          }}
          onClose={handleCloseCreateGroup}
          title={translate("pages.directory.folders.modals.createGroup.title")}
          actionButtonText={translate("actionButtons.create")}
          disabled={isCreateGroupLoading}
          submitButtonDataTestId="btn-users-group-submit"
        >
          <FormProvider {...groupFormMethods}>
            <InputField
              label={translate("pages.directory.groups.fields.name.label")}
              name="name"
              required
              dataTestId="txt-users-group-name"
            />
            <InputField
              label={translate("fields.description")}
              name="description"
              multiline
              rows={2}
              dataTestId="txt-users-group-description"
            />
          </FormProvider>
        </SubmitModal>
        {selectedGroup ? (
          <GroupUsersPanel
            key={selectedGroup.id}
            appId={appId}
            group={selectedGroup}
            isOpen={Boolean(selectedGroup)}
            onClose={handleCloseGroupUsersPanel}
          />
        ) : null}
        {selectedUserForGroups ? (
          <UserGroupsPanel
            key={selectedUserForGroups.id}
            organizationId={appId}
            user={selectedUserForGroups}
            isOpen={Boolean(selectedUserForGroups)}
            onClose={handleCloseUserGroupsPanel}
          />
        ) : null}
      </Box>
    </Box>
  );
};

export const UsersList = connect(mapStateToProps)(UsersListComponent);
