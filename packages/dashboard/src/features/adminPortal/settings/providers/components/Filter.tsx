import { FC, RefObject, useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Popover from "@mui/material/Popover";
import clsx from "clsx";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import styles from "./Filter.module.css";
import { IProvider } from "src/shared/api/provider";
import { useParams } from "react-router-dom";
import { CLIENT_ID } from "src/shared/utils/constants";
import { useTranslation } from "react-i18next";
import Typography from "@mui/material/Typography";

interface IFilterProps {
  anchorPopover: RefObject<HTMLButtonElement>;
  updateProviders: (value: IProvider[]) => void;
  items?: IProvider[];
}

const FilterComponent: FC<IFilterProps> = ({
  anchorPopover,
  items,
  updateProviders,
}) => {
  const { appId = "", clientId = "" } =
    useParams<{ appId: string; clientId: string }>();
  const { t: translate } = useTranslation();

  const filterMethods = {
    all: translate("providers.filter.all"),
    public: translate("providers.filter.public"),
    private: translate("providers.filter.private"),
  };

  const [selectedFilter, setSelectedFilter] = useState<string>(
    filterMethods.all
  );
  const [isOpen, setIsOpen] = useState(false);
  const filter = [
    filterMethods.all,
    filterMethods.public,
    filterMethods.private,
  ];

  useEffect(() => {
    filteredItems(selectedFilter, items);
  }, [selectedFilter, items]);

  const filteredItems = (selectedFilter: string, items?: IProvider[]) => {
    const filtered = items
      ?.slice()
      ?.filter((p) => {
        switch (selectedFilter) {
          case filterMethods.public:
            return p?.is_public;
          case filterMethods.private:
            return clientId
              ? p?.client_id === clientId
              : p?.client_id === appId;
          default:
            return true;
        }
      })
      .sort((a, b) => {
        if (a.is_active !== b.is_active) return !a.is_active ? 1 : -1;
        return a.client_id === CLIENT_ID ? 1 : -1;
      });
    updateProviders(filtered || []);
  };

  return (
    <div className={styles.filter}>
      <Button
        ref={anchorPopover}
        onClick={() => setIsOpen(true)}
        endIcon={<KeyboardArrowDownOutlinedIcon fill="#B6BAC6" />}
      >
        <Typography className="text-14" color="text.secondary">
          {translate("providers.filter.title")}
        </Typography>
        <Typography className={clsx("text-14", styles.filterText)}>
          {selectedFilter}
        </Typography>
      </Button>
      <Popover
        classes={{ paper: styles.popover }}
        open={isOpen}
        anchorEl={anchorPopover.current}
        onClose={() => setIsOpen(false)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        {filter.map((item) => (
          <Button
            key={item}
            onClick={() => {
              setSelectedFilter(item);
              setIsOpen(false);
            }}
            startIcon={
              <CheckOutlinedIcon
                className={clsx(styles.popoverButtonIcon, {
                  [styles.popoverButtonIconHidden]: item !== selectedFilter,
                })}
              />
            }
          >
            {item}
          </Button>
        ))}
      </Popover>
    </div>
  );
};

export const Filter = FilterComponent;
