import AddToPhotosOutlinedIcon from "@mui/icons-material/AddToPhotosOutlined";
import Box from "@mui/material/Box";
import { FC } from "react";
import { connect } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Order, routes, subTabs, tabs } from "src/shared/utils/enums";
import { RootState } from "src/app/store/reducer";
import { IClient, useLazyGetClientsQuery } from "src/shared/api/clients";
import { IQuerySortParams } from "src/shared/api/types";
import { ListItems } from "../../../../shared/ui/CardsList.tsx";
import { ClientCard, IClientCardProps } from "../components/ClientCard";
import { TAppSlice } from "src/shared/slices/appSlice";
import { useTranslation } from "react-i18next";
import { IconWithTooltip } from "@encvoy-id/components";

const mapStateToProps = (state: RootState) => ({
  startRoutePath: state.app.startRoutePath,
  systemClientId: state.app.systemClientId,
});

interface IClientsListProps {
  startRoutePath: TAppSlice["startRoutePath"];
  systemClientId: string | null;
}

const ClientsListComponent: FC<IClientsListProps> = ({
  startRoutePath,
  systemClientId,
}) => {
  const { appId = "" } = useParams<{ appId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { t: translate } = useTranslation();
  const [getClients] = useLazyGetClientsQuery();
  const isAdminRoute = location.pathname.startsWith(`/${routes.admin}/`);
  const routeScopeId = isAdminRoute && systemClientId ? systemClientId : appId;
  const filter = isAdminRoute
    ? JSON.stringify({ parent_id: systemClientId })
    : routeScopeId === systemClientId
    ? undefined
    : JSON.stringify({ parent_id: routeScopeId });

  const query = (offset: number, search?: string): IQuerySortParams => {
    return {
      sortBy: "created_at",
      sortDirection: Order.DESC,
      limit: 10,
      offset,
      search: search || "",
      filter,
    };
  };

  const createUserButton = (
    <IconWithTooltip
      title={translate("pages.listClient.createButton")}
      Icon={AddToPhotosOutlinedIcon}
      dataTestId="btn-application-create-app"
      onClick={() =>
        navigate(
          `/${startRoutePath}/${routeScopeId}/${tabs.clients}/${subTabs.create}`
        )
      }
    />
  );

  const handleEventClick = (id?: string) => {
    navigate(`/${startRoutePath}/${routeScopeId}/${tabs.clients}/${id}`);
  };

  return (
    <Box data-id="clients" className="page-container">
      <Box className="content">
        <ListItems<IClient, IQuerySortParams, IClientCardProps>
          query={query}
          getItems={getClients}
          RowElement={ClientCard}
          searchDataTestId="btn-search-info"
          searchFormChildren={createUserButton}
          searchContext="clients"
          rowElementProps={{
            onClick: handleEventClick,
          }}
        />
      </Box>
    </Box>
  );
};

export const ClientsList = connect(mapStateToProps)(ClientsListComponent);
