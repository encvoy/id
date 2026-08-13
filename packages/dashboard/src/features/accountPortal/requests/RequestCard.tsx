import { FC } from "react";
import { Card, ICardProps } from "@encvoy-id/components";
import { useTranslation } from "react-i18next";
import {
  IInvitation,
  useConfirmUserInvitationMutation,
  useDeleteUserInvitationMutation,
} from "src/shared/api/invitation";
import styles from "./RequestCard.module.css";
import { CustomIcon } from "@encvoy-id/components";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import clsx from "clsx";
import { IconsLibrary } from "@encvoy-id/components";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import { getImageURL } from "src/shared/utils/helpers";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import Link from "@mui/material/Link";
import { setNoticeInfo } from "src/shared/slices/noticesSlice";
import { useDispatch } from "react-redux";
import { Typography } from "@mui/material";
import { getLocalizedTextValue } from "src/shared/utils/locales";

export interface IRequestCardProps extends ICardProps {
  items: IInvitation[];
  index: number;
  updateItems: (items: IInvitation[], totalCount: number) => void;
  userId: string;
}

export const RequestCard: FC<IRequestCardProps> = (props) => {
  const { t: translate, i18n } = useTranslation();
  const dispatch = useDispatch();

  const { items, index, updateItems, userId } = props;
  const request = items[index] || {};
  const date = new Date(request.created_at).toLocaleDateString(i18n.language);
  const clientName = getLocalizedTextValue(request.client?.name, i18n.language);

  const [deleteInvitation] = useDeleteUserInvitationMutation();
  const [confirmInvitation] = useConfirmUserInvitationMutation();

  const handleDelete = async () => {
    try {
      await deleteInvitation({
        userId,
        invitationId: items[index].id,
      }).unwrap();
      const newItems = [...items];
      newItems.splice(index, 1);
      updateItems(newItems, newItems.length);
      dispatch(setNoticeInfo(translate("info.requestCancel")));
    } catch (error) {
      console.error("fetchDeleteRequest", error);
    }
  };

  const handleConfirm = async () => {
    try {
      await confirmInvitation({
        userId,
        invitationId: items[index].id,
      }).unwrap();
      const newItems = [...items];
      newItems.splice(index, 1);
      updateItems(newItems, newItems.length);
      dispatch(setNoticeInfo(translate("info.requestConfirm")));
    } catch (error) {
      console.error("fetchConfirmRequest", error);
    }
  };

  return (
    <Card
      {...props}
      cardId={request.id}
      isImage
      DefaultIcon={MarkEmailReadOutlinedIcon}
      content={
        <Box className={styles.invite} key={request.id}>
          <div className={styles.inviteHeader}>
            <div>
              <Typography color="text.secondary">
                {translate("pages.request.title")}
              </Typography>
              <Box>
                <Typography className={clsx("text-14", styles.inviteText)}>
                  {clientName}
                </Typography>
                <Typography className={clsx("text-14", styles.hideText)}>
                  <Link
                    className={styles.link}
                    href={request.client?.domain}
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {request.client?.domain}
                  </Link>
                </Typography>
              </Box>
            </div>
            {request.client?.avatar ? (
              <Avatar
                variant="square"
                src={getImageURL(request.client?.avatar)}
                className={styles.clientIcon}
              />
            ) : (
              <CustomIcon
                Icon={LayersOutlinedIcon}
                className={styles.clientIcon}
                color="textSecondary"
              />
            )}
            <Typography color="text.secondary" className="text-12">
              {translate("helperText.send")}:
              <Typography
                component="span"
                className={clsx("text-14", styles.inviteText)}
              >
                {date}
              </Typography>
            </Typography>
          </div>
          <Box sx={{ display: "flex", gap: "16px" }}>
            <IconsLibrary
              title={translate("toolTips.confirm")}
              dataTestId={`btn-profile-request-approve`}
              type="confirm"
              onClick={handleConfirm}
            />
            <IconsLibrary
              title={translate("toolTips.delete")}
              dataTestId={`btn-profile-request-delete`}
              type="delete"
              onClick={handleDelete}
            />
          </Box>
        </Box>
      }
    />
  );
};
