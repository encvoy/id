import Box from "@mui/material/Box";
import { FC, useState } from "react";
import { connect } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { tabs } from "src/shared/utils/enums";
import { TAppSlice } from "src/shared/lib/appSlice";
import { RootState } from "src/app/store/reducer";
import {
  useGetClientInfoQuery,
  useLazyGetUsersClientQuery,
} from "src/shared/api/clients";
import { TUserWithRole } from "src/shared/api/users";
import { IQueryPropsWithId } from "src/shared/api/types";
import { useTranslation } from "react-i18next";
import {
  ISubmitModalProps,
  SubmitModal,
} from "src/shared/ui/modal/SubmitModal";
import { ListItems } from "src/shared/ui/listElements";
import {
  IUserCardProps,
  UserCard,
} from "src/features/adminPortal/users/components/UserCard";
import styles from "./ClientDetails.module.css";
import { ClientDetailsAddInfo } from "../components/ClientDetailsAddInfo";
import { ClientDetailsHeader } from "../components/ClientDetailsHeader";
import Button from "@mui/material/Button";
import { ClientInvitations } from "src/features/adminPortal/clients/components/ClientInvitations";

const mapStateToProps = (state: RootState) => ({
  startRoutePath: state.app.startRoutePath,
});

interface IClientDetailsProps {
  startRoutePath: TAppSlice["startRoutePath"];
}

const ClientDetailsComponent: FC<IClientDetailsProps> = ({
  startRoutePath,
}) => {
  const { t: translate } = useTranslation();
  const { appId = "", clientId = "" } =
    useParams<{ appId: string; clientId: string }>();
  const navigate = useNavigate();
  const { data: client } = useGetClientInfoQuery({ id: clientId });
  const [getUsers, { data: usersData }] = useLazyGetUsersClientQuery();
  const [isOpenInviteModal, setIsOpenInviteModal] = useState(false);

  const [modalProps, setModalProps] = useState<ISubmitModalProps>({
    isOpen: false,
    onSubmit: () => {},
    onClose: () => {},
    title: "",
    actionButtonText: "",
    mainMessage: [],
  });
  const query = (offset: number, search?: string): IQueryPropsWithId => {
    return {
      query: {
        limit: "10",
        offset,
        search: search || "",
      },
      id: clientId ?? "",
    };
  };

  const handleEventClick = (userId?: number) => {
    navigate(
      `/${startRoutePath}/${appId}/${tabs.clients}/${clientId}/${tabs.users}/${userId}`
    );
  };

  return (
    <Box data-id="clientDetails" className="page-container">
      <Box className="content content_max">
        {client?.client_id ? (
          <div className={styles.client}>
            <Box className={styles.mainInfo}>
              <ClientDetailsHeader
                client={client}
                startRoutePath={startRoutePath}
              />
            </Box>
            <Box className={styles.addInfo}>
              <ClientDetailsAddInfo
                client={client}
                totalCount={usersData?.totalCount}
              />
            </Box>
            <Box className={styles.usersList}>
              <ClientInvitations
                isOpen={isOpenInviteModal}
                setIsOpen={setIsOpenInviteModal}
              />
              <ListItems<TUserWithRole, IQueryPropsWithId, IUserCardProps>
                query={query}
                getItems={getUsers}
                RowElement={UserCard}
                rowElementProps={{
                  client: client,
                  onClick: handleEventClick,
                  setConfirmModalProps: setModalProps,
                }}
                searchFormChildren={
                  <Button
                    variant="contained"
                    onClick={() => setIsOpenInviteModal(true)}
                  >
                    Пригласить
                  </Button>
                }
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
          </div>
        ) : (
          <div>{translate("pages.clientDetails.notFound")}</div>
        )}
      </Box>
    </Box>
  );
};

export const ClientDetails = connect(mapStateToProps)(ClientDetailsComponent);
