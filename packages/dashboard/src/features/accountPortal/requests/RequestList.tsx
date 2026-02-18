import Box from "@mui/material/Box";
import { FC } from "react";
import { IQueryPropsWithId } from "src/shared/api/types";
import { ListItems } from "../../../shared/ui/listElements";
import {
  IInvitation,
  useLazyGetUsersInvitationsQuery,
} from "src/shared/api/invitation";
import {
  IRequestCardProps,
  RequestCard,
} from "src/features/accountPortal/requests/RequestCard";
import { useSelector } from "react-redux";
import { RootState } from "src/app/store/reducer";
import { Order } from "src/shared/utils/enums";

export const RequestList: FC = () => {
  const userId = useSelector(({ user }: RootState) => user.profile.id);
  const [getRequests] = useLazyGetUsersInvitationsQuery();

  const query = (offset: number, search?: string): IQueryPropsWithId => {
    return {
      query: {
        sortBy: "created_at",
        sortDirection: Order.DESC,
        limit: "10",
        offset,
        search: search || "",
      },
      id: userId || "",
    };
  };

  return (
    <Box data-id="requests" className="page-container">
      <Box className="content">
        {userId && (
          <ListItems<IInvitation, IQueryPropsWithId, IRequestCardProps>
            query={query}
            getItems={getRequests}
            RowElement={RequestCard}
            rowElementProps={{ userId }}
          />
        )}
      </Box>
    </Box>
  );
};
