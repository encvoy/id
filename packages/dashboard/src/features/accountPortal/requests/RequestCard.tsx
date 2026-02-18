import { FC } from "react";
import { Card, ICardProps } from "src/shared/ui/components/Card";
import { useTranslation } from "react-i18next";
import {
  IInvitation,
  useConfirmUserInvitationMutation,
  useDeleteUserInvitationMutation,
} from "src/shared/api/invitation";
import styles from "./RequestCard.module.css";
import { CustomIcon } from "src/shared/ui/components/CustomIcon";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import clsx from "clsx";
import { IconsLibrary } from "src/shared/ui/components/IconLibrary";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import { getImageURL } from "src/shared/utils/helpers";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import Link from "@mui/material/Link";
import { setNoticeInfo } from "src/shared/lib/noticesSlice";
import { useDispatch } from "react-redux";
import { Typography } from "@mui/material";

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
                  {request.client?.name}
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
            <IconsLibrary type="confirm" onClick={handleConfirm} />
            <IconsLibrary type="delete" onClick={handleDelete} />
          </Box>
        </Box>
      }
    />
  );
};
