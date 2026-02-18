import { FC, useState } from "react";
import { connect } from "react-redux";
import { Order } from "src/shared/utils/enums";
import { IScope, useLazyGetUserScopesQuery } from "src/shared/api/users";
import { IQueryPropsWithId } from "src/shared/api/types";
import { RootState } from "../../../app/store/store";
import {
  SubmitModal,
  ISubmitModalProps,
} from "src/shared/ui/modal/SubmitModal";
import { ListItems } from "../../../shared/ui/listElements";
import CardScope, { ICardScopeProps } from "./ScopeCard";
import Box from "@mui/material/Box";
import { TUserSlice } from "src/shared/lib/userSlice";
import { useTranslation } from "react-i18next";
import Typography from "@mui/material/Typography";

const mapStateToProps = (state: RootState) => ({
  UserProfile: state.user.profile,
});

interface IScopesListProps {
  UserProfile: TUserSlice["profile"];
}

const ScopesListComponent: FC<IScopesListProps> = ({ UserProfile }) => {
  const { t: translate } = useTranslation();
  const [modalProps, setModalProps] = useState<ISubmitModalProps>({
    isOpen: false,
    onSubmit: () => {},
    onClose: () => {},
    title: "",
    actionButtonText: "",
    mainMessage: [],
  });
  const userId = UserProfile.id;
  const [getScopes] = useLazyGetUserScopesQuery();
  const query = (offset: number, search?: string): IQueryPropsWithId => {
    return {
      query: {
        sortBy: "created_at",
        sortDirection: Order.DESC,
        limit: "10",
        offset,
        search: search || "",
      },
      id: String(userId),
    };
  };

  return (
    <Box data-id="scopes" className="page-container">
      <Box className="content">
        {userId ? (
          <>
            <ListItems<IScope, IQueryPropsWithId, ICardScopeProps>
              query={query}
              getItems={getScopes}
              RowElement={CardScope}
              rowElementProps={{
                userId,
                setModalProps: setModalProps,
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
          </>
        ) : (
          <Typography>{translate("helperText.loading")}</Typography>
        )}
      </Box>
    </Box>
  );
};

export const ScopesList = connect(mapStateToProps)(ScopesListComponent);
