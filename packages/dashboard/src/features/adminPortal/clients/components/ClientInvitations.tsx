import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Dispatch, FC, SetStateAction, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import {
  IChipProps,
  ScopeChips,
} from "src/features/adminPortal/settings/providers/components/ScopeChips";
import {
  IInvitation,
  useCreateInvitationMutation,
  useDeleteInvitationMutation,
  useLazyGetInvitationsQuery,
} from "src/shared/api/invitation";
import { useGetRuleValidationsByFieldNameQuery } from "src/shared/api/settings";
import { IQueryPropsWithId } from "src/shared/api/types";
import { AccordionBlock } from "@encvoy-id/components";
import { Card, ICardProps } from "@encvoy-id/components";
import { CustomIcon } from "@encvoy-id/components";
import { IconsLibrary } from "@encvoy-id/components";
import { ListItems } from "src/shared/ui/CardsList.tsx";
import { SubmitModal } from "@encvoy-id/components";
import { getRulesIcon } from "src/shared/ui/ProfileFields";
import { Order } from "src/shared/utils/enums";
import { isValidEmail, randomString } from "src/shared/utils/helpers";
import { getLocalizedTextValue } from "src/shared/utils/locales";

export const ClientInvitations: FC = () => {
  const { clientId = "" } = useParams<{ clientId: string }>();
  const { t: translate, i18n } = useTranslation();

  const [chips, setChips] = useState<IChipProps[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [errorEmails, setErrorEmails] = useState<{
    [key: string]: string[];
  }>({});
  const [count, setCount] = useState(0);
  const [update, setUpdate] = useState(false);

  const { data: emailValidationRules = [] } =
    useGetRuleValidationsByFieldNameQuery(
      {
        client_id: clientId,
        field_name: "email",
      },
      {
        skip: !clientId,
      }
    );
  const [getClientInvitation] = useLazyGetInvitationsQuery();
  const [createInvite] = useCreateInvitationMutation();

  const query = (offset: number): IQueryPropsWithId => {
    return {
      query: {
        sortBy: "created_at",
        sortDirection: Order.DESC,
        limit: 10,
        offset,
      },
      id: clientId,
    };
  };

  const getCount = async () => {
    const data = await getClientInvitation(query(0), true).unwrap();
    setCount(data?.totalCount || 0);
  };

  useEffect(() => {
    getCount();
  }, []);

  const handleModalSubmit = async () => {
    const listEmails = chips.map((item) => item.value);
    if (!listEmails.length) return;

    const errorList: IChipProps[] = [];

    try {
      const emails = await createInvite({
        clientId: clientId,
        emails: listEmails,
      }).unwrap();
      emails.map((item) => {
        errorList.push({ key: randomString(10), value: item, isError: true });
      });
    } catch (error) {
      console.error("fetchCreateInvitation", error);
    }

    await getCount();
    setUpdate(true);
    if (errorList.length) {
      setChips(errorList);
      setErrorEmails({
        [translate("pages.clientDetails.emailsError")]: [""],
      });
    } else {
      setChips([]);
      setIsOpen(false);
    }
  };

  const validationEmail = (value: string) => {
    if (!isValidEmail(value)) {
      return translate("errors.invalidEmailFormat");
    }

    return "";
  };

  const onClose = () => {
    setIsOpen(false);
    setErrorEmails({});
    setChips([]);
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          gap: "16px",
          alignItems: "flex-start",
          marginBottom: "16px",
        }}
      >
        <AccordionBlock
          dataTestId="ddl-application-users-invite"
          titleBlock={
            <Box sx={{ display: "flex", alignItems: "center", gap: "2px" }}>
              <CustomIcon
                Icon={SendOutlinedIcon}
                color="textSecondary"
                sx={{
                  width: "24px",
                  height: "24px",
                  marginRight: "6px",
                  borderRadius: "12px",
                  flexShrink: 0,
                  background: "var(--hover-background-color)",
                  padding: "2px",
                }}
              />
              <Typography className="text-15-medium">
                {translate("pages.clientDetails.invitationTitle", {
                  value: count,
                })}
              </Typography>
            </Box>
          }
        >
          <ListItems<IInvitation, IQueryPropsWithId, IInvitationCardProps>
            query={query}
            getItems={getClientInvitation}
            RowElement={InvitationCard}
            customUpdate={update}
            setCustomUpdate={setUpdate}
            rowElementProps={{
              setCount,
            }}
            isSearchActive={false}
          />
        </AccordionBlock>
        <Button
          sx={{ padding: "18px" }}
          variant="contained"
          data-test-id="btn-application-invite"
          onClick={() => setIsOpen(true)}
        >
          Invite
        </Button>
      </Box>

      <SubmitModal
        cancelText={translate("actionButtons.cancel")}
        deleteText={translate("actionButtons.delete")}
        title={translate("pages.clientDetails.invitationModalTitle")}
        isOpen={isOpen}
        onClose={onClose}
        disabled={!chips.length}
        onSubmit={handleModalSubmit}
        actionButtonText={translate("actionButtons.send")}
      >
        <ScopeChips
          inputDataTestId="txt-user-email"
          chips={chips}
          setChips={setChips}
          description={translate("pages.clientDetails.emailsRequest")}
          validateFieldFn={validationEmail}
          setErrors={setErrorEmails}
          errors={errorEmails}
          children={getRulesIcon(
            "email",
            translate,
            i18n.language,
            [],
            emailValidationRules.map((item) =>
              getLocalizedTextValue(item.title, i18n.language)
            )
          )}
        />
      </SubmitModal>
    </>
  );
};

interface IInvitationCardProps extends ICardProps {
  items: IInvitation[];
  index: number;
  updateItems: (items: IInvitation[], totalCount: number) => void;
  setCount: Dispatch<SetStateAction<number>>;
}

const InvitationCard: FC<IInvitationCardProps> = (props) => {
  const { clientId = "" } = useParams<{ clientId: string }>();
  const { t: translate, i18n } = useTranslation();
  const [deleteInvite] = useDeleteInvitationMutation();

  const { items, index, updateItems, setCount } = props;
  const invitation = items[index] || {};
  const date = new Date(invitation.created_at).toLocaleDateString(
    i18n.language
  );

  const handleDelete = async () => {
    try {
      await deleteInvite({ clientId, invitationId: invitation.id }).unwrap();
      const newItems = [...items];
      newItems.splice(index, 1);
      updateItems(newItems, newItems.length);
      setCount((prev) => prev - 1);
    } catch (error) {
      console.error("fetchDeleteInvite", error);
    }
  };

  return (
    <Card
      {...props}
      cardId={invitation.id}
      content={
        <Box
          sx={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            justifyContent: "space-between",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "4px 18px",
              flexWrap: "wrap",
            }}
          >
            <CustomIcon
              Icon={MarkEmailReadOutlinedIcon}
              color="textSecondary"
            />
            <Typography color="text.secondary" className="text-12">
              {translate("helperText.send")}:
              <Typography
                component="span"
                className="text-14"
                sx={{ display: "inline-block" }}
              >
                {date}
              </Typography>
            </Typography>

            <Typography color="text.secondary" className="text-12">
              {translate("helperText.recipient")}:
              <Typography
                component="span"
                className="text-14"
                sx={{ display: "inline-block" }}
              >
                {invitation.email}
              </Typography>
            </Typography>
          </Box>
          <IconsLibrary
            title={translate("toolTips.delete")}
            type="delete"
            dataTestId="btn-application-user-delete"
            onClick={handleDelete}
          />
        </Box>
      }
    />
  );
};
