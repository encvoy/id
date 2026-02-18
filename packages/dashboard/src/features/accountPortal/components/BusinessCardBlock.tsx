import InsertLinkOutlinedIcon from "@mui/icons-material/InsertLinkOutlined";
import QrCode2OutlinedIcon from "@mui/icons-material/QrCode2Outlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useDispatch } from "react-redux";
import { DOMAIN } from "src/shared/utils/constants";
import { isObjectEmpty } from "src/shared/utils/helpers";
import { setNoticeInfo } from "src/shared/lib/noticesSlice";
import {
  ICards,
  useGetCardQuery,
  useUpdateCardMutation,
} from "src/shared/api/cards";
import { ModalInfo } from "src/shared/ui/modal/ModalInfo";
import { InputField } from "src/shared/ui/components/InputBlock";
import styles from "./BusinessCardBlock.module.css";
import { IconWithTooltip } from "src/shared/ui/components/IconWithTooltip";
import { useTranslation } from "react-i18next";
import Typography from "@mui/material/Typography";

export const BusinessCardBlock = ({ userId }: { userId?: string }) => {
  const dispatch = useDispatch();
  const { t: translate } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [qrcode, setQrcode] = useState<string>("");
  const { data } = useGetCardQuery(userId || "", {
    skip: !userId,
  });
  const [updateCard] = useUpdateCardMutation();

  const methods = useForm<ICards>({
    defaultValues: data,
  });
  const {
    control,
    handleSubmit,
    register,
    formState: { dirtyFields },
    reset,
  } = methods;

  useEffect(() => {
    reset(data);
  }, [data]);

  const onSubmit = async (data: ICards) => {
    try {
      await updateCard({ userId: userId || "", data }).unwrap();
    } catch (error) {
      console.error(error);
    }
  };

  const openQrcodeModal = async () => {
    const qrcode = await QRCode.toDataURL(
      DOMAIN + "/api/cards/" + (data?.card_url || userId)
    );
    setQrcode(qrcode);
    setIsOpen(true);
  };

  const openCard = async () => {
    const cardUrl = DOMAIN + "/api/cards/" + (data?.card_url || userId);
    window.open(cardUrl, "_blank");
  };

  const handleCopy = async () => {
    navigator.clipboard.writeText(
      DOMAIN + "/api/cards/" + (data?.card_url || userId)
    );
    dispatch(setNoticeInfo(translate("info.dataCopied")));
  };

  const cardActive = useWatch({
    control,
    name: "card_active",
    defaultValue: false,
  });

  return (
    <>
      <FormProvider {...methods}>
        <form>
          <div className={styles.switcher}>
            <div>
              <Typography className="text-14">
                {translate("pages.profile.businessCard.activity.title")}
              </Typography>
              <Typography className="text-12" color="text.secondary">
                {translate("pages.profile.businessCard.activity.description")}
              </Typography>
            </div>
            <Switch checked={cardActive} {...register("card_active")} />
          </div>
          <InputField
            name={"card_url"}
            label={translate("pages.profile.businessCard.fields.cardUrl.label")}
            description={translate(
              "pages.profile.businessCard.fields.cardUrl.description"
            )}
          />
          <div className={styles.buttonsContainer}>
            <IconWithTooltip
              onClick={openCard}
              disabled={!cardActive}
              Icon={VisibilityOutlinedIcon}
              title={translate(
                "pages.profile.businessCard.tooltips.openPreview"
              )}
            />
            <IconWithTooltip
              customStyleButton={styles.button}
              onClick={openQrcodeModal}
              disabled={!cardActive}
              Icon={QrCode2OutlinedIcon}
              title={translate(
                "pages.profile.businessCard.tooltips.openQrCode"
              )}
            />
            <IconWithTooltip
              onClick={handleCopy}
              disabled={!cardActive}
              Icon={InsertLinkOutlinedIcon}
              title={translate("pages.profile.businessCard.tooltips.copyLink")}
            />
            <Button
              className={styles.button}
              onClick={handleSubmit(onSubmit)}
              disabled={isObjectEmpty(dirtyFields)}
              variant="contained"
              type="submit"
            >
              {translate("actionButtons.save")}
            </Button>
          </div>
        </form>
      </FormProvider>

      <ModalInfo isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <img className={styles.qrcodeImage} src={qrcode} />
      </ModalInfo>
    </>
  );
};
