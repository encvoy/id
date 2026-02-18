import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import BookmarksOutlinedIcon from "@mui/icons-material/BookmarksOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import InsertLinkOutlinedIcon from "@mui/icons-material/InsertLinkOutlined";
import SwapHorizontalCircleOutlined from "@mui/icons-material/SwapHorizontalCircleOutlined";
import KeyOutlinedIcon from "@mui/icons-material/KeyOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import TodayOutlinedIcon from "@mui/icons-material/TodayOutlined";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import { SvgIconProps } from "@mui/material/SvgIcon";
import { ElementType, FC } from "react";
import { useDispatch } from "react-redux";
import { getImageURL } from "src/shared/utils/helpers";
import { setNoticeInfo } from "src/shared/lib/noticesSlice";
import { IClientFull } from "src/shared/api/clients";
import {
  EGetProviderAction,
  useGetProvidersQuery,
} from "src/shared/api/provider";
import { CustomIcon } from "src/shared/ui/components/CustomIcon";
import { IconWithTooltip } from "src/shared/ui/components/IconWithTooltip";
import { useTranslation } from "react-i18next";
import styles from "./ClientDetailsAddInfo.module.css";
import Typography from "@mui/material/Typography";
import { componentBorderRadius } from "src/shared/theme/Theme";

interface IAddInfoProps {
  client: IClientFull;
  totalCount?: number;
}

const AddInfoComponent: FC<IAddInfoProps> = ({ client, totalCount }) => {
  const { t: translate, i18n } = useTranslation();
  const { domain, created_at, catalog, client_id, client_secret, parent } =
    client;
  const dispatch = useDispatch();
  const { data: providers } = useGetProvidersQuery({
    client_id: client_id ?? "",
    query: {
      only_active: true,
      action: EGetProviderAction.all,
    },
  });

  const items: {
    icon: ElementType<SvgIconProps>;
    text: string;
    copyValue: string;
  }[] = [];
  const dataToCheck = [
    {
      condition: domain,
      icon: InsertLinkOutlinedIcon,
      text: domain,
      copyValue: domain,
    },
    {
      condition: created_at,
      icon: TodayOutlinedIcon,
      text: new Date(created_at).toLocaleDateString(i18n.language) ?? "",
      copyValue: "",
    },
    {
      condition: catalog !== undefined,
      icon: BookmarksOutlinedIcon,
      text: translate(
        `pages.clientDetails.${
          catalog ? "catalogDisplayed" : "catalogNotDisplayed"
        }`
      ),
      copyValue: "",
    },
    {
      condition: client_id,
      icon: BadgeOutlinedIcon,
      text: translate("pages.clientDetails.clientIdLabel"),
      copyValue: client_id,
    },
    {
      condition: client_secret,
      icon: KeyOutlinedIcon,
      text: translate("pages.clientDetails.clientSecretLabel"),
      copyValue: client_secret,
    },
    {
      condition: totalCount?.toString(),
      icon: PeopleAltOutlinedIcon,
      text: `${translate(
        "pages.clientDetails.participantsCount"
      )} ${totalCount}`,
      copyValue: "",
    },
    {
      condition: parent,
      icon: HomeWorkOutlinedIcon,
      text: parent?.name,
      copyValue: parent?.name,
    },
  ];

  dataToCheck.forEach(({ condition, icon, text, copyValue }) => {
    if (condition && text) {
      items.push({ icon, text, copyValue: copyValue ?? "" });
    }
  });

  const textWrapper = (text: string, isText: boolean) => {
    if (isText) {
      return <Typography className="text-14">{text}</Typography>;
    } else {
      return (
        <Link className={styles.link} href={client?.domain} target="_blank">
          {client?.domain}
        </Link>
      );
    }
  };

  const handleCopy = (value: string, text: string) => {
    navigator.clipboard.writeText(value);
    dispatch(
      setNoticeInfo(translate("pages.clientDetails.copiedMessage", { text }))
    );
  };

  return (
    <Box
      className={styles.addInfoContent}
      sx={{ borderRadius: componentBorderRadius }}
    >
      <div>
        {items.map((item, index) => (
          <div key={index} className={styles.addInfoItem}>
            <CustomIcon
              color="textSecondary"
              Icon={item.icon}
              className={styles.icon}
            />
            {textWrapper(item.text, item.copyValue !== domain)}
            {!!item.copyValue && (
              <Button
                data-id="copy-button"
                className={styles.buttonCopy}
                onClick={() => handleCopy(item.copyValue, item.text)}
              >
                <CustomIcon
                  color="textSecondary"
                  Icon={ContentCopyOutlinedIcon}
                  className={styles.iconCopy}
                />
              </Button>
            )}
          </div>
        ))}
      </div>
      <Box>
        <div className={styles.divider} />
        <Typography color="text.secondary" className="text-14">
          {translate("pages.clientDetails.activeLoginMethods")}
        </Typography>
        <Box className={styles.providers}>
          {providers?.length ? (
            providers.map((item) => (
              <div key={item?.id}>
                <IconWithTooltip title={item?.name} staticHover>
                  {item?.avatar ? (
                    <Avatar
                      src={getImageURL(item?.avatar)}
                      className={styles.providerIcon}
                      variant="square"
                    />
                  ) : (
                    <CustomIcon
                      Icon={SwapHorizontalCircleOutlined}
                      className={styles.providerIcon}
                      color="textSecondary"
                      sx={{ width: "35px", height: "35px" }}
                    />
                  )}
                </IconWithTooltip>
              </div>
            ))
          ) : (
            <Typography color="custom.error" className="text-14">
              {translate("pages.clientDetails.providersEmpty")}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export const ClientDetailsAddInfo = AddInfoComponent;
