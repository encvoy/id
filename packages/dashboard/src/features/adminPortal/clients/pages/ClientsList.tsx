import AddToPhotosOutlinedIcon from "@mui/icons-material/AddToPhotosOutlined";
import Box from "@mui/material/Box";
import { FC } from "react";
import { connect } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { ERoles, Order, routes, subTabs, tabs } from "src/shared/utils/enums";
import { RootState } from "src/app/store/reducer";
import { IClient, useLazyGetClientsQuery } from "src/shared/api/clients";
import { IQuerySortParams } from "src/shared/api/types";
import { ListItems } from "../../../../shared/ui/listElements";
import { ClientCard, IClientCardProps } from "../components/ClientCard";
import { TAppSlice } from "src/shared/lib/appSlice";
import { TUserSlice } from "src/shared/lib/userSlice";
import { useTranslation } from "react-i18next";
import { IconWithTooltip } from "../../../../shared/ui/components/IconWithTooltip";

const mapStateToProps = (state: RootState) => ({
  startRoutePath: state.app.startRoutePath,
  roleInApp: state.user.roleInApp,
});

interface IClientsListProps {
  startRoutePath: TAppSlice["startRoutePath"];
  roleInApp: TUserSlice["roleInApp"];
}

const ClientsListComponent: FC<IClientsListProps> = ({
  startRoutePath,
  roleInApp,
}) => {
  const { appId = "" } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const { t: translate } = useTranslation();
  const [getClients] = useLazyGetClientsQuery();
  const query = (offset: number, search?: string): IQuerySortParams => {
    return {
      sortBy: "created_at",
      sortDirection: Order.DESC,
      limit: "10",
      offset,
      search: search || "",
      filter:
        roleInApp !== ERoles.ADMIN
          ? `{"parent_id": { "not": null }}`
          : startRoutePath === routes.customer
          ? `{"parent_id": "${appId}"}`
          : `{"parent_id": { "not": "${appId}"  }}`,
    };
  };

  const createUserButton = (
    <IconWithTooltip
      title={translate("pages.listClient.createButton")}
      Icon={AddToPhotosOutlinedIcon}
      onClick={() =>
        navigate(
          `/${startRoutePath}/${appId}/${tabs.clients}/${subTabs.create}`
        )
      }
    />
  );

  const handleEventClick = (id?: string) => {
    navigate(`/${startRoutePath}/${appId}/${tabs.clients}/${id}`);
  };

  return (
    <Box data-id="clients" className="page-container">
      <Box className="content">
        <ListItems<IClient, IQuerySortParams, IClientCardProps>
          query={query}
          getItems={getClients}
          RowElement={ClientCard}
          searchFormChildren={createUserButton}
          rowElementProps={{
            onClick: handleEventClick,
          }}
        />
      </Box>
    </Box>
  );
};

export const ClientsList = connect(mapStateToProps)(ClientsListComponent);
