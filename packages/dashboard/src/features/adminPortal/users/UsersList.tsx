import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import Box from "@mui/material/Box";
import { FC, useState } from "react";
import { connect } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { subTabs, tabs } from "src/shared/utils/enums";
import { RootState } from "src/app/store/reducer";
import { useLazyGetUsersClientQuery } from "src/shared/api/clients";
import { TUserWithRole } from "src/shared/api/users";
import { IQueryPropsWithId } from "src/shared/api/types";
import {
  ISubmitModalProps,
  SubmitModal,
} from "src/shared/ui/modal/SubmitModal";
import { ListItems } from "../../../shared/ui/listElements";
import { IUserCardProps, UserCard } from "./components/UserCard";
import { TAppSlice } from "src/shared/lib/appSlice";
import { IconWithTooltip } from "src/shared/ui/components/IconWithTooltip";
import { useTranslation } from "react-i18next";

const mapStateToProps = (state: RootState) => ({
  startRoutePath: state.app.startRoutePath,
});

interface IUsersListProps {
  startRoutePath: TAppSlice["startRoutePath"];
}

const UsersListComponent: FC<IUsersListProps> = ({ startRoutePath }) => {
  const { appId = "" } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const { t: translate } = useTranslation();

  const [modalProps, setModalProps] = useState<ISubmitModalProps>({
    isOpen: false,
    onSubmit: () => {},
    onClose: () => {},
    title: "",
    actionButtonText: "",
    mainMessage: [],
  });
  const [getUsers] = useLazyGetUsersClientQuery();
  const query = (offset: number, search?: string): IQueryPropsWithId => {
    return {
      query: {
        limit: "10",
        offset,
        search: search || "",
      },
      id: appId,
    };
  };

  const createUserButton = (
    <IconWithTooltip
      title={translate("pages.usersList.createButton")}
      Icon={PersonAddAltOutlinedIcon}
      onClick={() =>
        navigate(`/${startRoutePath}/${appId}/${tabs.users}/${subTabs.create}`)
      }
    />
  );

  const handleEventClick = (userId?: number) => {
    navigate(`/${startRoutePath}/${appId}/${tabs.users}/${userId}`);
  };

  return (
    <Box data-id="users" className="page-container">
      <Box className="content">
        <ListItems<TUserWithRole, IQueryPropsWithId, IUserCardProps>
          query={query}
          getItems={getUsers}
          RowElement={UserCard}
          searchFormChildren={createUserButton}
          rowElementProps={{
            onClick: handleEventClick,
            setConfirmModalProps: setModalProps,
          }}
        />
        <SubmitModal
          isOpen={modalProps.isOpen}
          onSubmit={modalProps.onSubmit}
          onClose={modalProps.onClose}
          title={modalProps.title}
          actionButtonText={modalProps.actionButtonText}
          mainMessage={modalProps.mainMessage}
        />
      </Box>
    </Box>
  );
};

export const UsersList = connect(mapStateToProps)(UsersListComponent);
