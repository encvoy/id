import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import clsx from "clsx";
import { FC, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { IExternalAccount, IUserProfile } from "src/shared/api/users";
import styles from "./SearchAvatarsModal.module.css";
import { ModalInfo } from "src/shared/ui/modal/ModalInfo";
import Typography from "@mui/material/Typography";

interface ISearchAvatarsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountsWithAvatars: IExternalAccount[];
}

export const SearchAvatarsModal: FC<ISearchAvatarsModalProps> = ({
  isOpen,
  onClose,
  accountsWithAvatars,
}) => {
  const [searchAvatarValue, setSearchAvatarValue] = useState("");

  const { setValue } = useFormContext<IUserProfile>();
  const { t: translate } = useTranslation();

  const filteredExternalAccounts = accountsWithAvatars?.filter((account) => {
    return account.label
      ?.toLowerCase()
      .includes(searchAvatarValue.toLowerCase());
  });

  const handleAvatarSelect = (avatar: string) => {
    setValue("picture", avatar, {
      shouldDirty: true,
    });
    onClose();
  };

  return (
    <ModalInfo
      title={translate("pages.profile.modals.searchAvatars.title")}
      isOpen={isOpen}
      onClose={onClose}
    >
      <Typography
        className={clsx("text-14", styles["input-description"])}
        color="text.secondary"
      >
        {translate("pages.profile.modals.searchAvatars.description")}
      </Typography>

      <TextField
        fullWidth
        value={searchAvatarValue}
        onChange={(e) => setSearchAvatarValue(e.target.value)}
        className={clsx("custom", styles.search)}
        variant="standard"
        placeholder={translate(
          "pages.profile.modals.searchAvatars.searchPlaceholder"
        )}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlinedIcon className={styles["search-icon"]} />
              </InputAdornment>
            ),
          },
        }}
      />

      <div className={styles["providers-wrapper"]}>
        {!!accountsWithAvatars?.length && !filteredExternalAccounts?.length && (
          <div className={styles.emptySearchStatus}>
            <SearchOutlinedIcon />
            <Typography color="text.secondary">
              {translate("info.emptySearch")}
            </Typography>
          </div>
        )}

        {filteredExternalAccounts?.map((account) => (
          <div
            className={styles.provider}
            onClick={() => handleAvatarSelect(account.avatar || "")}
            key={account.id}
          >
            <div className={styles["account-icon-wrapper"]}>
              <img src={account.avatar} className={styles["account-icon"]} />
            </div>
            <div className={styles["account-name-wrapper"]}>
              <Typography className="text-14">{account.label}</Typography>
              <Typography className="text-12" color="text.secondary">
                {account.type}
              </Typography>
            </div>
          </div>
        ))}
      </div>
    </ModalInfo>
  );
};
