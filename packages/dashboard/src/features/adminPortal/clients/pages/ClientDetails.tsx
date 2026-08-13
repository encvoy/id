import Box from "@mui/material/Box";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { connect } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { RootState } from "src/app/store/reducer";
import { ClientInvitations } from "src/features/adminPortal/clients/components/ClientInvitations";
import {
  IUserCardProps,
  UserCard,
} from "src/features/adminPortal/users/components/UserCard";
import {
  useGetClientInfoQuery,
  useLazyGetUsersClientQuery,
} from "src/shared/api/clients";
import { IQueryPropsWithId } from "src/shared/api/types";
import { TUserWithRole } from "src/shared/api/users";
import { TAppSlice } from "src/shared/slices/appSlice";
import { ListItems } from "src/shared/ui/CardsList.tsx";
import { ISubmitModalProps, SubmitModal } from "@encvoy-id/components";
import { tabs } from "src/shared/utils/enums";
import { ClientAccessGroupsList } from "../components/ClientAccessGroupsList";
import { ClientDetailsAddInfo } from "../components/ClientDetailsAddInfo";
import { ClientDetailsHeader } from "../components/ClientDetailsHeader";
import { MetricsInfo } from "../components/MetricsInfo";
import styles from "./ClientDetails.module.css";

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

  const [modalProps, setModalProps] = useState<ISubmitModalProps>({
    isOpen: false,
    onSubmit: () => {},
    onClose: () => {},
    title: "",
    actionButtonText: "",
    mainMessage: [],
  });
  const query = (offset: number, search = ""): IQueryPropsWithId => {
    return {
      query: {
        limit: 10,
        offset,
        search,
      },
      id: clientId ?? "",
    };
  };

  const handleEventClick = (userId?: string) => {
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
            <Box className={styles.metrics}>
              <MetricsInfo clientId={clientId} />
            </Box>
            <Box className={styles.usersList}>
              <ClientInvitations />

              <Box className={styles.listWrapper}>
                <Box className={styles.listColumn}>
                  <ListItems<TUserWithRole, IQueryPropsWithId, IUserCardProps>
                    query={query}
                    getItems={getUsers}
                    RowElement={UserCard}
                    searchDataTestId="btn-search-info"
                    rowElementProps={{
                      client: client,
                      onClick: handleEventClick,
                      setConfirmModalProps: setModalProps,
                    }}
                  />
                </Box>
                {client.parent_id ? (
                  <ClientAccessGroupsList
                    applicationId={client.client_id}
                    organizationId={client.parent_id}
                  />
                ) : null}
              </Box>
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
