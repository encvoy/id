import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { Dispatch, FC, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import {
  IPersonalToken,
  useRevokePersonalTokenMutation,
} from "src/shared/api/tokens";
import { Card, ICardProps } from "@encvoy-id/components";
import { Chip as StatusChip } from "@encvoy-id/components";
import { IconWithTooltip } from "@encvoy-id/components";
import { ISubmitModalProps } from "@encvoy-id/components";
import styles from "./TokenCard.module.css";

export interface ITokenCardProps extends ICardProps {
  items: IPersonalToken[];
  index: number;
  setModalProps: Dispatch<SetStateAction<ISubmitModalProps>>;
  setCustomUpdate: Dispatch<SetStateAction<boolean>>;
  updateItems: (items: IPersonalToken[], totalCount: number) => void;
}

export const TokenCard: FC<ITokenCardProps> = ({
  items,
  index,
  setModalProps,
  setCustomUpdate,
}) => {
  const { t: translate, i18n } = useTranslation();
  const [revokePersonalToken] = useRevokePersonalTokenMutation();

  const token = items[index];
  const createdAt = token?.created_at ? new Date(token.created_at) : null;
  const expiresAt = token?.expires_at ? new Date(token.expires_at) : null;
  const expiresAtLabel = token?.expires_at
    ? expiresAt?.toLocaleString(i18n.language) ||
      translate("helperText.loading")
    : translate("pages.tokens.neverExpiresValue");

  const onCloseModal = () =>
    setModalProps((prev) => {
      return { ...prev, isOpen: false };
    });

  const handleRevoke = async () => {
    await revokePersonalToken({ id: token.id }).unwrap();
    setCustomUpdate(true);
  };
  const revokeModalProps: ISubmitModalProps = {
    isOpen: true,
    onClose: onCloseModal,
    onSubmit: async () => {
      await handleRevoke();
      onCloseModal();
    },
    title: translate("pages.tokens.modals.revoke.title"),
    actionButtonText: translate("actionButtons.revoke"),
    mainMessage: [
      translate("pages.tokens.modals.revoke.mainMessage", {
        tokenName: token?.name || token?.last4,
      }),
    ],
  };

  return (
    <Card
      cardId={token?.id}
      isImage
      figure="circle"
      DefaultIcon={VpnKeyOutlinedIcon}
      content={
        <div className={styles.contentWrapper}>
          <div className={styles.content}>
            <div className={styles.mainInfo}>
              <Typography className="text-17">{token?.name}</Typography>
              <Box sx={{ marginTop: "10px" }}>
                <StatusChip
                  status="active"
                  customText={{ active: translate("statuses.active") }}
                />
              </Box>
            </div>

            <div className={styles.details}>
              <div className={styles.infoGrid}>
                <Box
                  sx={{ display: "flex", gap: "8px", alignItems: "baseline" }}
                >
                  <Typography color="text.secondary" className="text-12">
                    {translate("pages.tokens.createdAt")}
                  </Typography>
                  <Typography className="text-12">
                    {createdAt?.toLocaleString(i18n.language) ||
                      translate("helperText.loading")}
                  </Typography>
                </Box>
                <Box
                  sx={{ display: "flex", gap: "8px", alignItems: "baseline" }}
                >
                  <Typography color="text.secondary" className="text-12">
                    {translate("pages.tokens.expiresAt")}
                  </Typography>
                  <Typography className="text-12">{expiresAtLabel}</Typography>
                </Box>
                <Box
                  sx={{ display: "flex", gap: "8px", alignItems: "baseline" }}
                >
                  <Typography color="text.secondary" className="text-12">
                    {translate("pages.tokens.last4")}
                  </Typography>
                  <Typography className="text-12">
                    {token?.last4 || "-"}
                  </Typography>
                </Box>
              </div>
              <Box className={styles.permissionsBlock}>
                <Typography color="text.secondary" className="text-12">
                  {translate("pages.tokens.permissions")}
                </Typography>
                <Box className={styles.permissions}>
                  {token?.permissions?.map((permission) => (
                    <Chip
                      key={permission}
                      label={permission}
                      size="small"
                      className={styles.permissionChip}
                    />
                  ))}
                </Box>
              </Box>
            </div>
          </div>

          <div className={styles.moreButtonWrapper}>
            <IconWithTooltip
              title={translate("pages.tokens.controls.revoke")}
              Icon={DeleteOutlineOutlinedIcon}
              dataTestId="lnk-profile-additional-tokens-edit"
              onClick={() => setModalProps(revokeModalProps)}
            />
          </div>
        </div>
      }
    />
  );
};
