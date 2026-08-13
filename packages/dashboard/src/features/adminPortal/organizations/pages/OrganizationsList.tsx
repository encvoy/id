import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import AddToPhotosOutlinedIcon from "@mui/icons-material/AddToPhotosOutlined";
import { IconWithTooltip } from "@encvoy-id/components";
import { ListItems } from "../../../../shared/ui/CardsList.tsx";
import {
  IClient,
  useCreateOrganizationMutation,
  useLazyGetClientsQuery,
} from "src/shared/api/clients";
import { IQuerySortParams } from "src/shared/api/types";
import { Order } from "src/shared/utils/enums";
import {
  IOrganizationCardProps,
  OrganizationCard,
} from "../components/OrganizationCard";
import { routes, tabs } from "src/shared/utils/enums";
import { refreshTrustedWidgetProfile } from "src/packages/authWidget/helpers/auth";

const OrganizationsListComponent: FC = () => {
  const { appId = "" } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const { t: translate } = useTranslation();
  const [getClients] = useLazyGetClientsQuery();
  const [createOrganization, { isLoading: isCreateOrganizationLoading }] =
    useCreateOrganizationMutation();

  const query = (offset: number, search?: string): IQuerySortParams => ({
    sortBy: "created_at",
    sortDirection: Order.DESC,
    limit: 10,
    offset,
    search: search || "",
    filter: JSON.stringify({
      parent_id: null,
      client_id: { not: appId },
    }),
  });

  const handleCreateOrganization = async () => {
    try {
      const result = await createOrganization().unwrap();
      if (result?.orgId) {
        refreshTrustedWidgetProfile();
        navigate(`/${routes.customer}/${result.orgId}/${tabs.settings}`);
      }
    } catch (error) {
      console.error("create organization rejected", error);
    }
  };

  return (
    <Box data-id="organizations" className="page-container">
      <Box className="content">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
            gap: 2,
          }}
        >
          <Typography className="title-medium">
            {translate("tabs.organizations")}
          </Typography>
          <IconWithTooltip
            title={translate("pages.organizations.actions.createOrganization")}
            Icon={AddToPhotosOutlinedIcon}
            onClick={handleCreateOrganization}
            disabled={isCreateOrganizationLoading}
          />
        </Box>

        <ListItems<IClient, IQuerySortParams, IOrganizationCardProps>
          query={query}
          getItems={getClients}
          RowElement={OrganizationCard}
          searchDataTestId="btn-search-info"
          searchContext="organizations"
        />
      </Box>
    </Box>
  );
};

export const OrganizationsList = OrganizationsListComponent;
