import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import clsx from "clsx";
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
import { AccordionBlock } from "src/shared/ui/components/AccordionBlock";
import { Card, ICardProps } from "src/shared/ui/components/Card";
import { CustomIcon } from "src/shared/ui/components/CustomIcon";
import { IconsLibrary } from "src/shared/ui/components/IconLibrary";
import { ListItems } from "src/shared/ui/listElements";
import { SubmitModal } from "src/shared/ui/modal/SubmitModal";
import { getRulesIcon } from "src/shared/ui/ProfileFields";
import { Order } from "src/shared/utils/enums";
import { isValidEmail, randomString } from "src/shared/utils/helpers";
import styles from "./ClientInvitations.module.css";

interface IClientInvitationsProps {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export const ClientInvitations: FC<IClientInvitationsProps> = ({
  isOpen,
  setIsOpen,
}) => {
  const { clientId = "" } = useParams<{ clientId: string }>();
  const { t: translate } = useTranslation();

  const [chips, setChips] = useState<IChipProps[]>([]);
  const [errorEmails, setErrorEmails] = useState<{
    [key: string]: string[];
  }>({});
  const [count, setCount] = useState(0);
  const [update, setUpdate] = useState(false);

  const { data: emailValidationRules = [] } =
    useGetRuleValidationsByFieldNameQuery("email");
  const [getClientInvitation] = useLazyGetInvitationsQuery();
  const [createInvite] = useCreateInvitationMutation();

  const query = (offset: number): IQueryPropsWithId => {
    return {
      query: {
        sortBy: "created_at",
        sortDirection: Order.DESC,
        limit: "10",
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
      <div className={styles.inviteBlock}>
        <AccordionBlock
          titleBlock={
            <div className={styles.inviteTitle}>
              <CustomIcon
                Icon={SendOutlinedIcon}
                className={styles.inviteIcon}
                color="textSecondary"
              />
              <Typography className="text-15-medium">
                {translate("pages.clientDetails.invitationTitle", {
                  value: count,
                })}
              </Typography>
            </div>
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
      </div>

      <SubmitModal
        title={translate("pages.clientDetails.invitationModalTitle")}
        isOpen={isOpen}
        onClose={onClose}
        disabled={!chips.length}
        onSubmit={handleModalSubmit}
        actionButtonText={translate("actionButtons.send")}
      >
        <ScopeChips
          chips={chips}
          setChips={setChips}
          description={translate("pages.clientDetails.emailsRequest")}
          validateFieldFn={validationEmail}
          setErrors={setErrorEmails}
          errors={errorEmails}
          children={getRulesIcon(
            "email",
            [],
            emailValidationRules.map((item) => item.title)
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
        <Box className={styles.invite}>
          <Box className={styles.inviteHeader}>
            <CustomIcon
              Icon={MarkEmailReadOutlinedIcon}
              color="textSecondary"
            />
            <Typography color="text.secondary" className="text-12">
              {translate("helperText.send")}:
              <Typography
                component="span"
                className={clsx("text-14", styles.inviteText)}
              >
                {date}
              </Typography>
            </Typography>

            <Typography color="text.secondary" className="text-12">
              {translate("helperText.recipient")}:
              <Typography
                component="span"
                className={clsx("text-14", styles.inviteText)}
              >
                {invitation.email}
              </Typography>
            </Typography>
          </Box>
          <IconsLibrary type="delete" onClick={handleDelete} />
        </Box>
      }
    />
  );
};
